import type { JourneySegment } from '../schemas/aiSchemas';
import type { DisruptionProvenance } from './disruptionTypes';
import type { RecoveryCandidate } from './recoveryTypes';
import { applyRecoveryCandidate, type RecoveryApplicationState } from './recoveryApplication';
import { itineraryFingerprint } from './journeyFingerprint';

export interface JourneyVersion { readonly version: number; readonly fingerprint: string }
export type JourneyChangeType = 'recovery_route_replacement' | 'recovery_activity_shift';

export type RecordedJourneyAction =
  | { readonly type: 'replace_transport_route'; readonly nodeId: string; readonly before: RouteState; readonly after: RouteState }
  | { readonly type: 'shift_flexible_activity'; readonly nodeId: string; readonly before: ActivityTimeState; readonly after: ActivityTimeState };

export interface RouteState {
  readonly selectedRouteId?: string;
  readonly geometry?: readonly (readonly [number, number])[];
  readonly duration?: number;
  readonly distance?: number;
  readonly estimatedCost?: number;
  readonly costEstimateSource?: string;
  readonly costEstimateModel?: string;
  readonly routingStatus?: string;
}

export interface ActivityTimeState { readonly departureTime?: string; readonly arrivalTime?: string }

export interface JourneyLedgerEntry {
  readonly id: string;
  readonly operation: 'apply' | 'undo';
  readonly previousVersion: number;
  readonly resultingVersion: number;
  readonly previousFingerprint: string;
  readonly resultingFingerprint: string;
  readonly changeType: JourneyChangeType;
  readonly affectedNodeIds: readonly string[];
  readonly disruptionProvenance: DisruptionProvenance;
  readonly recoveryCandidateId: string;
  readonly actions: readonly RecordedJourneyAction[];
  readonly reasonCodes: readonly string[];
  readonly reversesEntryId?: string;
}

export class JourneyChangeLedger {
  private constructor(private readonly entries: readonly JourneyLedgerEntry[]) {}
  static empty(): JourneyChangeLedger { return new JourneyChangeLedger(Object.freeze([])); }
  getEntries(): readonly JourneyLedgerEntry[] { return this.entries; }
  latest(): JourneyLedgerEntry | undefined { return this.entries[this.entries.length - 1]; }
  append(entry: JourneyLedgerEntry): JourneyChangeLedger {
    return new JourneyChangeLedger(Object.freeze([...this.entries, freezeEntry(entry)]));
  }
}

export type JourneyTransactionError = 'stale-plan' | 'stale-version' | 'invalid-version' | 'target-not-found' | 'unsupported-action' | 'route-not-found' | 'fixed-activity';
export type JourneyTransactionResult =
  | { success: true; state: RecoveryApplicationState; version: JourneyVersion; ledger: JourneyChangeLedger; entry: JourneyLedgerEntry }
  | { success: false; state: RecoveryApplicationState; version: JourneyVersion; ledger: JourneyChangeLedger; error: JourneyTransactionError };

export { itineraryFingerprint } from './journeyFingerprint';

