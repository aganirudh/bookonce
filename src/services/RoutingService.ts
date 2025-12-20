/**
 * RoutingService
 *
 * Multi-modal routing service using free APIs:
 * - OpenRouteService (2000 requests/day free)
 * - OSRM (unlimited if self-hosted)
 *
 * Supports: car, bike, foot, wheelchair
 */

export interface RoutePoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface RouteSegment {
  mode: 'walk' | 'drive' | 'bike' | 'transit';
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
  geometry: [number, number][]; // [lng, lat] pairs
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  type: string;
}

export interface Route {
  segments: RouteSegment[];
  totalDistance: number; // meters
  totalDuration: number; // seconds
  summary: string;
}

class RoutingService {
  private readonly ORS_API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY || '';
  private readonly ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

  // Fallback to OSRM (no API key needed, but limited features)
  private readonly OSRM_BASE_URL = 'https://router.project-osrm.org';

  /**
   * Get route between two points
   */
  async getRoute(
    start: RoutePoint,
    end: RoutePoint,
    mode: 'walk' | 'drive' | 'bike' = 'drive'
  ): Promise<Route> {
    try {
      // Try OpenRouteService first (better features)
      if (this.ORS_API_KEY) {
        return await this.getORSRoute(start, end, mode);
      }

      // Fallback to OSRM (free, no key needed)
      return await this.getOSRMRoute(start, end, mode);
    } catch (error) {
      console.error('Routing error:', error);
      throw new Error('Failed to calculate route. Please try again.');
    }
  }

  /**
   * Get multi-modal route (walk + transit + walk)
   */
  async getMultiModalRoute(start: RoutePoint, end: RoutePoint): Promise<Route> {
    // For now, return a simple route
    // TODO: Integrate GTFS transit data
    return this.getRoute(start, end, 'walk');
  }

  /**
   * OpenRouteService routing
   */
  private async getORSRoute(
    start: RoutePoint,
    end: RoutePoint,
    mode: 'walk' | 'drive' | 'bike'
  ): Promise<Route> {
    const profile = this.getORSProfile(mode);
    const url = `${this.ORS_BASE_URL}/directions/${profile}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.ORS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
        instructions: true,
        elevation: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`ORS API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseORSResponse(data, mode);
  }

  /**
   * OSRM routing (fallback, free)
   */
  private async getOSRMRoute(
    start: RoutePoint,
    end: RoutePoint,
    mode: 'walk' | 'drive' | 'bike'
  ): Promise<Route> {
    const profile = mode === 'walk' ? 'foot' : mode === 'bike' ? 'bike' : 'car';
    const url = `${this.OSRM_BASE_URL}/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&steps=true`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseOSRMResponse(data, mode);
  }

  /**
   * Parse OpenRouteService response
   */
  private parseORSResponse(data: any, mode: 'walk' | 'drive' | 'bike'): Route {
    const route = data.routes[0];
    const segment = route.segments[0];

    const steps: RouteStep[] = segment.steps.map((step: any) => ({
      instruction: step.instruction,
      distance: step.distance,
      duration: step.duration,
      type: step.type,
    }));

    return {
      segments: [
        {
          mode,
          distance: segment.distance,
          duration: segment.duration,
          steps,
          geometry: route.geometry.coordinates,
        },
      ],
      totalDistance: route.summary.distance,
      totalDuration: route.summary.duration,
      summary: `${this.formatDistance(route.summary.distance)} • ${this.formatDuration(route.summary.duration)}`,
    };
  }

  /**
   * Parse OSRM response
   */
  private parseOSRMResponse(data: any, mode: 'walk' | 'drive' | 'bike'): Route {
    const route = data.routes[0];
    const leg = route.legs[0];

    const steps: RouteStep[] = leg.steps.map((step: any) => ({
      instruction:
        step.maneuver.instruction || `Continue for ${this.formatDistance(step.distance)}`,
      distance: step.distance,
      duration: step.duration,
      type: step.maneuver.type,
    }));

    // Decode geometry (OSRM uses polyline encoding)
    const geometry = this.decodePolyline(route.geometry);

    return {
      segments: [
        {
          mode,
          distance: leg.distance,
          duration: leg.duration,
          steps,
          geometry,
        },
      ],
      totalDistance: route.distance,
      totalDuration: route.duration,
      summary: `${this.formatDistance(route.distance)} • ${this.formatDuration(route.duration)}`,
    };
  }

  /**
   * Get ORS profile name
   */
  private getORSProfile(mode: 'walk' | 'drive' | 'bike'): string {
    const profiles = {
      walk: 'foot-walking',
      drive: 'driving-car',
      bike: 'cycling-regular',
    };
    return profiles[mode];
  }

  /**
   * Decode polyline (for OSRM geometry)
   */
  private decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push([lng / 1e5, lat / 1e5]);
    }

    return points;
  }

  /**
   * Format distance for display
   */
  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

export const routingService = new RoutingService();
export default routingService;
