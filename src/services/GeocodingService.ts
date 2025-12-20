/**
 * GeocodingService
 *
 * Free geocoding using Nominatim (OpenStreetMap)
 * No API key required, but please respect usage limits
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  type: string;
}

class GeocodingService {
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private readonly USER_AGENT = 'VagabondTravelApp/1.0';

  /**
   * Search for a location by address/place name
   */
  async searchLocation(query: string): Promise<GeocodingResult[]> {
    try {
      const url =
        `${this.NOMINATIM_BASE_URL}/search?` +
        new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '5',
        });

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map((item: any) => this.parseNominatimResult(item));
    } catch (error) {
      console.error('Geocoding search error:', error);
      throw new Error('Failed to search location. Please try again.');
    }
  }

  /**
   * Reverse geocode: get address from coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    try {
      const url =
        `${this.NOMINATIM_BASE_URL}/reverse?` +
        new URLSearchParams({
          lat: lat.toString(),
          lon: lng.toString(),
          format: 'json',
          addressdetails: '1',
        });

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseNominatimResult(data);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Failed to get address. Please try again.');
    }
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        error => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Parse Nominatim result
   */
  private parseNominatimResult(item: any): GeocodingResult {
    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      address: {
        road: item.address?.road,
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        postcode: item.address?.postcode,
      },
      type: item.type,
    };
  }

  /**
   * Format address for display
   */
  formatAddress(result: GeocodingResult): string {
    const parts = [];

    if (result.address.road) parts.push(result.address.road);
    if (result.address.city) parts.push(result.address.city);
    if (result.address.state) parts.push(result.address.state);
    if (result.address.country) parts.push(result.address.country);

    return parts.join(', ') || result.displayName;
  }
}

export const geocodingService = new GeocodingService();
export default geocodingService;
