import aiClient from '@/services/AIClient';
import { normalizeWeights } from './RouteOptimizer';
import { OPTIMIZATION_PRESETS, preferencesForTravelStyle, type OptimizationPreset } from './presets';
import type { OptimizationPreferences, RouteConstraints } from './types';

export interface InterpretedPreferences {
  preferences: OptimizationPreferences;
  constraints: RouteConstraints;
  summary: string;
  source: 'ai' | 'fallback';
}

const labels = { time: 'Time', cost: 'Cost', walking: 'Walking', transfers: 'Transfers', comfort: 'Comfort' } as const;

export function summarizePreferences(preferences: OptimizationPreferences): string {
  const normalized = normalizeWeights(preferences);
  return Object.entries(normalized)
    .filter(([, weight]) => weight > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([metric]) => labels[metric as keyof typeof labels])
    .join(' • ');
}

export function fallbackPreferences(style: 'urgent' | 'leisure'): InterpretedPreferences {
  const preferences = preferencesForTravelStyle(style);
  return {
    preferences,
    constraints: {},
    summary: style === 'urgent' ? 'Fastest' : 'Balanced',
    source: 'fallback',
  };
}

export class PreferenceInterpreter {
  async interpret(text: string, fallbackStyle: 'urgent' | 'leisure'): Promise<InterpretedPreferences> {
    if (!text.trim()) return fallbackPreferences(fallbackStyle);
    try {
      const extracted = await aiClient.interpretOptimizationPreferences(text.trim());
      const preset = extracted.preset as OptimizationPreset | null;
      const raw = extracted.weights ?? (preset ? OPTIMIZATION_PRESETS[preset] : undefined);
      if (!raw) return fallbackPreferences(fallbackStyle);
      const normalized = normalizeWeights(raw);
      const preferences: OptimizationPreferences = {
        timeWeight: normalized.time,
        costWeight: normalized.cost,
        walkingWeight: normalized.walking,
        transfersWeight: normalized.transfers,
        ...(raw.comfortWeight !== undefined ? { comfortWeight: normalized.comfort } : {}),
      };
      return {
        preferences,
        constraints: extracted.constraints ?? {},
        summary: extracted.weights ? summarizePreferences(preferences) : preset![0] + preset!.slice(1).toLowerCase(),
        source: 'ai',
      };
    } catch {
      return fallbackPreferences(fallbackStyle);
    }
  }
}

export const preferenceInterpreter = new PreferenceInterpreter();
