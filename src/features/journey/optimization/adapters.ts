import type { JourneySegment } from '../schemas/aiSchemas';
import type { Route } from '@/services/RoutingService';
import type { RouteCandidate } from './types';

interface CandidateEstimates {
  cost?: number;
  walkingDistanceMeters?: number;
  transfers?: number;
  comfortScore?: number;
}

export function routeToCandidate(
  id: string,
  label: string,
  mode: 'walk' | 'drive' | 'bike',
  route: Route,
  estimates: CandidateEstimates = {}
): RouteCandidate {
  return {
    id,
    label,
    mode,
    durationSeconds: route.totalDuration,
    distanceMeters: route.totalDistance,
    ...estimates,
    route,
  };
}

export function routesToCandidates(
  routes: readonly Route[],
  mode: 'walk' | 'drive' | 'bike'
): RouteCandidate[] {
  return routes.map((route, index) => routeToCandidate(
    route.id ?? `${mode}-${route.provider ?? 'bookonce'}-${route.providerRouteIndex ?? index}-${Math.round(route.totalDistance)}-${Math.round(route.totalDuration)}`,
    index === 0 ? 'Primary route' : `Alternative ${index}`,
    mode,
    route,
    mode === 'walk' ? { walkingDistanceMeters: route.totalDistance } : {}
  ));
}

export function segmentToCandidate(segment: JourneySegment, index: number): RouteCandidate | null {
  const durationSeconds = segment.routeDuration ??
    (segment.duration !== undefined ? segment.duration * 60 : undefined);
  if (durationSeconds === undefined) return null;

  return {
    id: `segment-${index}-${segment.mode}`,
    label: `${segment.from.name} to ${segment.to.name}`,
    mode: segment.mode,
    durationSeconds,
    cost: segment.estimatedCost,
    walkingDistanceMeters: segment.mode === 'walk'
      ? (segment.routeDistance ?? (segment.distance !== undefined ? segment.distance * 1000 : undefined))
      : undefined,
    distanceMeters: segment.routeDistance ??
      (segment.distance !== undefined ? segment.distance * 1000 : undefined),
    segment,
  };
}
