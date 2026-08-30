export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: { road?: string; city?: string; state?: string; country?: string; postcode?: string };
  type: string;
}

interface ApiResponse<T> { success: boolean; data?: T; error?: string }

async function readApiResponse<T>(response: Response, fallback: string): Promise<T> {
  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(fallback);
  }
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.error || fallback);
  }
  return payload.data;
}

class GeocodingService {
  async searchLocation(query: string): Promise<GeocodingResult[]> {
    const response = await fetch(`/api/geocoding/search?${new URLSearchParams({ q: query })}`);
    return readApiResponse(response, 'Failed to search location. Please try again.');
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    const response = await fetch(`/api/geocoding/reverse?${new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    })}`);
    return readApiResponse(response, 'Failed to get address. Please try again.');
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        error => reject(new Error(`Geolocation error: ${error.message}`)),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

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
