/**
 * Free Routing Service
 *
 * Uses OpenRouteService API - FREE with optional API key
 * Free tier: 2000 requests/day, 40 requests/minute (with key)
 * Without key: Limited requests
 */

import { cacheStore } from '../utils/cache';

export interface RouteRequest {
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  mode?: 'driving-car' | 'cycling-regular' | 'foot-walking';
}

export interface RouteStep {
  lat: number;
  lng: number;
  instruction?: string;
  distance?: number; // meters
  duration?: number; // seconds
  type?: string;
  name?: string;
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
  summary: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

class FreeRoutingService {
  private readonly API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY || '';
  private readonly BASE_URL = 'https://api.openrouteservice.org/v2';
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  // Rate limiting
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds to be safe

  /**
   * Wait to respect rate limits
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve =>
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Search for a location using Nominatim (OpenStreetMap)
   */
  async searchLocation(query: string): Promise<any[]> {
    if (!query || query.length < 3) return [];

    const cacheKey = `search_${query.toLowerCase().trim()}`;
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as any[];
    }

    await this.waitForRateLimit();

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BookOnce-Travel-Planner/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      cacheStore.set(cacheKey, data, this.CACHE_DURATION);
      return data;
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  }

  /**
   * Get route between two points
   */
  async getRoute(request: RouteRequest): Promise<RouteResult> {
    const mode = request.mode || 'driving-car';
    const cacheKey = `route_${request.origin.lat}_${request.origin.lng}_${request.destination.lat}_${request.destination.lng}_${mode}`;

    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as RouteResult;
    }

    await this.waitForRateLimit();

