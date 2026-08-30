import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REQUEST_TIMEOUT_MS, resetGeocodingCache, searchLocations } from './geocoding.js';

describe('backend geocoding service', () => {
  beforeEach(() => resetGeocodingCache());
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('normalizes provider results and normalized queries share the cache', async () => {
    const providerResult = [{ lat: '12.9716', lon: '77.5946', display_name: 'Bengaluru, India', type: 'city', address: { city: 'Bengaluru', state: 'Karnataka', country: 'India', postcode: '560001' } }];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(providerResult) });
    vi.stubGlobal('fetch', fetchMock);

    const first = await searchLocations('Bengaluru');
    const second = await searchLocations(' bengaluru ');

    expect(first).toEqual([{ lat: 12.9716, lng: 77.5946, displayName: 'Bengaluru, India', type: 'city', address: { road: undefined, city: 'Bengaluru', state: 'Karnataka', country: 'India', postcode: '560001' } }]);
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('aborts a provider request after the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));
    const request = expect(searchLocations('Bengaluru')).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await request;
  });
});
