import { describe, expect, it } from 'vitest';
import { estimateTravelCost } from '../TravelCostEstimator';

describe('estimateTravelCost', () => {
  it.each([
    ['taxi', 10_000, 240, 'taxi-distance-v1'],
    ['auto', 10_000, 155, 'auto-distance-v1'],
    ['rapido', 10_000, 115, 'rapido-distance-v1'],
    ['car', 14_000, 135, 'private-car-v1'],
  ] as const)('estimates %s deterministically', (mode, distance, cost, model) => {
    expect(estimateTravelCost(mode, distance, 1000)).toMatchObject({ estimatedCost: cost, currency: 'INR', source: 'bookonce-estimate', model });
  });

  it('defines walking as zero monetary transport cost', () => {
    expect(estimateTravelCost('walk', 500)?.estimatedCost).toBe(0);
  });

  it('rounds estimates consistently to the nearest five rupees', () => {
    expect(estimateTravelCost('taxi', 1_100)?.estimatedCost % 5).toBe(0);
  });

  it.each([[-1], [Number.NaN], [Number.POSITIVE_INFINITY]])('rejects invalid distance %s', distance => {
    expect(estimateTravelCost('taxi', distance)).toBeUndefined();
  });

  it('rejects invalid duration and unsupported modes', () => {
    expect(estimateTravelCost('taxi', 1000, -1)).toBeUndefined();
    expect(estimateTravelCost('bike', 1000)).toBeUndefined();
  });
});
