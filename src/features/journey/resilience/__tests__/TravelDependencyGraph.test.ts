import { describe, expect, it } from 'vitest';
import { TravelDependencyGraph } from '../TravelDependencyGraph';
import { validateTemporalConstraints } from '../TemporalConstraintValidator';
import { adaptItineraryToGraph } from '../adapters';
import type { TravelDependencyEdge, TravelNode } from '../types';

const node = (id: string, startTime?: string, endTime?: string, flexibility: 'fixed' | 'flexible' = 'fixed'): TravelNode => ({
  id, kind: id === 'museum' || id === 'dinner' || id === 'independent' ? 'activity' : 'transport',
  startTime, endTime, flexibility,
});
const edge = (from: string, to: string): TravelDependencyEdge => ({ from, to, dependencySource: 'explicit' });
const validGraph = (nodes: TravelNode[], edges: TravelDependencyEdge[]) => {
  const result = TravelDependencyGraph.create(nodes, edges);
  if (!result.valid) throw new Error(`Invalid fixture: ${JSON.stringify(result.errors)}`);
  return result.graph;
};

describe('TravelDependencyGraph', () => {
  it('constructs a valid linear graph with deterministic topological order', () => {
    const graph = validGraph(
      [node('flight'), node('transfer'), node('hotel'), node('museum')],
      [edge('flight', 'transfer'), edge('transfer', 'hotel'), edge('hotel', 'museum')]
    );
    expect(graph.getTopologicalOrder()).toEqual(['flight', 'transfer', 'hotel', 'museum']);
    expect(graph.getTopologicalOrder()).toEqual(graph.getTopologicalOrder());
  });

  it('supports branching and distinguishes direct from transitive dependents', () => {
    const graph = validGraph(
      [node('flight'), node('transfer'), node('hotel'), node('museum'), node('dinner')],
      [edge('flight', 'transfer'), edge('transfer', 'hotel'), edge('hotel', 'museum'), edge('hotel', 'dinner')]
    );
    expect(graph.getDirectDependents('hotel')).toEqual(['museum', 'dinner']);
    expect(graph.getAffectedNodes('flight')).toEqual(['transfer', 'hotel', 'museum', 'dinner']);
  });

  it('keeps independent branches out of affected descendants and preserves stable tie order', () => {
    const graph = validGraph(
      [node('flight'), node('independent'), node('transfer'), node('hotel')],
      [edge('flight', 'transfer'), edge('transfer', 'hotel')]
    );
    expect(graph.getAffectedNodes('flight')).toEqual(['transfer', 'hotel']);
    expect(graph.getTopologicalOrder()).toEqual(['flight', 'independent', 'transfer', 'hotel']);
    expect(graph.getAffectedNodes('unknown')).toEqual([]);
  });

  it('rejects duplicate IDs', () => {
    expect(TravelDependencyGraph.create([node('same'), node('same')], [])).toMatchObject({
      valid: false, errors: [{ type: 'duplicate-node', nodeId: 'same' }],
    });
  });

  it('rejects self-dependencies', () => {
    expect(TravelDependencyGraph.create([node('a')], [edge('a', 'a')])).toMatchObject({
      valid: false, errors: [{ type: 'self-dependency', nodeId: 'a' }],
    });
  });

  it('rejects edges whose source or target is missing', () => {
    const result = TravelDependencyGraph.create([node('a')], [edge('a', 'missing')]);
    expect(result).toMatchObject({ valid: false, errors: [{ type: 'missing-node', nodeId: 'missing' }] });
  });

  it('rejects cycles without silently repairing them', () => {
    const result = TravelDependencyGraph.create(
      [node('a'), node('b'), node('c')],
      [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')]
    );
    expect(result).toMatchObject({ valid: false, errors: [{ type: 'cycle', nodeIds: ['a', 'b', 'c', 'a'] }] });
  });

  it('does not mutate construction inputs or expose mutable internal arrays', () => {
    const nodes = [node('a'), node('b')];
    const edges = [edge('a', 'b')];
    const snapshot = JSON.stringify({ nodes, edges });
    const graph = validGraph(nodes, edges);
    graph.getNodes()[0].id = 'changed';
    graph.getEdges()[0].to = 'changed';
    expect(JSON.stringify({ nodes, edges })).toBe(snapshot);
    expect(graph.getTopologicalOrder()).toEqual(['a', 'b']);
  });
});

describe('temporal validation', () => {
  it('detects invalid start/end chronology', () => {
    const graph = validGraph([node('flight', '15:00', '15:00')], []);
    expect(validateTemporalConstraints(graph)).toEqual([
      { type: 'invalid-time-range', nodeId: 'flight', startTime: '15:00', endTime: '15:00' },
    ]);
  });

  it('detects dependency overlap and marks impossible fixed timing', () => {
    const graph = validGraph(
      [node('flight', '12:00', '15:00'), node('transfer', '14:30', '16:00', 'fixed')],
      [edge('flight', 'transfer')]
    );
    expect(validateTemporalConstraints(graph)).toEqual([{
      type: 'dependency-overlap', from: 'flight', to: 'transfer', predecessorEndTime: '15:00',
      dependentStartTime: '14:30', fixedConflict: true,
    }]);
  });

  it('returns identical temporal results across repeat runs', () => {
    const graph = validGraph([node('a', '09:00', '10:00'), node('b', '10:00', '11:00')], [edge('a', 'b')]);
    expect(validateTemporalConstraints(graph)).toEqual(validateTemporalConstraints(graph));
  });
});

describe('itinerary adapter', () => {
  const itinerary = {
    origin: { name: 'Airport' }, destination: { name: 'Museum' }, summary: 'Trip',
    segments: [
      { activityId: 'transfer', mode: 'taxi' as const, from: { name: 'Airport' }, to: { name: 'Hotel' }, departureTime: '15:15', arrivalTime: '16:00', activityCategory: 'transport' as const, flexibility: 'fixed' as const },
      { activityId: 'museum', mode: 'walk' as const, from: { name: 'Hotel' }, to: { name: 'Museum' }, departureTime: '17:00', arrivalTime: '18:30', activityCategory: 'indoor' as const, flexibility: 'flexible' as const },
    ],
  };

  it('preserves explicit IDs, times, flexibility, category, and explicit dependencies', () => {
    const result = adaptItineraryToGraph(itinerary, [{ from: 'transfer', to: 'museum' }]);
    expect(result.nodes).toEqual([
      expect.objectContaining({ id: 'transfer', kind: 'transport', startTime: '15:15', endTime: '16:00', flexibility: 'fixed' }),
      expect.objectContaining({ id: 'museum', kind: 'activity', startTime: '17:00', endTime: '18:30', flexibility: 'flexible' }),
    ]);
    expect(result.edges).toEqual([{ from: 'transfer', to: 'museum', dependencySource: 'explicit' }]);
    expect(result.limitations).toEqual([]);
  });

  it('does not invent times, IDs, dependencies, or flexible status', () => {
    const result = adaptItineraryToGraph({
      ...itinerary,
      segments: [
        { activityId: 'known', mode: 'walk' as const, from: { name: 'A' }, to: { name: 'B' } },
        { mode: 'walk' as const, from: { name: 'B' }, to: { name: 'C' } },
      ],
    });
    expect(result.nodes).toEqual([expect.objectContaining({ id: 'known', flexibility: 'fixed' })]);
    expect(result.nodes[0]).not.toHaveProperty('startTime');
    expect(result.nodes[0]).not.toHaveProperty('endTime');
    expect(result.edges).toEqual([]);
    expect(result.limitations).toEqual([{ type: 'missing-stable-id', segmentIndex: 1 }]);
  });

  it('reports invalid source times without copying or replacing them', () => {
    const result = adaptItineraryToGraph({
      ...itinerary,
      segments: [{ activityId: 'bad-time', mode: 'walk' as const, from: { name: 'A' }, to: { name: 'B' }, departureTime: 'tomorrow', arrivalTime: '25:99' }],
    });
    expect(result.nodes[0]).not.toHaveProperty('startTime');
    expect(result.nodes[0]).not.toHaveProperty('endTime');
    expect(result.limitations).toEqual([
      { type: 'invalid-start-time', segmentIndex: 0, value: 'tomorrow' },
      { type: 'invalid-end-time', segmentIndex: 0, value: '25:99' },
    ]);
  });

  it('does not mutate the itinerary or dependency inputs', () => {
    const dependencies = [{ from: 'transfer', to: 'museum' }];
    const snapshot = JSON.stringify({ itinerary, dependencies });
    adaptItineraryToGraph(itinerary, dependencies);
    expect(JSON.stringify({ itinerary, dependencies })).toBe(snapshot);
  });
});
