import { parseTemporalValue } from './TemporalConstraintValidator';
import { scoreRecoveryCandidates } from './recoveryScoring';
import type {
  RecoveryAction, RecoveryCandidate, RecoveryConstraints, RecoveryExplanation, RecoveryPlannerInput,
  RecoveryRejectionReason, RecoveryResult, RejectedRecoveryCandidate, TransportRecoverySource,
  UnresolvedRecoveryViolation, VerifiedRecoveryRoute,
} from './recoveryTypes';
import type { TravelNode } from './types';

const isClock = (value: string) => /^\d{2}:\d{2}$/.test(value);

function addMinutes(value: string, minutes: number): { value?: string; limitation?: 'ambiguous-clock-time' | 'missing-temporal-context' } {
  const parsed = parseTemporalValue(value);
  if (parsed === undefined) return { limitation: 'missing-temporal-context' };
  if (isClock(value)) {
    const updated = parsed + minutes;
    if (updated >= 24 * 60) return { limitation: 'ambiguous-clock-time' };
    return { value: `${String(Math.floor(updated / 60)).padStart(2, '0')}:${String(updated % 60).padStart(2, '0')}` };
  }
  return { value: new Date(parsed + minutes * 60_000).toISOString() };
}

function differenceMinutes(later: string, earlier: string): number | undefined {
  if (isClock(later) !== isClock(earlier)) return undefined;
  const laterValue = parseTemporalValue(later);
  const earlierValue = parseTemporalValue(earlier);
  if (laterValue === undefined || earlierValue === undefined || laterValue < earlierValue) return undefined;
  return isClock(later) ? laterValue - earlierValue : (laterValue - earlierValue) / 60_000;
}

function compareTemporal(left: string, right: string): number | undefined {
  if (isClock(left) !== isClock(right)) return undefined;
  const leftValue = parseTemporalValue(left);
  const rightValue = parseTemporalValue(right);
  if (leftValue === undefined || rightValue === undefined) return undefined;
  return isClock(left) ? leftValue - rightValue : (leftValue - rightValue) / 60_000;
}

function inputMetricValid(value: number | undefined): boolean {
  return value === undefined || (Number.isFinite(value) && value >= 0);
}

function candidateId(action: RecoveryAction): string {
  return action.type === 'replace_transport_route'
    ? `${action.nodeId}:replace_transport_route:${action.replacementRouteId}`
    : `${action.nodeId}:shift_flexible_activity:${action.newStartTime}:${action.newEndTime}`;
}

function explanation(
  preservedNodeCount: number,
  changedNodeIds: string[],
  scheduleDeviationMinutes: number | undefined,
  additionalEstimatedCost: number | undefined,
  unresolved: UnresolvedRecoveryViolation[]
): RecoveryExplanation {
  return {
    reasonCodes: [
      'preserves-unaffected', 'minimal-node-change',
      ...(scheduleDeviationMinutes !== undefined && scheduleDeviationMinutes > 0 ? ['schedule-deviation' as const] : []),
      ...(additionalEstimatedCost !== undefined ? ['additional-estimated-cost' as const] : []),
      ...(unresolved.length ? ['unresolved-violations' as const] : []),
    ],
    preservedNodeCount, changedNodeIds,
    ...(scheduleDeviationMinutes !== undefined ? { scheduleDeviationMinutes } : {}),
    ...(additionalEstimatedCost !== undefined ? { additionalEstimatedCost } : {}),
    unresolvedViolationCount: unresolved.length,
  };
}

function hardConstraintReasons(candidate: Omit<RecoveryCandidate, 'score'>, constraints: RecoveryConstraints): RecoveryRejectionReason[] {
  const reasons: RecoveryRejectionReason[] = [];
  if (constraints.maxAdditionalEstimatedCost !== undefined) {
    if (candidate.additionalEstimatedCost === undefined) reasons.push('missing-required-cost');
    else if (candidate.additionalEstimatedCost > constraints.maxAdditionalEstimatedCost) reasons.push('exceeds-additional-cost');
  }
  if (constraints.maxAdditionalDelayMinutes !== undefined) {
    if (candidate.scheduleDeviationMinutes === undefined) reasons.push('missing-required-delay');
    else if (candidate.scheduleDeviationMinutes > constraints.maxAdditionalDelayMinutes) reasons.push('exceeds-additional-delay');
  }
  if (constraints.maxChangedNodes !== undefined && candidate.changedNodeIds.length > constraints.maxChangedNodes) reasons.push('exceeds-changed-nodes');
  const endTime = candidate.action.newEndTime;
  if (constraints.latestArrivalTime && endTime) {
    const difference = compareTemporal(endTime, constraints.latestArrivalTime);
    if (difference === undefined) reasons.push('missing-temporal-context');
    else if (difference > 0) reasons.push('exceeds-latest-arrival');
  }
  if (constraints.sameDayOnly && candidate.action.newStartTime && endTime &&
    !isClock(candidate.action.newStartTime) && !isClock(endTime) &&
    candidate.action.newStartTime.slice(0, 10) !== endTime.slice(0, 10)) reasons.push('violates-same-day');
  return reasons;
}

