import { describe, expect, it } from 'vitest';
import { PreferenceExtractionSchema } from '../preferenceSchema';

describe('PreferenceExtractionSchema', () => {
  it('accepts presets and valid custom weights with supported constraints', () => {
    expect(PreferenceExtractionSchema.safeParse({ preset: 'FASTEST' }).success).toBe(true);
    expect(PreferenceExtractionSchema.safeParse({
      preset: null,
      weights: { timeWeight: 2, costWeight: 8, walkingWeight: 3, transfersWeight: 1 },
      constraints: { maxCost: 1000, maxTransfers: 2 },
    }).success).toBe(true);
  });

  it.each([
    { preset: 'QUICKEST' },
    { preset: null, weights: { timeWeight: -1, costWeight: 1, walkingWeight: 1, transfersWeight: 1 } },
    { preset: null, weights: { timeWeight: 0, costWeight: 0, walkingWeight: 0, transfersWeight: 0 } },
    { preset: null, weights: { timeWeight: Number.NaN, costWeight: 1, walkingWeight: 1, transfersWeight: 1 } },
    { preset: null, weights: { timeWeight: Number.POSITIVE_INFINITY, costWeight: 1, walkingWeight: 1, transfersWeight: 1 } },
    { preset: 'FASTEST', constraints: { maximumStops: 2 } },
    'malformed',
  ])('rejects invalid or unsupported output %#', value => {
    expect(PreferenceExtractionSchema.safeParse(value).success).toBe(false);
  });
});
