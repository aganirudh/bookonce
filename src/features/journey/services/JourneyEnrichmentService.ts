import type { Itinerary, JourneySegment, Location } from '../schemas/aiSchemas';
import { geocodingService, type GeocodingResult } from '@/services/GeocodingService';
import { routingService } from '@/services/RoutingService';

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

class JourneyEnrichmentService {
  async enrich(itinerary: Itinerary): Promise<Itinerary> {
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
        const route = await routingService.getRoute(
          { lat: from.latitude, lng: from.longitude, address: from.name },
          { lat: to.latitude, lng: to.longitude, address: to.name },
          mode
        );
        segments.push({
          ...baseSegment,
          routeDistance: route.totalDistance,
          routeDuration: route.totalDuration,
          routeGeometry: route.segments.flatMap(routeSegment => routeSegment.geometry),
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
