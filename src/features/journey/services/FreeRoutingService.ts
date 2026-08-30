import { geocodingService } from '@/services/GeocodingService';
import { routingService } from '@/services/RoutingService';

export interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode?: 'driving-car' | 'cycling-regular' | 'foot-walking';
}

export interface RouteStep {
  lat: number;
  lng: number;
  instruction?: string;
  distance?: number;
  duration?: number;
  type?: string;
  name?: string;
}

export interface RouteResult {
  distance: number;
  duration: number;
  steps: RouteStep[];
  summary: string;
  bbox: [number, number, number, number];
}

const modes = {
  'driving-car': 'drive',
  'cycling-regular': 'bike',
  'foot-walking': 'walk',
} as const;

class FreeRoutingService {
  async searchLocation(query: string): Promise<unknown[]> {
    if (!query || query.trim().length < 3) return [];
    return geocodingService.searchLocation(query);
  }

  async getRoute(request: RouteRequest): Promise<RouteResult> {
    const route = await routingService.getRoute(
      request.origin,
      request.destination,
      modes[request.mode || 'driving-car']
    );
    const coordinates = route.segments.flatMap(segment => segment.geometry);
    const lngs = coordinates.map(point => point[0]);
    const lats = coordinates.map(point => point[1]);

    return {
      distance: route.totalDistance,
      duration: route.totalDuration,
      steps: coordinates.map(([lng, lat]) => ({ lat, lng })),
      summary: route.summary,
      bbox: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
    };
  }

  formatDistance(meters: number): string {
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}

export const freeRoutingService = new FreeRoutingService();
export default freeRoutingService;