export function createJourneyVersion(state: RecoveryApplicationState, version = 0): JourneyVersion {
  if (!Number.isSafeInteger(version) || version < 0) throw new Error('Journey version must be a non-negative safe integer.');
  return Object.freeze({ version, fingerprint: itineraryFingerprint(state) });
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function entryId(entry: Omit<JourneyLedgerEntry, 'id'>): string {
  return `journey-change-${stableHash(JSON.stringify({
    previousFingerprint: entry.previousFingerprint, resultingFingerprint: entry.resultingFingerprint,
    changeType: entry.changeType, affectedNodeIds: [...entry.affectedNodeIds].sort(),
    recoveryCandidateId: entry.recoveryCandidateId, operation: entry.operation, reversesEntryId: entry.reversesEntryId ?? null,
  }))}`;
}

function freezeEntry(entry: JourneyLedgerEntry): JourneyLedgerEntry {
  const actions = entry.actions.map(action => Object.freeze({
    ...action,
    before: Object.freeze({ ...action.before, ...('geometry' in action.before && action.before.geometry ? { geometry: Object.freeze(action.before.geometry.map(point => Object.freeze([...point] as [number, number]))) } : {}) }),
    after: Object.freeze({ ...action.after, ...('geometry' in action.after && action.after.geometry ? { geometry: Object.freeze(action.after.geometry.map(point => Object.freeze([...point] as [number, number]))) } : {}) }),
  })) as unknown as readonly RecordedJourneyAction[];
  return Object.freeze({ ...entry, affectedNodeIds: Object.freeze([...entry.affectedNodeIds]), actions: Object.freeze(actions), reasonCodes: Object.freeze([...entry.reasonCodes]), disruptionProvenance: Object.freeze({ ...entry.disruptionProvenance }) });
}

function routeState(segment: JourneySegment, selectedRouteId?: string): RouteState {
  return {
    selectedRouteId: selectedRouteId ?? segment.selectedRouteCandidateId,
    ...(segment.routeGeometry ? { geometry: segment.routeGeometry.map(point => [...point] as [number, number]) } : {}),
    ...(segment.routeDuration !== undefined ? { duration: segment.routeDuration } : {}),
    ...(segment.routeDistance !== undefined ? { distance: segment.routeDistance } : {}),
    ...(segment.estimatedCost !== undefined ? { estimatedCost: segment.estimatedCost } : {}),
    ...(segment.costEstimateSource ? { costEstimateSource: segment.costEstimateSource } : {}),
    ...(segment.costEstimateModel ? { costEstimateModel: segment.costEstimateModel } : {}),
    ...(segment.routingStatus ? { routingStatus: segment.routingStatus } : {}),
  };
}

function recordedAction(before: RecoveryApplicationState, after: RecoveryApplicationState, candidate: RecoveryCandidate): RecordedJourneyAction {
  const index = before.itinerary.segments.findIndex(segment => segment.activityId === candidate.action.nodeId);
  const previous = before.itinerary.segments[index]; const resulting = after.itinerary.segments[index];
  return candidate.action.type === 'replace_transport_route'
    ? { type: 'replace_transport_route', nodeId: candidate.action.nodeId, before: routeState(previous, before.selectedRouteIds[index]), after: routeState(resulting, after.selectedRouteIds[index]) }
    : { type: 'shift_flexible_activity', nodeId: candidate.action.nodeId, before: { departureTime: previous.departureTime, arrivalTime: previous.arrivalTime }, after: { departureTime: resulting.departureTime, arrivalTime: resulting.arrivalTime } };
}

export function applyRecoveryTransaction(input: {
  state: RecoveryApplicationState; version: JourneyVersion; ledger: JourneyChangeLedger;
  proposal: RecoveryCandidate; expectedFingerprint: string; expectedVersion: number;
  disruptionProvenance: DisruptionProvenance;
}): JourneyTransactionResult {
  const currentFingerprint = itineraryFingerprint(input.state);
  if (input.version.fingerprint !== currentFingerprint) return { success: false, state: input.state, version: input.version, ledger: input.ledger, error: 'invalid-version' };
  if (input.expectedVersion !== input.version.version) return { success: false, state: input.state, version: input.version, ledger: input.ledger, error: 'stale-version' };
  if (input.expectedFingerprint !== currentFingerprint) return { success: false, state: input.state, version: input.version, ledger: input.ledger, error: 'stale-plan' };
  const applied = applyRecoveryCandidate(input.state, input.proposal, '', input.expectedFingerprint);
  if (!applied.applied) return { success: false, state: input.state, version: input.version, ledger: input.ledger, error: applied.reason };
  const resultingVersion = input.version.version + 1;
  const resultingFingerprint = itineraryFingerprint(applied.state);
  const action = recordedAction(input.state, applied.state, input.proposal);
  const base = {
    operation: 'apply' as const, previousVersion: input.version.version, resultingVersion,
    previousFingerprint: currentFingerprint, resultingFingerprint,
    changeType: input.proposal.action.type === 'replace_transport_route' ? 'recovery_route_replacement' as const : 'recovery_activity_shift' as const,
    affectedNodeIds: [...input.proposal.changedNodeIds], disruptionProvenance: { ...input.disruptionProvenance },
    recoveryCandidateId: input.proposal.id, actions: [action], reasonCodes: [...input.proposal.explanation.reasonCodes],
  };
  const entry = freezeEntry({ ...base, id: entryId(base) });
  const version = Object.freeze({ version: resultingVersion, fingerprint: resultingFingerprint });
  return { success: true, state: applied.state, version, ledger: input.ledger.append(entry), entry };
}

function applyRecordedState(state: RecoveryApplicationState, action: RecordedJourneyAction, direction: 'after' | 'before'): RecoveryApplicationState | undefined {
  const index = state.itinerary.segments.findIndex(segment => segment.activityId === action.nodeId);
  if (index < 0) return undefined;
  const segments = [...state.itinerary.segments]; const selectedRouteIds = { ...state.selectedRouteIds };
  if (action.type === 'replace_transport_route') {
    const value = action[direction];
    segments[index] = { ...segments[index], selectedRouteCandidateId: value.selectedRouteId, routeGeometry: value.geometry?.map(point => [...point] as [number, number]), routeDuration: value.duration, routeDistance: value.distance, estimatedCost: value.estimatedCost, costEstimateSource: value.costEstimateSource as JourneySegment['costEstimateSource'], costEstimateModel: value.costEstimateModel, routingStatus: value.routingStatus as JourneySegment['routingStatus'] };
    selectedRouteIds[index] = value.selectedRouteId;
  } else {
    const value = action[direction]; segments[index] = { ...segments[index], departureTime: value.departureTime, arrivalTime: value.arrivalTime };
  }
  return { itinerary: { ...state.itinerary, segments }, selectedRouteIds };
}

export type ReplayResult = { success: true; state: RecoveryApplicationState; version: JourneyVersion } | { success: false; state: RecoveryApplicationState; entryId: string; error: 'previous-fingerprint-mismatch' | 'resulting-fingerprint-mismatch' | 'invalid-action' | 'version-sequence-mismatch' };

export function replayJourneyLedger(initial: RecoveryApplicationState, entries: readonly JourneyLedgerEntry[]): ReplayResult {
  let state = initial; let version = createJourneyVersion(initial);
  for (const entry of entries) {
    if (entry.previousVersion !== version.version || entry.resultingVersion !== version.version + 1) return { success: false, state, entryId: entry.id, error: 'version-sequence-mismatch' };
    if (entry.previousFingerprint !== itineraryFingerprint(state)) return { success: false, state, entryId: entry.id, error: 'previous-fingerprint-mismatch' };
    for (const action of entry.actions) {
      const next = applyRecordedState(state, action, entry.operation === 'apply' ? 'after' : 'before');
      if (!next) return { success: false, state, entryId: entry.id, error: 'invalid-action' };
      state = next;
    }
    const fingerprint = itineraryFingerprint(state);
    if (entry.resultingFingerprint !== fingerprint) return { success: false, state, entryId: entry.id, error: 'resulting-fingerprint-mismatch' };
    version = Object.freeze({ version: entry.resultingVersion, fingerprint });
  }
  return { success: true, state, version };
}

export function undoLatestJourneyChange(input: { state: RecoveryApplicationState; version: JourneyVersion; ledger: JourneyChangeLedger }): JourneyTransactionResult {
  const latest = input.ledger.latest(); const currentFingerprint = itineraryFingerprint(input.state);
  if (!latest || latest.operation !== 'apply' || currentFingerprint !== latest.resultingFingerprint || input.version.fingerprint !== currentFingerprint) return { success: false, state: input.state, version: input.version, ledger: input.ledger, error: 'stale-plan' };
  let state = input.state;
  for (const action of [...latest.actions].reverse()) {
    const next = applyRecordedState(state, action, latest.operation === 'apply' ? 'before' : 'after');
    if (!next) return { success: false, state: input.state, version: input.version, ledger: input.ledger, error: 'target-not-found' };
    state = next;
  }
  const resultingFingerprint = itineraryFingerprint(state); const resultingVersion = input.version.version + 1;
  const base = {
    operation: 'undo' as const, previousVersion: input.version.version, resultingVersion,
    previousFingerprint: currentFingerprint, resultingFingerprint, changeType: latest.changeType,
    affectedNodeIds: [...latest.affectedNodeIds], disruptionProvenance: { ...latest.disruptionProvenance },
    recoveryCandidateId: latest.recoveryCandidateId, actions: [...latest.actions], reasonCodes: ['undo-local-change'], reversesEntryId: latest.id,
  };
  const entry = freezeEntry({ ...base, id: entryId(base) }); const version = Object.freeze({ version: resultingVersion, fingerprint: resultingFingerprint });
  return { success: true, state, version, ledger: input.ledger.append(entry), entry };
}