function unresolvedFor(
  input: RecoveryPlannerInput,
  resolvedNodeId: string,
  nodes: ReadonlyMap<string, TravelNode>
): UnresolvedRecoveryViolation[] {
  return input.impact.temporalViolations
    .filter(violation => violation.to !== resolvedNodeId)
    .map(violation => ({
      type: nodes.get(violation.to)?.flexibility === 'fixed' ? 'fixed-event-conflict' as const : 'unresolved-impact' as const,
      nodeId: violation.to,
      reason: violation.reason,
    }));
}

function routeCandidate(
  input: RecoveryPlannerInput,
  source: TransportRecoverySource,
  route: VerifiedRecoveryRoute,
  nodes: ReadonlyMap<string, TravelNode>
): { candidate?: Omit<RecoveryCandidate, 'score'>; rejection?: RejectedRecoveryCandidate; limitation?: 'ambiguous-clock-time' | 'missing-temporal-context' } {
  const conflict = input.impact.temporalViolations.find(violation => violation.to === source.nodeId);
  const newStartTime = conflict?.predecessorEndTime;
  const action: RecoveryAction = { type: 'replace_transport_route', nodeId: source.nodeId, replacementRouteId: route.id, ...(newStartTime ? { newStartTime } : {}) };
  const reasons: RecoveryRejectionReason[] = [];
  if ((input.constraints?.preserveFixedItems ?? true) && nodes.get(source.nodeId)?.flexibility === 'fixed') reasons.push('fixed-node-move');
  if (!inputMetricValid(route.durationSeconds) || !inputMetricValid(route.distanceMeters) || !inputMetricValid(route.estimatedCost)) reasons.push('invalid-route-metric');
  if (source.currentRouteId === route.id) reasons.push('same-route');
  let newEndTime: string | undefined;
  if (newStartTime) {
    const calculated = addMinutes(newStartTime, route.durationSeconds / 60);
    if (calculated.limitation) return { rejection: { id: candidateId(action), action, reasons: [calculated.limitation] }, limitation: calculated.limitation };
    newEndTime = calculated.value;
    action.newEndTime = newEndTime;
  }
  if (newEndTime) {
    for (const successorId of input.graph.getDirectDependents(source.nodeId)) {
      const successor = nodes.get(successorId);
      if (successor?.startTime) {
        const gap = differenceMinutes(successor.startTime, newEndTime);
        if (gap === undefined || gap < 0) reasons.push('dependency-conflict');
      }
    }
  }
  if (reasons.length) return { rejection: { id: candidateId(action), action, reasons } };
  const additionalCost = route.estimatedCost !== undefined && source.currentEstimatedCost !== undefined
    ? Math.max(0, route.estimatedCost - source.currentEstimatedCost) : undefined;
  const deviation = source.currentDurationSeconds !== undefined
    ? Math.max(0, (route.durationSeconds - source.currentDurationSeconds) / 60) : undefined;
  const unresolved = unresolvedFor(input, source.nodeId, nodes);
  const changed = [source.nodeId];
  return { candidate: {
    id: candidateId(action), action,
    ...(deviation !== undefined ? { scheduleDeviationMinutes: deviation } : {}),
    ...(additionalCost !== undefined ? { additionalEstimatedCost: additionalCost } : {}),
    changedNodeIds: changed, unresolvedViolations: unresolved,
    explanation: explanation(input.impact.unaffectedNodes.length, changed, deviation, additionalCost, unresolved),
  } };
}

