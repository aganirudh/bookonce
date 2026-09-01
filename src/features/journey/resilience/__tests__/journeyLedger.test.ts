import { describe, expect, it } from 'vitest';
import {
  applyRecoveryTransaction, createJourneyVersion, itineraryFingerprint, JourneyChangeLedger,
  replayJourneyLedger, undoLatestJourneyChange,
} from '../journeyLedger';
import type { RecoveryApplicationState } from '../recoveryApplication';
import type { RecoveryCandidate } from '../recoveryTypes';

const routeCandidate: RecoveryCandidate = {
  id: 'transfer:replace_transport_route:alternate', score: 0, changedNodeIds: ['transfer'], unresolvedViolations: [],
  action: { type: 'replace_transport_route', nodeId: 'transfer', replacementRouteId: 'alternate' },
  explanation: { reasonCodes: ['preserves-unaffected', 'minimal-node-change'], preservedNodeCount: 1, changedNodeIds: ['transfer'], unresolvedViolationCount: 0 },
};
const shiftCandidate: RecoveryCandidate = {
  id: 'museum:shift_flexible_activity:13:00:14:00', score: 0, changedNodeIds: ['museum'], unresolvedViolations: [],
  action: { type: 'shift_flexible_activity', nodeId: 'museum', newStartTime: '13:00', newEndTime: '14:00' },
  explanation: { reasonCodes: ['preserves-unaffected', 'minimal-node-change'], preservedNodeCount: 2, changedNodeIds: ['museum'], unresolvedViolationCount: 0 },
};
const simulation = { source: 'simulation' as const, referenceId: 'delay-180' };

function fixture(): RecoveryApplicationState {
  return { selectedRouteIds: { 0: 'current' }, itinerary: {
    origin: { name: 'Airport' }, destination: { name: 'City' }, summary: 'Trip', segments: [
      { activityId: 'transfer', mode: 'car', from: { name: 'Airport' }, to: { name: 'Hotel' }, flexibility: 'flexible', departureTime: '11:00', arrivalTime: '12:00', routeDuration: 3600, routeDistance: 10000, estimatedCost: 300, costEstimateSource: 'bookonce-estimate', selectedRouteCandidateId: 'current', routingStatus: 'routed', routeGeometry: [[1, 1]], routingAlternatives: [
        { id: 'current', label: 'Current', mode: 'drive', duration: 3600, distance: 10000, estimatedCost: 300, geometry: [[1, 1]], rank: 1, score: 0, qualityScore: 100, explanation: { dominantPreference: 'time', advantages: [], tradeOffs: [] } },
        { id: 'alternate', label: 'Alternate', mode: 'drive', duration: 1800, distance: 9000, estimatedCost: 250, geometry: [[2, 2]], rank: 2, score: 0.2, qualityScore: 80, explanation: { dominantPreference: 'time', advantages: [], tradeOffs: [] } },
      ] },
      { activityId: 'museum', activityCategory: 'indoor', mode: 'walk', from: { name: 'Hotel' }, to: { name: 'Museum' }, flexibility: 'flexible', departureTime: '12:00', arrivalTime: '13:00' },
      { activityId: 'dinner', activityCategory: 'indoor', mode: 'walk', from: { name: 'Hotel' }, to: { name: 'Dinner' }, flexibility: 'fixed', departureTime: '18:00', arrivalTime: '19:00' },
    ],
  } };
}

function apply(state = fixture(), candidate = routeCandidate, provenance = simulation) {
  const version = createJourneyVersion(state); const ledger = JourneyChangeLedger.empty();
  return applyRecoveryTransaction({ state, version, ledger, proposal: candidate, expectedFingerprint: itineraryFingerprint(state), expectedVersion: 0, disruptionProvenance: provenance });
}

