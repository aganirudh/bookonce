import { describe, expect, it } from 'vitest';
import { TravelDependencyGraph } from '../TravelDependencyGraph';
import { analyzeDisruption } from '../ImpactAnalyzer';
import { validateDisruptionEvent } from '../DisruptionEventValidator';
import { SimulationDisruptionProvider } from '../SimulationDisruptionProvider';
import type { TravelDependencyEdge, TravelNode } from '../types';

const simulation = { source: 'simulation' as const, referenceId: 'test-case' };
const node = (id: string, startTime?: string, endTime?: string): TravelNode => ({
  id, kind: id === 'museum' || id === 'dinner' || id === 'independent' ? 'activity' : 'transport',
  startTime, endTime, flexibility: 'fixed',
});
const edge = (from: string, to: string): TravelDependencyEdge => ({ from, to, dependencySource: 'explicit' });
const graph = (nodes: TravelNode[], edges: TravelDependencyEdge[]) => {
  const result = TravelDependencyGraph.create(nodes, edges);
  if (!result.valid) throw new Error(JSON.stringify(result.errors));
  return result.graph;
};
const bufferedGraph = graph(
  [node('flight', '10:00', '12:00'), node('transfer', '13:00', '14:00'), node('independent', '15:00', '16:00')],
  [edge('flight', 'transfer')]
);

describe('disruption validation', () => {
  it('accepts a valid delay and preserves simulation provenance', () => {
    const event = { type: 'transport_delay', targetNodeId: 'flight', delayMinutes: 30, provenance: simulation } as const;
    expect(validateDisruptionEvent(bufferedGraph, event)).toEqual({ valid: true, disruption: event, errors: [] });
  });

  it('rejects negative and non-finite delay values', () => {
    expect(validateDisruptionEvent(bufferedGraph, { type: 'transport_delay', targetNodeId: 'flight', delayMinutes: -1, provenance: simulation })).toMatchObject({ valid: false, errors: expect.arrayContaining([{ type: 'invalid-delay' }]) });
    expect(validateDisruptionEvent(bufferedGraph, { type: 'transport_delay', targetNodeId: 'flight', delayMinutes: Infinity, provenance: simulation })).toMatchObject({ valid: false, errors: expect.arrayContaining([{ type: 'invalid-delay' }]) });
  });

  it('rejects missing and unknown targets', () => {
    expect(validateDisruptionEvent(bufferedGraph, { type: 'activity_closure', targetNodeId: '', provenance: simulation })).toMatchObject({ valid: false, errors: expect.arrayContaining([{ type: 'missing-target-node' }]) });
    expect(validateDisruptionEvent(bufferedGraph, { type: 'activity_closure', targetNodeId: 'missing', provenance: simulation })).toMatchObject({ valid: false, errors: expect.arrayContaining([{ type: 'target-node-not-found', nodeId: 'missing' }]) });
  });

  it('requires provider names and rejects provider fields on simulations', () => {
    expect(validateDisruptionEvent(bufferedGraph, { type: 'transport_cancellation', targetNodeId: 'flight', provenance: { source: 'provider' } })).toMatchObject({ valid: false, errors: [{ type: 'invalid-provenance', reason: 'missing-provider-name' }] });
    expect(validateDisruptionEvent(bufferedGraph, { type: 'transport_cancellation', targetNodeId: 'flight', provenance: { source: 'simulation', providerName: 'fake' } })).toMatchObject({ valid: false, errors: [{ type: 'invalid-provenance', reason: 'unexpected-provider-name' }] });
  });

  it('rejects invalid event types and contradictory delay fields', () => {
    expect(validateDisruptionEvent(bufferedGraph, { type: 'flight_emergency', targetNodeId: 'flight', provenance: simulation })).toMatchObject({ valid: false, errors: expect.arrayContaining([{ type: 'invalid-event-type' }]) });
    expect(validateDisruptionEvent(bufferedGraph, { type: 'route_delay', targetNodeId: 'flight', delayMinutes: 10, newEndTime: '12:10', provenance: simulation })).toMatchObject({ valid: false, errors: expect.arrayContaining([{ type: 'contradictory-delay-fields' }]) });
  });
});

