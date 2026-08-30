import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRoute, REQUEST_TIMEOUT_MS } from './routing.js';

const start = { lat: 12.97, lng: 77.59 };
const end = { lat: 12.3, lng: 76.65 };

describe('backend routing service', () => {
  afterEach(() => { delete process.env.OPENROUTE_API_KEY; vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('uses and normalizes ORS GeoJSON when the server key is configured', async () => {
    process.env.OPENROUTE_API_KEY = 'server-secret';
    const geometry = [[77.59, 12.97], [76.65, 12.3]];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ features: [{ properties: { summary: { distance: 140595.5, duration: 6957.4 }, segments: [{ steps: [{ instruction: 'Head west', distance: 100, duration: 20, type: 11 }] }] }, geometry: { coordinates: geometry } }] }) });
    vi.stubGlobal('fetch', fetchMock);

    const route = await getRoute(start, end, 'drive');
    expect(fetchMock.mock.calls[0][0]).toContain('/directions/driving-car/geojson');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('server-secret');
    expect(route.totalDistance).toBe(140595.5);
    expect(route.totalDuration).toBe(6957.4);
    expect(route.segments[0].geometry).toBe(geometry);
  });

  it('uses the OSRM driving fallback with GeoJSON geometry', async () => {
    const geometry = [[77.59, 12.97], [76.65, 12.3]];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ routes: [{ distance: 140000, duration: 7000, geometry: { coordinates: geometry }, legs: [{ steps: [{ maneuver: { type: 'depart', instruction: 'Depart' }, distance: 50, duration: 10 }] }] }] }) });
    vi.stubGlobal('fetch', fetchMock);
    const route = await getRoute(start, end, 'drive');
    expect(fetchMock.mock.calls[0][0]).toContain('/route/v1/driving/');
    expect(route.segments[0].geometry).toEqual(geometry);
  });

  it.each(['walk', 'bike'])('never fabricates %s as an OSRM driving route', async mode => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    await expect(getRoute(start, end, mode)).rejects.toMatchObject({ code: 'UNSUPPORTED_MODE' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates provider failures internally', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(getRoute(start, end, 'drive')).rejects.toThrow('Routing provider failed');
  });

  it('aborts a provider request after the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));
    const request = expect(getRoute(start, end, 'drive')).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await request;
  });
});
