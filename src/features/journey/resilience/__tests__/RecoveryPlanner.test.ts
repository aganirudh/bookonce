import { describe, expect, it } from 'vitest';
import { TravelDependencyGraph } from '../TravelDependencyGraph';
import { analyzeDisruption } from '../ImpactAnalyzer';
import { planRecovery } from '../RecoveryPlanner';
import { scoreRecoveryCandidates } from '../recoveryScoring';
import type { RecoveryCandidate, TransportRecoverySource } from '../recoveryTypes';
import type { TravelDependencyEdge, TravelNode } from '../types';

const provenance = { source: 'simulation' as const, referenceId: 'recovery-test' };
const node = (id: string, kind: 'transport' | 'activity', startTime?: string, endTime?: string, flexibility: 'fixed' | 'flexible' = 'fixed'): TravelNode => ({ id, kind, startTime, endTime, flexibility });
const edge = (from: string, to: string): TravelDependencyEdge => ({ from, to, dependencySource: 'explicit' });
const graph = (nodes: TravelNode[], edges: TravelDependencyEdge[]) => {
  const result = TravelDependencyGraph.create(nodes, edges);
  if (!result.valid) throw new Error(JSON.stringify(result.errors));
  return result.graph;
};
const impact = (travelGraph: TravelDependencyGraph, targetNodeId = 'flight', newEndTime = '13:30') => {
  const result = analyzeDisruption(travelGraph, { type: 'transport_delay', targetNodeId, newEndTime, provenance });
  if (!result.valid) throw new Error(JSON.stringify(result.errors));
  return result.analysis;
};

const recoveryGraph = graph(
  [
    node('flight', 'transport', '10:00', '12:00'),
    node('transfer', 'transport', '13:00', '14:00', 'flexible'),
    node('hotel', 'transport', '14:30', '15:00'),
    node('museum', 'activity', '16:00', '17:00', 'flexible'),
    node('dinner', 'activity', '19:00', '20:00'),
    node('independent', 'activity', '18:00', '19:00'),
  ],
  [edge('flight', 'transfer'), edge('transfer', 'hotel'), edge('hotel', 'museum'), edge('museum', 'dinner')]
);
const routes: TransportRecoverySource = {
  nodeId: 'transfer', currentRouteId: 'current', currentDurationSeconds: 1200, currentEstimatedCost: 100,
  alternatives: [
    { id: 'route-a', provider: 'verified', mode: 'drive', durationSeconds: 1800, distanceMeters: 10000, estimatedCost: 400 },
    { id: 'route-b', provider: 'verified', mode: 'drive', durationSeconds: 2700, distanceMeters: 12000, estimatedCost: 250 },
  ],
};