function shiftCandidate(
  input: RecoveryPlannerInput,
  node: TravelNode,
  nodes: ReadonlyMap<string, TravelNode>
): { candidate?: Omit<RecoveryCandidate, 'score'>; limitation?: 'ambiguous-clock-time' | 'missing-temporal-context' } {
  if (node.flexibility !== 'flexible' || !node.startTime || !node.endTime) return {};
  const conflict = input.impact.temporalViolations.find(violation => violation.to === node.id);
  if (!conflict) return {};
  const duration = differenceMinutes(node.endTime, node.startTime);
  if (duration === undefined) return { limitation: isClock(node.startTime) ? 'ambiguous-clock-time' : 'missing-temporal-context' };
  const end = addMinutes(conflict.predecessorEndTime, duration);
  if (!end.value) return { limitation: end.limitation };
  for (const successorId of input.graph.getDirectDependents(node.id)) {
    const successor = nodes.get(successorId);
    if (successor?.startTime) {
      const gap = differenceMinutes(successor.startTime, end.value);
      if (gap === undefined || gap < 0) return {};
    }
  }
  const action: RecoveryAction = { type: 'shift_flexible_activity', nodeId: node.id, newStartTime: conflict.predecessorEndTime, newEndTime: end.value };
  const deviation = differenceMinutes(conflict.predecessorEndTime, node.startTime);
  if (deviation === undefined) return { limitation: 'ambiguous-clock-time' };
  const unresolved = unresolvedFor(input, node.id, nodes);
  return { candidate: {
    id: candidateId(action), action, scheduleDeviationMinutes: deviation, changedNodeIds: [node.id],
    unresolvedViolations: unresolved,
    explanation: explanation(input.impact.unaffectedNodes.length, [node.id], deviation, undefined, unresolved),
  } };
}

export function planRecovery(input: RecoveryPlannerInput): RecoveryResult {
  const nodes = input.graph.getNodes();
  const byId = new Map(nodes.map(node => [node.id, node]));
  const affected = new Set([input.impact.directlyAffectedNode.nodeId, ...input.impact.downstreamAffectedNodes.map(item => item.nodeId)]);
  const limitations = [...input.impact.limitations];
  const rejected: RejectedRecoveryCandidate[] = [];
  const generated: Array<Omit<RecoveryCandidate, 'score'>> = [];
  const constraints = input.constraints ?? {};
  const invalidConstraint = Object.values(constraints).some(value =>
    typeof value === 'number' && (!Number.isFinite(value) || value < 0)
  );
  if (invalidConstraint || !byId.has(input.impact.directlyAffectedNode.nodeId)) {
    return {
      status: 'invalid-input', rankedCandidates: [], rejectedCandidates: [],
      preservedNodeIds: input.impact.unaffectedNodes, changedNodeIds: [], unresolvedViolations: [],
      limitations, inputErrors: [
        ...(invalidConstraint ? ['invalid-constraint' as const] : []),
        ...(!byId.has(input.impact.directlyAffectedNode.nodeId) ? ['impact-target-not-found' as const] : []),
      ],
    };
  }

  for (const source of input.transportSources ?? []) {
    if (!affected.has(source.nodeId) || !byId.has(source.nodeId)) {
      for (const route of source.alternatives) {
        const action: RecoveryAction = { type: 'replace_transport_route', nodeId: source.nodeId, replacementRouteId: route.id };
        rejected.push({ id: candidateId(action), action, reasons: ['not-in-affected-subgraph'] });
      }
      continue;
    }
    for (const route of source.alternatives) {
      const result = routeCandidate(input, source, route, byId);
      if (result.limitation && !limitations.includes(result.limitation)) limitations.push(result.limitation);
      if (result.rejection) rejected.push(result.rejection);
      if (result.candidate) generated.push(result.candidate);
    }
  }
  for (const nodeId of affected) {
    const node = byId.get(nodeId);
    if (!node || node.kind !== 'activity') continue;
    const result = shiftCandidate(input, node, byId);
    if (result.limitation && !limitations.includes(result.limitation)) limitations.push(result.limitation);
    if (result.candidate) generated.push(result.candidate);
  }

  const eligible: Array<Omit<RecoveryCandidate, 'score'>> = [];
  for (const candidate of generated) {
    const reasons = hardConstraintReasons(candidate, constraints);
    if (reasons.length) rejected.push({ id: candidate.id, action: candidate.action, reasons });
    else eligible.push(candidate);
  }
  const ranked = scoreRecoveryCandidates(eligible);
  const fixedUnresolved = input.impact.temporalViolations
    .filter(violation => byId.get(violation.to)?.flexibility === 'fixed')
    .map(violation => ({ type: 'fixed-event-conflict' as const, nodeId: violation.to, reason: violation.reason }));
  if (!input.impact.recoveryRequired) {
    return { status: 'not-required', rankedCandidates: [], rejectedCandidates: rejected, preservedNodeIds: nodes.map(node => node.id), changedNodeIds: [], unresolvedViolations: [], limitations };
  }
  const recommended = ranked[0];
  return {
    status: recommended ? 'recovery-proposed' : 'no-valid-recovery',
    ...(recommended ? { recommendedCandidate: recommended } : {}),
    rankedCandidates: ranked, rejectedCandidates: rejected,
    preservedNodeIds: input.impact.unaffectedNodes,
    changedNodeIds: recommended?.changedNodeIds ?? [],
    unresolvedViolations: recommended?.unresolvedViolations ?? fixedUnresolved,
    limitations,
  };
}
