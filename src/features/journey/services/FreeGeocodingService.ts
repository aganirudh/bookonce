import { geocodingService, type GeocodingResult as ApiGeocodingResult } from '@/services/GeocodingService';

export interface GeocodingResult {
  address: string;
  city: string;
  country: string;
  coordinates: { lat: number; lng: number };
  placeId?: string;
  displayName: string;
}

function adapt(result: ApiGeocodingResult): GeocodingResult {
  return {
    address: result.displayName,
    city: result.address.city || '',
    country: result.address.country || '',
    coordinates: { lat: result.lat, lng: result.lng },
    displayName: result.displayName,
  };
}

class FreeGeocodingService {
  async search(query: string): Promise<GeocodingResult[]> {
    return (await geocodingService.searchLocation(query)).map(adapt);
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    return adapt(await geocodingService.reverseGeocode(lat, lng));
  }
}

export const freeGeocodingService = new FreeGeocodingService();
export default freeGeocodingService;
