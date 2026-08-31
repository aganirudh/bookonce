import { describe, expect, it } from 'vitest';
import { proposeWeatherReplan } from '../ItineraryReplanner';

const park = { id: 'park', title: 'Park', category: 'outdoor' as const, flexibility: 'flexible' as const, timestamp: '2026-09-01T09:00' };
const museum = { id: 'museum', title: 'Museum', category: 'indoor' as const, flexibility: 'flexible' as const, timestamp: '2026-09-01T11:00' };
const results = [{ activityId: 'park', compatibility: 'unsuitable' as const, reasons: ['heavy-rain' as const] }, { activityId: 'museum', compatibility: 'compatible' as const, reasons: [] }];

describe('ItineraryReplanner', () => {
  it('proposes a deterministic same-day flexible swap without mutating input', () => {
    const input = [park, museum];
    const first = proposeWeatherReplan(input, results);
    expect(first.changes[0]).toMatchObject({ type: 'swap', firstActivityId: 'park', secondActivityId: 'museum' });
    expect(first.proposed.map(item => item.id)).toEqual(['museum', 'park']);
    expect(input).toEqual([park, museum]);
    expect(proposeWeatherReplan(input, results)).toEqual(first);
  });
  it.each([
    [{ ...park, flexibility: 'fixed' as const }, museum],
    [{ ...park, category: 'transport' as const }, museum],
  ])('never moves fixed or transport events', (...activities) => expect(proposeWeatherReplan(activities, results).changes).toHaveLength(0));
  it('returns a warning when no replacement exists', () => expect(proposeWeatherReplan([park], results).changes[0]).toMatchObject({ type: 'warning', activityId: 'park' }));
});