    try {
      const url = `${this.BASE_URL}/directions/${mode}`;

      const body = {
        coordinates: [
          [request.origin.lng, request.origin.lat],
          [request.destination.lng, request.destination.lat],
        ],
        instructions: true,
        geometry: true,
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // Add API key if available
      if (this.API_KEY) {
        headers['Authorization'] = this.API_KEY;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Routing failed: ${response.status}`);
      }

      const data = await response.json();
      const result = this.parseRouteResult(data);

      // Cache result
      cacheStore.set(cacheKey, result, this.CACHE_DURATION);

      return result;
    } catch (error) {
      console.warn('OpenRouteService routing failed, trying OSRM fallback:', error);

      // Fallback to OSRM (Open Source Routing Machine) - Public API (No key needed)
      try {
        return await this.getOSRMRoute(request);
      } catch (osrmError) {
        console.error('OSRM fallback failed:', osrmError);
        // Final fallback to straight line
        return this.getStraightLineRoute(request);
      }
    }
  }

  /**
   * Get route using OSRM Public API (No API key required)
   */
  private async getOSRMRoute(request: RouteRequest): Promise<RouteResult> {
    // OSRM Public Server (Demo)
    const baseUrl = 'https://router.project-osrm.org/route/v1/driving';
    const coords = `${request.origin.lng},${request.origin.lat};${request.destination.lng},${request.destination.lat}`;
    const url = `${baseUrl}/${coords}?overview=full&geometries=geojson&steps=true`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('OSRM returned no routes');
    }

    return this.parseOSRMResponse(data);
  }

  /**
   * Parse OSRM response
   */
  private parseOSRMResponse(data: any): RouteResult {
    const route = data.routes[0];
    const geometry = route.geometry; // GeoJSON LineString

    // Parse steps
    const steps: RouteStep[] = [];
    const coordinates: [number, number][] = geometry.coordinates; // [lng, lat]

    if (route.legs && route.legs[0].steps) {
      route.legs[0].steps.forEach((step: any) => {
        // OSRM steps are detailed, we map them to our format
        steps.push({
          lat: step.maneuver.location[1],
          lng: step.maneuver.location[0],
          instruction: step.maneuver.type + (step.maneuver.modifier ? ' ' + step.maneuver.modifier : '') + (step.name ? ' on ' + step.name : ''),
          distance: step.distance,
          duration: step.duration,
          name: step.name
        });
      });
    }

    // Add all geometry points as intermediate steps for smooth map drawing
    // We only keep a subsample if it's too large to prevent performance issues
    // But for "detailed path", we want most of them.
    const pathSteps: RouteStep[] = coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));

    // OSRM bbox is [minLng, minLat, maxLng, maxLat] - same as we need
    // but sometimes it's not present, so we calculate
    let bbox: [number, number, number, number] = [-180, -90, 180, 90];
    if (route.bbox) {
      bbox = route.bbox;
    } else {
      const lats = coordinates.map(c => c[1]);
      const lngs = coordinates.map(c => c[0]);
      bbox = [
        Math.min(...lngs),
        Math.min(...lats),
        Math.max(...lngs),
        Math.max(...lats)
      ];
    }

    return {
      distance: route.distance,
      duration: route.duration,
      steps: pathSteps, // Use full geometry for map drawing
      summary: `${(route.distance / 1000).toFixed(1)} km, ${Math.round(route.duration / 60)} min (via OSRM)`,
      bbox: bbox
    };
  }

  /**
   * Parse OpenRouteService response
   */
  private parseRouteResult(data: any): RouteResult {
    const route = data.routes[0];
    const geometry = route.geometry;

    // Decode polyline geometry
    const coordinates = this.decodePolyline(geometry);

    // Parse steps
    const steps: RouteStep[] = [];

    if (route.segments && route.segments[0].steps) {
      route.segments[0].steps.forEach((step: any, index: number) => {
        const stepCoords = coordinates.slice(step.way_points[0], step.way_points[1] + 1);

        stepCoords.forEach((coord, coordIndex) => {
          steps.push({
            lat: coord[1],
            lng: coord[0],
            instruction: coordIndex === 0 ? step.instruction : undefined,
            distance: coordIndex === 0 ? step.distance : undefined,
            duration: coordIndex === 0 ? step.duration : undefined,
            type: step.type,
            name: step.name,
          });
        });
      });
    } else {
      // No detailed steps, just use coordinates
      coordinates.forEach(coord => {
        steps.push({
          lat: coord[1],
          lng: coord[0],
        });
      });
    }

    return {
      distance: route.summary.distance,
      duration: route.summary.duration,
      steps,
      summary: `${(route.summary.distance / 1000).toFixed(1)} km, ${Math.round(route.summary.duration / 60)} min`,
      bbox: route.bbox,
    };
  }

  /**
   * Decode polyline geometry (encoded as string)
   */
  private decodePolyline(encoded: any): [number, number][] {
    // If already decoded (array of coordinates)
    if (Array.isArray(encoded)) {
      return encoded as [number, number][];
    }

    // If encoded as string, decode it
    const coordinates: [number, number][] = [];
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

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push([lng / 1e5, lat / 1e5]);
    }

    return coordinates;
  }

  /**
   * Get straight line route as fallback
   */
  private getStraightLineRoute(request: RouteRequest): RouteResult {
    const distance = this.calculateDistance(
      request.origin.lat,
      request.origin.lng,
      request.destination.lat,
      request.destination.lng
    );

    // Estimate duration (assuming 50 km/h average speed)
    const duration = (distance / 50000) * 3600;

    return {
      distance,
      duration,
      steps: [
        {
          lat: request.origin.lat,
          lng: request.origin.lng,
          instruction: 'Start at origin',
        },
        {
          lat: request.destination.lat,
          lng: request.destination.lng,
          instruction: 'Arrive at destination',
        },
      ],
      summary: `${(distance / 1000).toFixed(1)} km (straight line), ~${Math.round(duration / 60)} min`,
      bbox: [
        Math.min(request.origin.lng, request.destination.lng),
        Math.min(request.origin.lat, request.destination.lat),
        Math.max(request.origin.lng, request.destination.lng),
        Math.max(request.origin.lat, request.destination.lat),
      ],
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

export const freeRoutingService = new FreeRoutingService();
export default freeRoutingService;
