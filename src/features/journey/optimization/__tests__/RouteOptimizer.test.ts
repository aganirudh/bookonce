import { describe, expect, it } from 'vitest';
import { routeToCandidate } from '../adapters';
import { OPTIMIZATION_PRESETS, preferencesForTravelStyle } from '../presets';
import { getBestRoute, normalizeMetric, normalizeWeights, rankRoutes } from '../RouteOptimizer';
import type { OptimizationPreferences, RouteCandidate } from '../types';

const candidates: RouteCandidate[] = [
  { id: 'fast', label: 'Fast route', mode: 'drive', durationSeconds: 600, cost: 100, walkingDistanceMeters: 1000, transfers: 2, distanceMeters: 9000 },
  { id: 'cheap', label: 'Cheap route', mode: 'bus', durationSeconds: 1200, cost: 10, walkingDistanceMeters: 500, transfers: 1, distanceMeters: 8000 },
  { id: 'easy', label: 'Easy route', mode: 'metro', durationSeconds: 900, cost: 60, walkingDistanceMeters: 100, transfers: 0, distanceMeters: 8500 },
];

describe('weight and metric normalization', () => {
  it('normalizes arbitrary and already-normalized weights to one', () => {
    const weights = normalizeWeights({ timeWeight: 2, costWeight: 6, walkingWeight: 1, transfersWeight: 1 });
    expect(weights).toMatchObject({ time: 0.2, cost: 0.6, walking: 0.1, transfers: 0.1 });
    expect(Object.values(weights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(normalizeWeights({ timeWeight: 0.25, costWeight: 0.25, walkingWeight: 0.25, transfersWeight: 0.25 }).time).toBe(0.25);
  });

  it('rejects negative, non-finite, and all-zero weights', () => {
    expect(() => normalizeWeights({ timeWeight: -1, costWeight: 1, walkingWeight: 1, transfersWeight: 1 })).toThrow('non-negative');
    expect(() => normalizeWeights({ timeWeight: 0, costWeight: 0, walkingWeight: 0, transfersWeight: 0 })).toThrow('positive');
  });

  it('min-max normalizes values and handles equal/single values', () => {
    expect(normalizeMetric([10, 20, 30])).toEqual([0, 0.5, 1]);
    expect(normalizeMetric([4, 4])).toEqual([0, 0]);
    expect(normalizeMetric([4])).toEqual([0]);
  });
});

describe('deterministic ranking', () => {
  it.each([
    ['FASTEST', OPTIMIZATION_PRESETS.FASTEST, 'fast'],
    ['CHEAPEST', OPTIMIZATION_PRESETS.CHEAPEST, 'cheap'],
    ['BALANCED', OPTIMIZATION_PRESETS.BALANCED, 'easy'],
  ] as const)('%s selects the expected route', (_name, preferences, expected) => {
    expect(getBestRoute(candidates, preferences)?.candidate.id).toBe(expected);
  });

  it('selects low walking and low transfer candidates under dominant custom weights', () => {
    const walking: OptimizationPreferences = { timeWeight: 0, costWeight: 0, walkingWeight: 1, transfersWeight: 0 };
    const transfers: OptimizationPreferences = { timeWeight: 0, costWeight: 0, walkingWeight: 0, transfersWeight: 1 };
    expect(getBestRoute(candidates, walking)?.candidate.id).toBe('easy');
    expect(getBestRoute(candidates, transfers)?.candidate.id).toBe('easy');
  });

  it('treats higher comfort as a lower penalty', () => {
    const comfortCandidates = [
      { id: 'low', label: 'Low comfort', mode: 'drive', durationSeconds: 100, comfortScore: 2 },
      { id: 'high', label: 'High comfort', mode: 'drive', durationSeconds: 100, comfortScore: 9 },
    ];
    expect(getBestRoute(comfortCandidates, OPTIMIZATION_PRESETS.COMFORT)?.candidate.id).toBe('high');
  });

  it('does not mutate input and uses duration then cost for stable ties', () => {
    const input = [
      { id: 'b', label: 'B', mode: 'drive', durationSeconds: 100, cost: 20 },
      { id: 'a', label: 'A', mode: 'drive', durationSeconds: 100, cost: 10 },
    ];
    const snapshot = structuredClone(input);
    expect(rankRoutes(input, OPTIMIZATION_PRESETS.BALANCED).ranked.map(item => item.candidate.id)).toEqual(['a', 'b']);
    expect(input).toEqual(snapshot);
  });

  it('maps existing travel styles to centralized presets', () => {
    expect(preferencesForTravelStyle('urgent')).toBe(OPTIMIZATION_PRESETS.FASTEST);
    expect(preferencesForTravelStyle('leisure')).toBe(OPTIMIZATION_PRESETS.BALANCED);
  });
});

describe('hard constraints', () => {
  it('filters before scoring and reports every applicable reason', () => {
    const result = rankRoutes(candidates, OPTIMIZATION_PRESETS.BALANCED, {
      maxCost: 60,
      maxDurationSeconds: 1000,
      maxWalkingDistanceMeters: 400,
      maxTransfers: 0,
    });
    expect(result.ranked.map(item => item.candidate.id)).toEqual(['easy']);
    expect(result.rejected.find(item => item.candidate.id === 'fast')?.reasons).toEqual([
      'exceeds-max-cost', 'exceeds-max-walking-distance', 'exceeds-max-transfers',
    ]);
    expect(result.rejected.find(item => item.candidate.id === 'cheap')?.reasons).toEqual([
      'exceeds-max-duration', 'exceeds-max-walking-distance', 'exceeds-max-transfers',
    ]);
  });

  it.each([
    [{ maxCost: 5 }, 'exceeds-max-cost'],
    [{ maxDurationSeconds: 500 }, 'exceeds-max-duration'],
    [{ maxWalkingDistanceMeters: 50 }, 'exceeds-max-walking-distance'],
    [{ maxTransfers: -0 }, 'exceeds-max-transfers'],
  ] as const)('enforces individual constraint %j', (constraint, reason) => {
    const result = rankRoutes(candidates, OPTIMIZATION_PRESETS.BALANCED, constraint);
    expect(result.rejected.some(item => item.reasons.includes(reason))).toBe(true);
  });

  it('returns a controlled empty ranking when all candidates are rejected', () => {
    const result = rankRoutes(candidates, OPTIMIZATION_PRESETS.BALANCED, { maxDurationSeconds: 1 });
    expect(result.ranked).toEqual([]);
    expect(result.rejected).toHaveLength(3);
  });
});

describe('missing metrics and explanations', () => {
  it('removes a metric missing from all candidates and redistributes its weight', () => {
    const withoutCost = candidates.map(({ cost: _cost, ...candidate }) => candidate);
    const result = rankRoutes(withoutCost, OPTIMIZATION_PRESETS.CHEAPEST);
    expect(result.ranked.every(item => item.effectiveWeights.cost === undefined)).toBe(true);
    expect(result.ranked.every(item => Number.isFinite(item.score))).toBe(true);
    expect(Object.values(result.ranked[0].effectiveWeights).reduce((sum, value) => sum + (value ?? 0), 0)).toBeCloseTo(1);
  });

  it('assigns a worst penalty when only some candidates lack a metric', () => {
    const partial = candidates.map(candidate => candidate.id === 'fast' ? { ...candidate, cost: undefined } : candidate);
    const result = rankRoutes(partial, OPTIMIZATION_PRESETS.CHEAPEST);
    const fast = result.ranked.find(item => item.candidate.id === 'fast');
    expect(fast?.normalizedMetrics.cost).toBe(1);
    expect(result.ranked[0].candidate.id).toBe('cheap');
  });

  it('derives factual advantages and trade-offs without absent metrics', () => {
    const result = rankRoutes(candidates, OPTIMIZATION_PRESETS.CHEAPEST);
    const cheap = result.ranked.find(item => item.candidate.id === 'cheap');
    expect(cheap?.explanation.advantages).toContain('Lowest known estimated cost');
    expect(cheap?.explanation.tradeOffs).toContain('10 minutes slower than the fastest option');
    const noCost = rankRoutes(candidates.map(({ cost: _cost, ...candidate }) => candidate), OPTIMIZATION_PRESETS.FASTEST);
    expect(JSON.stringify(noCost.ranked[0].explanation)).not.toContain('cost');
  });

  it('adapts a normalized provider route without changing units or geometry', () => {
    const geometry: [number, number][] = [[77.59, 12.97], [76.65, 12.3]];
    const candidate = routeToCandidate('road', 'Road route', 'drive', {
      totalDistance: 140595.5,
      totalDuration: 6957.4,
      summary: '140.6 km • 1h 55m',
      segments: [{ mode: 'drive', distance: 140595.5, duration: 6957.4, steps: [], geometry }],
    });
    const best = getBestRoute([candidate], OPTIMIZATION_PRESETS.FASTEST);
    expect(best?.candidate.distanceMeters).toBe(140595.5);
    expect(best?.candidate.route?.segments[0].geometry).toBe(geometry);
    expect(best?.qualityScore).toBe(100);
  });
});
