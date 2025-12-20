/**
 * Free Geocoding Service
 *
 * Uses OpenStreetMap Nominatim API - completely FREE, no API key required!
 * Please respect their usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */

import { cacheStore } from '../utils/cache';

export interface GeocodingResult {
  address: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  displayName: string;
}

class FreeGeocodingService {
  private readonly BASE_URL = 'https://nominatim.openstreetmap.org';
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  // Rate limiting: max 1 request per second
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second

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
   * Search for a location by query string
   */
  async search(query: string): Promise<GeocodingResult[]> {
    const cacheKey = `geocode_search_${query}`;

    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as GeocodingResult[];
    }

    await this.waitForRateLimit();

    try {
      const url = `${this.BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TravelEase Journey Planner',
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      const results = this.parseSearchResults(data);

      // Cache results
      cacheStore.set(cacheKey, results, this.CACHE_DURATION);

      return results;
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    const cacheKey = `geocode_reverse_${lat}_${lng}`;

    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as GeocodingResult;
    }

    await this.waitForRateLimit();

    try {
      const url = `${this.BASE_URL}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TravelEase Journey Planner',
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      const result = this.parseReverseResult(data);

      // Cache result
      cacheStore.set(cacheKey, result, this.CACHE_DURATION);

      return result;
    } catch (error) {
      console.error('Nominatim reverse geocoding error:', error);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Parse search results from Nominatim
   */
  private parseSearchResults(data: any[]): GeocodingResult[] {
    return data.map(item => ({
      address: item.display_name,
      city: item.address?.city || item.address?.town || item.address?.village || '',
      country: item.address?.country || '',
      coordinates: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      },
      placeId: item.place_id?.toString(),
      displayName: item.display_name,
    }));
  }

  /**
   * Parse reverse geocoding result from Nominatim
   */
  private parseReverseResult(data: any): GeocodingResult {
    return {
      address: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village || '',
      country: data.address?.country || '',
      coordinates: {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
      },
      placeId: data.place_id?.toString(),
      displayName: data.display_name,
    };
  }
}

export const freeGeocodingService = new FreeGeocodingService();
export default freeGeocodingService;