describe('delay impact', () => {
  it('classifies a buffered 30-minute delay as advisory without a confirmed conflict', () => {
    const result = analyzeDisruption(bufferedGraph, { type: 'transport_delay', targetNodeId: 'flight', delayMinutes: 30, provenance: simulation });
    expect(result).toMatchObject({ valid: true, analysis: {
      directlyAffectedNode: { nodeId: 'flight', reasons: ['target-delayed'] },
      downstreamAffectedNodes: [{ nodeId: 'transfer', reasons: ['dependency-on-affected-node'] }],
      temporalViolations: [], unaffectedNodes: ['independent'], classification: 'advisory', recoveryRequired: false,
    } });
  });

  it('detects a missed connection and requires recovery', () => {
    const result = analyzeDisruption(bufferedGraph, { type: 'transport_delay', targetNodeId: 'flight', newEndTime: '13:30', provenance: simulation });
    expect(result).toMatchObject({ valid: true, analysis: {
      temporalViolations: [{ from: 'flight', to: 'transfer', reason: 'dependency-overlap', predecessorEndTime: '13:30', dependentStartTime: '13:00' }],
      downstreamAffectedNodes: [{ nodeId: 'transfer', reasons: ['dependency-on-affected-node', 'dependency-overlap'] }],
      classification: 'conflict', recoveryRequired: true,
    } });
  });

  it('reports missing temporal context without losing dependency ancestry', () => {
    const noTime = graph([node('flight'), node('transfer', '13:00', '14:00')], [edge('flight', 'transfer')]);
    const result = analyzeDisruption(noTime, { type: 'route_delay', targetNodeId: 'flight', delayMinutes: 30, provenance: simulation });
    expect(result).toMatchObject({ valid: true, analysis: {
      downstreamAffectedNodes: [{ nodeId: 'transfer' }], temporalViolations: [],
      limitations: ['missing-temporal-context'], recoveryRequired: false,
    } });
  });

  it('does not guess across midnight with clock-only times', () => {
    const overnight = graph([node('flight', '22:30', '23:30'), node('transfer', '00:30', '01:30')], [edge('flight', 'transfer')]);
    const result = analyzeDisruption(overnight, { type: 'transport_delay', targetNodeId: 'flight', delayMinutes: 90, provenance: simulation });
    expect(result).toMatchObject({ valid: true, analysis: {
      downstreamAffectedNodes: [{ nodeId: 'transfer' }], temporalViolations: [],
      limitations: ['ambiguous-clock-time'],
    } });
  });

  it('rejects an explicit clock-only end time that ambiguously crosses midnight', () => {
    const overnight = graph([node('flight', '22:30', '23:30'), node('transfer', '00:30', '01:30')], [edge('flight', 'transfer')]);
    const result = analyzeDisruption(overnight, { type: 'transport_delay', targetNodeId: 'flight', newEndTime: '00:15', provenance: simulation });
    expect(result).toMatchObject({ valid: true, analysis: { temporalViolations: [], limitations: ['ambiguous-clock-time'] } });
  });
});

