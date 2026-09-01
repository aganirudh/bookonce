import { useMemo, useState } from 'react';
import { rankRoutes } from './RouteOptimizer';
import { OPTIMIZATION_PRESETS, type OptimizationPreset } from './presets';
import type { OptimizationMetric, OptimizationPreferences, RouteCandidate } from './types';
import type { RoutingAlternative } from './routePresentation';

const preferenceKeys = {
  time: 'timeWeight',
  cost: 'costWeight',
  walking: 'walkingWeight',
  transfers: 'transfersWeight',
  comfort: 'comfortWeight',
} as const satisfies Record<OptimizationMetric, keyof OptimizationPreferences>;

function candidateFromAlternative(route: RoutingAlternative): RouteCandidate {
  return {
    id: route.id,
    label: route.label,
    mode: route.mode,
    durationSeconds: route.duration,
    distanceMeters: route.distance,
    cost: route.estimatedCost,
    walkingDistanceMeters: route.walkingDistance,
    transfers: route.transfers,
    comfortScore: route.comfortScore,
  };
}

function canCompare(values: Array<number | undefined>): boolean {
  return values.length > 1 && values.every(value => value !== undefined) && new Set(values).size > 1;
}

export function routeMetricAvailability(routes: readonly RoutingAlternative[]): Record<OptimizationMetric, boolean> {
  return {
    time: canCompare(routes.map(route => route.duration)),
    cost: canCompare(routes.map(route => route.estimatedCost)),
    walking: canCompare(routes.map(route => route.walkingDistance)),
    transfers: canCompare(routes.map(route => route.transfers)),
    comfort: canCompare(routes.map(route => route.comfortScore)),
  };
}

function totalWeight(preferences: OptimizationPreferences): number {
  return preferences.timeWeight + preferences.costWeight + preferences.walkingWeight +
    preferences.transfersWeight + (preferences.comfortWeight ?? 0);
}

export function useRouteWhatIfOptimization(
  routes: readonly RoutingAlternative[],
  originalPreferences: OptimizationPreferences
) {
  const [preferences, setPreferences] = useState<OptimizationPreferences>(() => ({ ...originalPreferences }));
  const [activePreset, setActivePreset] = useState<OptimizationPreset | null>(null);
  const availability = useMemo(() => routeMetricAvailability(routes), [routes]);
  const rankedRoutes = useMemo(() => {
    if (routes.length < 2) return [...routes];
    const result = rankRoutes(routes.map(candidateFromAlternative), preferences);
    const byId = new Map(routes.map(route => [route.id, route]));
    return result.ranked.map(ranked => ({
      ...byId.get(ranked.candidate.id)!,
      rank: ranked.rank,
      score: ranked.score,
      qualityScore: ranked.qualityScore,
      explanation: ranked.explanation,
    }));
  }, [preferences, routes]);

  const setWeight = (metric: OptimizationMetric, value: number) => {
    if (!availability[metric] || !Number.isFinite(value) || value < 0) return;
    setPreferences(previous => {
      const next = { ...previous, [preferenceKeys[metric]]: value };
      return totalWeight(next) > 0 ? next : previous;
    });
    setActivePreset(null);
  };

  const applyPreset = (preset: OptimizationPreset) => {
    setPreferences({ ...OPTIMIZATION_PRESETS[preset] });
    setActivePreset(preset);
  };

  const reset = () => {
    setPreferences({ ...originalPreferences });
    setActivePreset(null);
  };

  return { activePreset, applyPreset, availability, preferences, rankedRoutes, reset, setWeight };
}