describe('JourneyChangeLedger', () => {
  it('creates canonical fingerprints independent of segment ordering', () => {
    const state = fixture(); const reversed = { ...state, itinerary: { ...state.itinerary, segments: [...state.itinerary.segments].reverse() }, selectedRouteIds: { 2: 'current' } };
    expect(itineraryFingerprint(reversed)).toBe(itineraryFingerprint(state));
    expect(createJourneyVersion(state)).toEqual({ version: 0, fingerprint: itineraryFingerprint(state) });
  });

  it('applies a route transaction with deterministic version, entry, and simulation provenance', () => {
    const original = fixture(); const candidateCopy = structuredClone(routeCandidate); const result = apply(original);
    expect(result.success).toBe(true); if (!result.success) return;
    expect(result.version.version).toBe(1); expect(result.version.fingerprint).not.toBe(createJourneyVersion(original).fingerprint);
    expect(result.ledger.getEntries()).toHaveLength(1);
    expect(result.entry).toMatchObject({ previousVersion: 0, resultingVersion: 1, changeType: 'recovery_route_replacement', affectedNodeIds: ['transfer'], recoveryCandidateId: routeCandidate.id, disruptionProvenance: simulation });
    expect(result.entry.actions[0]).toMatchObject({ type: 'replace_transport_route', before: { selectedRouteId: 'current' }, after: { selectedRouteId: 'alternate', duration: 1800, distance: 9000 } });
    expect(original).toEqual(fixture()); expect(routeCandidate).toEqual(candidateCopy);
    const repeated = apply(fixture()); expect(repeated.success && repeated.entry.id).toBe(result.entry.id);
  });

  it('appends immutably and preserves previous entries', () => {
    const first = apply(); if (!first.success) throw new Error('fixture failed');
    const oldEntries = first.ledger.getEntries(); const oldEntry = first.entry;
    const second = applyRecoveryTransaction({ state: first.state, version: first.version, ledger: first.ledger, proposal: shiftCandidate, expectedFingerprint: first.version.fingerprint, expectedVersion: 1, disruptionProvenance: simulation });
    expect(second.success).toBe(true); expect(first.ledger.getEntries()).toBe(oldEntries); expect(first.ledger.getEntries()).toEqual([oldEntry]);
    if (second.success) expect(second.ledger.getEntries()).toHaveLength(2);
  });

  it('records an activity shift and changes only its target', () => {
    const original = fixture(); const result = apply(original, shiftCandidate);
    expect(result.success).toBe(true); if (!result.success) return;
    expect(result.state.itinerary.segments[1]).toMatchObject({ departureTime: '13:00', arrivalTime: '14:00' });
    expect(result.state.itinerary.segments[0]).toBe(original.itinerary.segments[0]);
    expect(result.state.itinerary.segments[2]).toBe(original.itinerary.segments[2]);
    expect(result.entry).toMatchObject({ changeType: 'recovery_activity_shift', actions: [{ before: { departureTime: '12:00', arrivalTime: '13:00' }, after: { departureTime: '13:00', arrivalTime: '14:00' } }] });
  });

  it('rejects stale and duplicate applications atomically', () => {
    const original = fixture(); const version = createJourneyVersion(original); const ledger = JourneyChangeLedger.empty();
    const changed = { ...original, selectedRouteIds: { 0: 'alternate' } };
    const stale = applyRecoveryTransaction({ state: changed, version, ledger, proposal: routeCandidate, expectedFingerprint: version.fingerprint, expectedVersion: 0, disruptionProvenance: simulation });
    expect(stale).toMatchObject({ success: false, error: 'invalid-version', state: changed, version, ledger });
    const first = apply(); if (!first.success) throw new Error('fixture failed');
    const duplicate = applyRecoveryTransaction({ state: first.state, version: first.version, ledger: first.ledger, proposal: routeCandidate, expectedFingerprint: createJourneyVersion(original).fingerprint, expectedVersion: 0, disruptionProvenance: simulation });
    expect(duplicate).toMatchObject({ success: false, error: 'stale-version' });
    expect(duplicate.ledger).toBe(first.ledger); expect(duplicate.version).toBe(first.version); expect(duplicate.state).toBe(first.state);
  });

  it('replays valid history to the same state and detects corrupted history', () => {
    const original = fixture(); const result = apply(original); if (!result.success) throw new Error('fixture failed');
    const replay = replayJourneyLedger(original, result.ledger.getEntries());
    expect(replay.success).toBe(true); if (replay.success) { expect(replay.version).toEqual(result.version); expect(replay.state).toEqual(result.state); }
    const corrupted = [{ ...result.entry, resultingFingerprint: 'corrupt' }];
    expect(replayJourneyLedger(original, corrupted)).toMatchObject({ success: false, entryId: result.entry.id, error: 'resulting-fingerprint-mismatch' });
  });

  it('undoes by appending v2 and preserves unaffected nodes and recovery history', () => {
    const original = fixture(); const applied = apply(original); if (!applied.success) throw new Error('fixture failed');
    const undone = undoLatestJourneyChange({ state: applied.state, version: applied.version, ledger: applied.ledger });
    expect(undone.success).toBe(true); if (!undone.success) return;
    expect(undone.version).toEqual({ version: 2, fingerprint: itineraryFingerprint(original) });
    expect(undone.ledger.getEntries()).toHaveLength(2); expect(undone.entry).toMatchObject({ operation: 'undo', reversesEntryId: applied.entry.id });
    expect(undone.state.itinerary.segments[1]).toBe(applied.state.itinerary.segments[1]);
    expect(replayJourneyLedger(original, undone.ledger.getEntries())).toMatchObject({ success: true, version: undone.version });
  });

  it('rejects stale undo without changing state, version, or ledger', () => {
    const applied = apply(); if (!applied.success) throw new Error('fixture failed');
    const staleState = { ...applied.state, selectedRouteIds: { 0: 'current' } };
    const result = undoLatestJourneyChange({ state: staleState, version: applied.version, ledger: applied.ledger });
    expect(result).toMatchObject({ success: false, error: 'stale-plan' });
    expect(result.state).toBe(staleState); expect(result.version).toBe(applied.version); expect(result.ledger).toBe(applied.ledger);
  });

  it('preserves provider provenance without escalation', () => {
    const provider = { source: 'provider' as const, providerName: 'Transit Authority', referenceId: 'notice-1' };
    const simulated = apply(); const verified = apply(fixture(), routeCandidate, provider);
    expect(simulated.success && simulated.entry.disruptionProvenance.source).toBe('simulation');
    expect(verified.success && verified.entry.disruptionProvenance).toEqual(provider);
  });
});
