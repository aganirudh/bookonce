import type { OptimizationPreferences } from './types';

export const OPTIMIZATION_PRESETS = {
  FASTEST: { timeWeight: 7, costWeight: 1, walkingWeight: 1, transfersWeight: 1 },
  CHEAPEST: { timeWeight: 1, costWeight: 7, walkingWeight: 1, transfersWeight: 1 },
  COMFORT: { timeWeight: 1, costWeight: 1, walkingWeight: 3, transfersWeight: 3, comfortWeight: 4 },
  BALANCED: { timeWeight: 1, costWeight: 1, walkingWeight: 1, transfersWeight: 1 },
} as const satisfies Record<string, OptimizationPreferences>;

export type OptimizationPreset = keyof typeof OPTIMIZATION_PRESETS;

export function preferencesForTravelStyle(style: 'urgent' | 'leisure'): OptimizationPreferences {
  return style === 'urgent' ? OPTIMIZATION_PRESETS.FASTEST : OPTIMIZATION_PRESETS.BALANCED;
}
