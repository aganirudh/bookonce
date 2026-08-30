import { afterEach, describe, expect, it, vi } from 'vitest';
import { geocodingService } from '../GeocodingService';

describe('GeocodingService backend client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the BookOnce search endpoint and returns its normalized contract', async () => {
    const data = [{ lat: 12.97, lng: 77.59, displayName: 'Bengaluru', address: { city: 'Bengaluru' }, type: 'city' }];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true, data }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(geocodingService.searchLocation('Bengaluru')).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith('/api/geocoding/search?q=Bengaluru');
  });

  it('uses the reverse endpoint', async () => {
    const data = { lat: 12.97, lng: 77.59, displayName: 'Bengaluru', address: {}, type: 'city' };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true, data }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(geocodingService.reverseGeocode(12.97, 77.59)).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith('/api/geocoding/reverse?lat=12.97&lng=77.59');
  });

  it('propagates the safe backend error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ success: false, error: 'Unable to geocode location' }) }));
    await expect(geocodingService.searchLocation('x')).rejects.toThrow('Unable to geocode location');
  });
});