describe('non-delay impact', () => {
  const chain = graph(
    [node('flight'), node('transfer'), node('hotel'), node('museum'), node('independent')],
    [edge('flight', 'transfer'), edge('transfer', 'hotel'), edge('hotel', 'museum')]
  );

  it('propagates cancellation as blocked without cancelling descendants', () => {
    const result = analyzeDisruption(chain, { type: 'transport_cancellation', targetNodeId: 'flight', provenance: simulation });
    expect(result).toMatchObject({ valid: true, analysis: {
      directlyAffectedNode: { nodeId: 'flight', reasons: ['target-cancelled'] },
      downstreamAffectedNodes: [
        { nodeId: 'transfer', reasons: ['blocked-by-cancelled-dependency'] },
        { nodeId: 'hotel', reasons: ['blocked-by-cancelled-dependency'] },
        { nodeId: 'museum', reasons: ['blocked-by-cancelled-dependency'] },
      ],
      unaffectedNodes: ['independent'], classification: 'blocked', recoveryRequired: true,
    } });
  });

  it('limits an activity closure to its actual dependency branch', () => {
    const branching = graph([node('hotel'), node('museum'), node('dinner')], [edge('hotel', 'museum'), edge('hotel', 'dinner')]);
    const result = analyzeDisruption(branching, { type: 'activity_closure', targetNodeId: 'museum', provenance: simulation });
    expect(result).toMatchObject({ valid: true, analysis: {
      directlyAffectedNode: { nodeId: 'museum', reasons: ['activity-closed'] },
      downstreamAffectedNodes: [], unaffectedNodes: ['hotel', 'dinner'], classification: 'blocked', recoveryRequired: true,
    } });
  });

  it('distinguishes weather caution from unsuitable while using only graph dependencies', () => {
    const weatherGraph = graph([node('museum'), node('dinner'), node('independent')], [edge('museum', 'dinner')]);
    const caution = analyzeDisruption(weatherGraph, { type: 'weather_conflict', targetNodeId: 'museum', compatibility: 'caution', provenance: { source: 'bookonce-derived' } });
    const unsuitable = analyzeDisruption(weatherGraph, { type: 'weather_conflict', targetNodeId: 'museum', compatibility: 'unsuitable', provenance: { source: 'bookonce-derived' } });
    expect(caution).toMatchObject({ valid: true, analysis: { directlyAffectedNode: { reasons: ['weather-caution'] }, downstreamAffectedNodes: [{ nodeId: 'dinner' }], unaffectedNodes: ['independent'], classification: 'advisory', recoveryRequired: false } });
    expect(unsuitable).toMatchObject({ valid: true, analysis: { directlyAffectedNode: { reasons: ['weather-unsuitable'] }, downstreamAffectedNodes: [{ nodeId: 'dinner' }], classification: 'conflict', recoveryRequired: true } });
  });
});

describe('determinism and immutability', () => {
  it('does not mutate the graph or disruption and returns repeatable ordering', () => {
    const event = { type: 'transport_delay', targetNodeId: 'flight', delayMinutes: 30, provenance: simulation } as const;
    const eventSnapshot = JSON.stringify(event);
    const nodesSnapshot = JSON.stringify(bufferedGraph.getNodes());
    const first = analyzeDisruption(bufferedGraph, event);
    const second = analyzeDisruption(bufferedGraph, event);
    expect(first).toEqual(second);
    expect(JSON.stringify(event)).toBe(eventSnapshot);
    expect(JSON.stringify(bufferedGraph.getNodes())).toBe(nodesSnapshot);
  });

  it('preserves provider provenance in successful analysis', () => {
    const provenance = { source: 'provider' as const, providerName: 'Verified Transit', observedAt: '2026-09-01T10:00:00Z', referenceId: 'ref-1' };
    const result = analyzeDisruption(bufferedGraph, { type: 'transport_cancellation', targetNodeId: 'flight', provenance });
    expect(result).toMatchObject({ valid: true, analysis: { disruption: { provenance } } });
  });
});

describe('SimulationDisruptionProvider', () => {
  it('emits deterministic simulation-labelled scenarios without timestamps', async () => {
    const provider = new SimulationDisruptionProvider();
    await expect(provider.getDisruptions('flight', 'delay-30')).resolves.toEqual([
      { type: 'transport_delay', targetNodeId: 'flight', delayMinutes: 30, provenance: { source: 'simulation', referenceId: 'delay-30' } },
    ]);
    await expect(provider.getDisruptions('flight', 'transport-cancellation')).resolves.toEqual([
      { type: 'transport_cancellation', targetNodeId: 'flight', provenance: { source: 'simulation', referenceId: 'transport-cancellation' } },
    ]);
  });
});
