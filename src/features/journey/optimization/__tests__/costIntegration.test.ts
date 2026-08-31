import { describe, expect, it } from 'vitest';
import type { Route } from '@/services/RoutingService';
import { routeToCandidate, routesToCandidates } from '../adapters';
import { OPTIMIZATION_PRESETS } from '../presets';
import { rankRoutes } from '../RouteOptimizer';

const route = (id: string, distance: number, duration: number): Route => ({
  id, provider: 'osrm', segments: [{ mode: 'drive', distance, duration, steps: [], geometry: [] }],
  totalDistance: distance, totalDuration: duration, summary: id,
});

describe('estimated cost optimizer integration', () => {
  it('makes shorter taxi alternatives cheaper while preserving authoritative route facts', () => {
    const candidates = routesToCandidates([route('A', 143_000, 7100), route('B', 136_000, 7600)], 'drive', 'taxi');
    expect(candidates[1].cost).toBeLessThan(candidates[0].cost!);
    expect(candidates[0]).toMatchObject({ durationSeconds: 7100, distanceMeters: 143_000, costEstimate: { currency: 'INR', source: 'bookonce-estimate', model: 'taxi-distance-v1' } });
    expect(rankRoutes(candidates, OPTIMIZATION_PRESETS.FASTEST).ranked[0].candidate.id).toBe('A');
    expect(rankRoutes(candidates, OPTIMIZATION_PRESETS.CHEAPEST).ranked[0].candidate.id).toBe('B');
    expect(rankRoutes(candidates, { timeWeight: 1, costWeight: 9, walkingWeight: 0, transfersWeight: 0 }).ranked[0].candidate.id).toBe('B');
    expect(rankRoutes(candidates, { timeWeight: 9, costWeight: 1, walkingWeight: 0, transfersWeight: 0 }).ranked[0].candidate.id).toBe('A');
  });

  it('keeps explicitly supplied authoritative candidate cost unchanged', () => {
    const candidate = routeToCandidate('real', 'Real', 'drive', route('real', 1000, 100), { cost: 42 });
    expect(candidate.cost).toBe(42);
    expect(candidate.costEstimate).toBeUndefined();
  });

  it('applies maxCost to estimates and never treats unavailable bike cost as zero', () => {
    const [estimated] = routesToCandidates([route('taxi', 10_000, 1000)], 'drive', 'taxi');
    expect(rankRoutes([estimated], OPTIMIZATION_PRESETS.CHEAPEST, { maxCost: estimated.cost! }).ranked).toHaveLength(1);
    expect(rankRoutes([estimated], OPTIMIZATION_PRESETS.CHEAPEST, { maxCost: estimated.cost! - 1 }).rejected).toHaveLength(1);
    expect(routesToCandidates([route('bike', 10_000, 1000)], 'bike')[0].cost).toBeUndefined();
  });
});
