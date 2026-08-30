import { beforeEach, describe, expect, it, vi } from 'vitest';
import { geocodingService } from '../GeocodingService';
import { reviewService } from '../ReviewService';
import { safetyService } from '../SafetyService';

vi.mock('../GeocodingService', () => ({
  geocodingService: {
    searchLocation: vi.fn(),
    reverseGeocode: vi.fn(),
    formatAddress: vi.fn(),
  },
}));

describe('legacy geocoding consumers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('SafetyService maps canonical reverse-geocoding results', async () => {
    vi.mocked(geocodingService.reverseGeocode).mockResolvedValue({ lat: 12.97, lng: 77.59, displayName: 'Bengaluru, India', address: { city: 'Bengaluru', country: 'India' }, type: 'city' });
    await expect((safetyService as unknown as { getAreaName(lat: number, lng: number): Promise<string> }).getAreaName(12.97, 77.59)).resolves.toBe('Bengaluru, India');
    expect(geocodingService.reverseGeocode).toHaveBeenCalledWith(12.97, 77.59);
  });

  it('SafetyService preserves its coordinate fallback on geocoding failure', async () => {
    vi.mocked(geocodingService.reverseGeocode).mockRejectedValue(new Error('unavailable'));
    await expect((safetyService as unknown as { getAreaName(lat: number, lng: number): Promise<string> }).getAreaName(12.97, 77.59)).resolves.toBe('12.97°, 77.59°');
  });

  it('ReviewService maps canonical search results and preserves safe failure behavior', async () => {
    vi.mocked(geocodingService.searchLocation).mockResolvedValue([{ lat: 12.97, lng: 77.59, displayName: 'Cubbon Park, Bengaluru, India', address: { city: 'Bengaluru', country: 'India' }, type: 'park' }]);
    const results = await reviewService.searchPlaces('Cubbon Park', 12.97, 77.59);
    expect(results[0]).toMatchObject({ name: 'Cubbon Park', coordinates: [12.97, 77.59], address: 'Cubbon Park, Bengaluru, India' });
    expect(geocodingService.searchLocation).toHaveBeenCalledWith('Cubbon Park');

    vi.mocked(geocodingService.searchLocation).mockRejectedValue(new Error('unavailable'));
    await expect(reviewService.searchPlaces('missing')).resolves.toEqual([]);
  });
});
