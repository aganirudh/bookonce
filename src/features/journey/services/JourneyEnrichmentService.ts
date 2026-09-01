import type { Itinerary, JourneySegment, Location } from '../schemas/aiSchemas';
import { geocodingService, type GeocodingResult } from '@/services/GeocodingService';
import { routingService, type Route } from '@/services/RoutingService';
import { routesToCandidates } from '../optimization/adapters';
import { preferencesForTravelStyle } from '../optimization/presets';
import { rankRoutes } from '../optimization/RouteOptimizer';
import type { OptimizationPreferences, RouteConstraints } from '../optimization/types';
import type { CostEstimateMode } from '../cost/types';

export interface JourneyOptimizationOptions {
  preferences: OptimizationPreferences;
  constraints?: RouteConstraints;
  preferenceLabel?: string;
}

export type RoadRoutingMode = 'walk' | 'drive' | 'bike';

export const AI_TO_ROUTING_MODE = {
  walk: 'walk',
  car: 'drive',
  taxi: 'drive',
  auto: 'drive',
  rapido: 'drive',
} as const satisfies Partial<Record<JourneySegment['mode'], RoadRoutingMode>>;

function routingModeFor(mode: JourneySegment['mode']): RoadRoutingMode | undefined {
  return AI_TO_ROUTING_MODE[mode as keyof typeof AI_TO_ROUTING_MODE];
}

function costModeFor(mode: JourneySegment['mode']): CostEstimateMode | undefined {
  return mode === 'walk' || mode === 'car' || mode === 'taxi' || mode === 'auto' || mode === 'rapido'
    ? mode
    : undefined;
}

class JourneyEnrichmentService {
  async enrich(itinerary: Itinerary, optimization: 'urgent' | 'leisure' | JourneyOptimizationOptions = 'leisure'): Promise<Itinerary> {
    const preferences = typeof optimization === 'string' ? preferencesForTravelStyle(optimization) : optimization.preferences;
    const constraints = typeof optimization === 'string' ? {} : optimization.constraints ?? {};
    const preferenceLabel = typeof optimization === 'string'
      ? (optimization === 'urgent' ? 'Fastest' : 'Balanced')
      : optimization.preferenceLabel;
    const geocodeCache = new Map<string, GeocodingResult | null>();

    const geocode = async (location: Location): Promise<Location> => {
      const key = location.name.trim().toLocaleLowerCase();
      if (!geocodeCache.has(key)) {
        try {
          const [result] = await geocodingService.searchLocation(location.name);
          geocodeCache.set(key, result ?? null);
        } catch {
          geocodeCache.set(key, null);
        }
      }

      const result = geocodeCache.get(key);
      // Gemini coordinates are untrusted: deterministic geocoding wins, and
      // unverifiable coordinates are removed instead of being shown on a map.
      return result
        ? { name: location.name, latitude: result.lat, longitude: result.lng }
        : { name: location.name };
    };

    const origin = await geocode(itinerary.origin);
    const destination = await geocode(itinerary.destination);
    const segments: JourneySegment[] = [];

    for (const segment of itinerary.segments) {
      const from = await geocode(segment.from);
      const to = await geocode(segment.to);
      const mode = routingModeFor(segment.mode);
      const baseSegment = {
        ...segment,
        from,
        to,
        routeDistance: undefined,
        routeDuration: undefined,
        routeGeometry: undefined,
        selectedRouteCandidateId: undefined,
        routingAlternatives: undefined,
        optimizationPreferenceLabel: undefined,
        optimizationPreferences: undefined,
        optimizationWarnings: undefined,
      };

      if (!mode) {
        segments.push({ ...baseSegment, routingStatus: 'unsupported' });
        continue;
      }

      if (
        from.latitude === undefined || from.longitude === undefined ||
        to.latitude === undefined || to.longitude === undefined
      ) {
        segments.push({ ...baseSegment, routingStatus: 'unavailable' });
        continue;
      }

      try {
        const start = { lat: from.latitude, lng: from.longitude, address: from.name };
        const end = { lat: to.latitude, lng: to.longitude, address: to.name };
        let routes: Route[];
        try {
          routes = await routingService.getRoutes(start, end, mode, 3);
        } catch {
          routes = [await routingService.getRoute(start, end, mode)];
        }
        // Alternatives share the visible segment mode, currency, and model, so their estimates are comparable.
        const candidates = routesToCandidates(routes, mode, costModeFor(segment.mode));
        const ranking = rankRoutes(candidates, preferences, constraints);
        const selected = ranking.ranked[0];
        if (!selected?.candidate.route) throw new Error('No valid route candidates');
        const route = selected.candidate.route;
        segments.push({
          ...baseSegment,
          routeDistance: route.totalDistance,
          routeDuration: route.totalDuration,
          routeGeometry: route.segments.flatMap(routeSegment => routeSegment.geometry),
          selectedRouteCandidateId: selected.candidate.id,
          estimatedCost: selected.candidate.costEstimate?.estimatedCost ?? segment.estimatedCost,
          costEstimateSource: selected.candidate.costEstimate ? 'bookonce-estimate' : (segment.estimatedCost !== undefined ? 'ai-suggested' : undefined),
          costEstimateModel: selected.candidate.costEstimate?.model,
          costCurrency: selected.candidate.costEstimate?.currency,
          optimizationPreferenceLabel: preferenceLabel,
          optimizationPreferences: preferences,
          optimizationWarnings: candidates.every(candidate => candidate.cost === undefined) &&
            (constraints.maxCost !== undefined || preferences.costWeight >= Math.max(preferences.timeWeight, preferences.walkingWeight, preferences.transfersWeight, preferences.comfortWeight ?? 0))
            ? ['Cost could not be verified for these route options.']
            : undefined,
          routingAlternatives: ranking.ranked.map(ranked => ({
            id: ranked.candidate.id,
            label: ranked.candidate.label,
            provider: ranked.candidate.route?.provider,
            mode,
            distance: ranked.candidate.distanceMeters ?? ranked.candidate.route!.totalDistance,
            duration: ranked.candidate.durationSeconds,
            walkingDistance: ranked.candidate.walkingDistanceMeters,
            transfers: ranked.candidate.transfers,
            comfortScore: ranked.candidate.comfortScore,
            geometry: ranked.candidate.route!.segments.flatMap(routeSegment => routeSegment.geometry),
            rank: ranked.rank,
            score: ranked.score,
            qualityScore: ranked.qualityScore,
            estimatedCost: ranked.candidate.costEstimate?.estimatedCost,
            costEstimateSource: ranked.candidate.costEstimate?.source,
            costEstimateModel: ranked.candidate.costEstimate?.model,
            costCurrency: ranked.candidate.costEstimate?.currency,
            explanation: ranked.explanation,
          })),
          routingStatus: 'routed',
        });
      } catch {
        segments.push({ ...baseSegment, routingStatus: 'unavailable' });
      }
    }

    return { ...itinerary, origin, destination, segments };
  }
}

export const journeyEnrichmentService = new JourneyEnrichmentService();
export default journeyEnrichmentService;