describe('RecoveryPlanner route recovery', () => {
  it('generates and deterministically ranks only supplied verified route alternatives', () => {
    const result = planRecovery({ graph: recoveryGraph, impact: impact(recoveryGraph), transportSources: [routes] });
    expect(result.status).toBe('recovery-proposed');
    expect(result.rankedCandidates).toHaveLength(2);
    expect(result.rankedCandidates.map(candidate => candidate.action.type === 'replace_transport_route' && candidate.action.replacementRouteId)).toEqual(['route-a', 'route-b']);
    expect(result.recommendedCandidate?.id).toBe('transfer:replace_transport_route:route-a');
    expect(result.rankedCandidates.every(candidate => ['route-a', 'route-b'].some(id => candidate.id.endsWith(id)))).toBe(true);
  });

  it('preserves unaffected and out-of-scope branches', () => {
    const result = planRecovery({ graph: recoveryGraph, impact: impact(recoveryGraph), transportSources: [routes] });
    expect(result.preservedNodeIds).toEqual(['independent']);
    expect(result.changedNodeIds).toEqual(['transfer']);
    expect(result.rankedCandidates.flatMap(candidate => candidate.changedNodeIds)).not.toContain('independent');
  });

  it('rejects out-of-scope sources rather than reconsidering the full itinerary', () => {
    const result = planRecovery({ graph: recoveryGraph, impact: impact(recoveryGraph), transportSources: [{ ...routes, nodeId: 'independent' }] });
    expect(result.status).toBe('no-valid-recovery');
    expect(result.rejectedCandidates).toEqual(expect.arrayContaining([expect.objectContaining({ reasons: ['not-in-affected-subgraph'] })]));
  });

  it('filters budget and delay constraints before scoring', () => {
    const budget = planRecovery({ graph: recoveryGraph, impact: impact(recoveryGraph), transportSources: [routes], constraints: { maxAdditionalEstimatedCost: 200 } });
    expect(budget.rankedCandidates.map(candidate => candidate.id)).toEqual(['transfer:replace_transport_route:route-b']);
    expect(budget.rejectedCandidates).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'transfer:replace_transport_route:route-a', reasons: ['exceeds-additional-cost'] })]));
    const delay = planRecovery({ graph: recoveryGraph, impact: impact(recoveryGraph), transportSources: [routes], constraints: { maxAdditionalDelayMinutes: 15 } });
    expect(delay.rankedCandidates.map(candidate => candidate.id)).toEqual(['transfer:replace_transport_route:route-a']);
    expect(delay.rejectedCandidates).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'transfer:replace_transport_route:route-b', reasons: ['exceeds-additional-delay'] })]));
  });

  it('does not treat missing cost or duration baselines as zero under hard constraints', () => {
    const source = { ...routes, currentEstimatedCost: undefined, currentDurationSeconds: undefined };
    const result = planRecovery({ graph: recoveryGraph, impact: impact(recoveryGraph), transportSources: [source], constraints: { maxAdditionalEstimatedCost: 500, maxAdditionalDelayMinutes: 60 } });
    expect(result.status).toBe('no-valid-recovery');
    expect(result.rejectedCandidates.every(candidate => candidate.reasons.includes('missing-required-cost') && candidate.reasons.includes('missing-required-delay'))).toBe(true);
  });

  it('returns invalid-input for invalid constraints', () => {
    const result = planRecovery({ graph: recoveryGraph, impact: impact(recoveryGraph), constraints: { maxChangedNodes: -1 } });
    expect(result).toMatchObject({ status: 'invalid-input', inputErrors: ['invalid-constraint'], rankedCandidates: [] });
  });
});

describe('flexible and fixed activities', () => {
  it('generates a safe shift only for a flexible affected activity', () => {
    const activityGraph = graph(
      [node('flight', 'transport', '12:00', '14:00'), node('museum', 'activity', '13:30', '14:30', 'flexible'), node('dinner', 'activity', '17:00', '18:00')],
      [edge('flight', 'museum'), edge('museum', 'dinner')]
    );
    const result = planRecovery({ graph: activityGraph, impact: impact(activityGraph, 'flight', '15:00') });
    expect(result.recommendedCandidate).toMatchObject({
      id: 'museum:shift_flexible_activity:15:00:16:00',
      action: { type: 'shift_flexible_activity', nodeId: 'museum', newStartTime: '15:00', newEndTime: '16:00' },
    });
  });

  it('never shifts a fixed node and reports its unresolved conflict', () => {
    const fixedGraph = graph([node('flight', 'transport', '12:00', '14:00'), node('museum', 'activity', '15:00', '16:00')], [edge('flight', 'museum')]);
    const result = planRecovery({ graph: fixedGraph, impact: impact(fixedGraph, 'flight', '16:00') });
    expect(result.status).toBe('no-valid-recovery');
    expect(result.rankedCandidates).toEqual([]);
    expect(result.unresolvedViolations).toEqual([{ type: 'fixed-event-conflict', nodeId: 'museum', reason: 'dependency-overlap' }]);
  });

  it('excludes a shift that would violate a fixed successor', () => {
    const unsafeGraph = graph(
      [node('flight', 'transport', '12:00', '14:00'), node('museum', 'activity', '13:30', '14:30', 'flexible'), node('dinner', 'activity', '15:30', '16:30')],
      [edge('flight', 'museum'), edge('museum', 'dinner')]
    );
    const result = planRecovery({ graph: unsafeGraph, impact: impact(unsafeGraph, 'flight', '15:00') });
    expect(result.status).toBe('no-valid-recovery');
    expect(result.changedNodeIds).toEqual([]);
  });

  it('excludes ambiguous cross-midnight shifts and reports the limitation', () => {
    const overnight = graph([node('flight', 'transport', '22:00', '23:30'), node('museum', 'activity', '23:00', '23:45', 'flexible')], [edge('flight', 'museum')]);
    const result = planRecovery({ graph: overnight, impact: impact(overnight, 'flight', '23:45') });
    expect(result.status).toBe('no-valid-recovery');
    expect(result.limitations).toContain('ambiguous-clock-time');
  });

  it('filters dated route recovery that violates same-day-only', () => {
    const dated = graph(
      [node('flight', 'transport', '2026-09-01T20:00:00Z', '2026-09-01T23:00:00Z'), node('transfer', 'transport', '2026-09-01T23:15:00Z', '2026-09-01T23:45:00Z', 'flexible')],
      [edge('flight', 'transfer')]
    );
    const source = { ...routes, nodeId: 'transfer', alternatives: [{ id: 'overnight', provider: 'verified', mode: 'drive', durationSeconds: 7200, distanceMeters: 10000, estimatedCost: 200 }] };
    const result = planRecovery({ graph: dated, impact: impact(dated, 'flight', '2026-09-01T23:30:00Z'), transportSources: [source], constraints: { sameDayOnly: true } });
    expect(result.status).toBe('no-valid-recovery');
    expect(result.rejectedCandidates[0].reasons).toContain('violates-same-day');
  });
});

describe('recovery scoring and result integrity', () => {
  const base = (id: string, deviation: number, cost: number | undefined): Omit<RecoveryCandidate, 'score'> => ({
    id,
    action: { type: 'replace_transport_route', nodeId: 'transfer', replacementRouteId: id },
    scheduleDeviationMinutes: deviation,
    ...(cost !== undefined ? { additionalEstimatedCost: cost } : {}),
    changedNodeIds: ['transfer'], unresolvedViolations: [],
    explanation: { reasonCodes: ['minimal-node-change'], preservedNodeCount: 1, scheduleDeviationMinutes: deviation, ...(cost !== undefined ? { additionalEstimatedCost: cost } : {}), changedNodeIds: ['transfer'], unresolvedViolationCount: 0 },
  });

  it('normalizes scores without NaN and uses stable IDs as the final tie-break', () => {
    const ranked = scoreRecoveryCandidates([base('b', 10, 100), base('a', 10, 100)]);
    expect(ranked.map(candidate => candidate.id)).toEqual(['a', 'b']);
    expect(ranked.every(candidate => candidate.score === 0 && Number.isFinite(candidate.score))).toBe(true);
  });

  it('disables cost scoring for the whole set when any cost is missing', () => {
    const ranked = scoreRecoveryCandidates([base('known-expensive', 5, 999), base('unknown', 10, undefined)]);
    expect(ranked[0].id).toBe('known-expensive');
    expect(ranked.every(candidate => Number.isFinite(candidate.score))).toBe(true);
  });

  it('returns deterministic structured explanations with only known metrics', () => {
    const result = planRecovery({ graph: recoveryGraph, impact: impact(recoveryGraph), transportSources: [routes] });
    expect(result.recommendedCandidate?.explanation).toEqual({
      reasonCodes: ['preserves-unaffected', 'minimal-node-change', 'schedule-deviation', 'additional-estimated-cost'],
      preservedNodeCount: 1, scheduleDeviationMinutes: 10, additionalEstimatedCost: 300,
      changedNodeIds: ['transfer'], unresolvedViolationCount: 0,
    });
  });

  it('does not mutate inputs and produces identical results repeatedly', () => {
    const analysis = impact(recoveryGraph);
    const input = { graph: recoveryGraph, impact: analysis, transportSources: [routes] };
    const snapshot = JSON.stringify({ analysis, routes });
    expect(planRecovery(input)).toEqual(planRecovery(input));
    expect(JSON.stringify({ analysis, routes })).toBe(snapshot);
  });

  it('returns not-required without proposing changes for advisory impact', () => {
    const advisory = analyzeDisruption(recoveryGraph, { type: 'transport_delay', targetNodeId: 'flight', delayMinutes: 5, provenance });
    if (!advisory.valid) throw new Error('invalid fixture');
    const result = planRecovery({ graph: recoveryGraph, impact: advisory.analysis, transportSources: [routes] });
    expect(result).toMatchObject({ status: 'not-required', rankedCandidates: [], changedNodeIds: [] });
  });
});
