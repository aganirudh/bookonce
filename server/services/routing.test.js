import { afterEach, describe, expect, it, vi } from 'vitest';
import { deduplicateRoutes, getRoute, getRoutes, REQUEST_TIMEOUT_MS } from './routing.js';

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

describe('backend routing alternatives', () => {
  afterEach(() => { delete process.env.OPENROUTE_API_KEY; vi.unstubAllGlobals(); });

  const osrmRoute = (distance, duration, coordinates) => ({
    distance,
    duration,
    geometry: { coordinates },
    legs: [{ steps: [] }],
  });
  const orsFeature = (distance, duration, coordinates) => ({
    properties: { summary: { distance, duration }, segments: [{ steps: [] }] },
    geometry: { coordinates },
  });

  it('normalizes multiple genuine OSRM routes and preserves geometry and units', async () => {
    const routes = [
      osrmRoute(140000, 7000, [[77, 12], [76, 13]]),
      osrmRoute(145000, 6800, [[77, 12], [75, 13]]),
    ];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ routes }) });
    vi.stubGlobal('fetch', fetchMock);
    const result = await getRoutes(start, end, 'drive', 3);
    expect(fetchMock.mock.calls[0][0]).toContain('alternatives=2');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ provider: 'osrm', providerRouteIndex: 0, totalDistance: 140000, totalDuration: 7000 });
    expect(result[1].segments[0].geometry).toEqual([[77, 12], [75, 13]]);
    expect(result[0].id).toBe('drive-osrm-0-140000-7000');
  });

  it('normalizes multiple ORS GeoJSON features using native alternative settings', async () => {
    process.env.OPENROUTE_API_KEY = 'server-secret';
    const features = [
      orsFeature(140000, 7000, [[77, 12], [76, 13]]),
      orsFeature(150000, 6600, [[77, 12], [75, 13]]),
    ];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ features }) });
    vi.stubGlobal('fetch', fetchMock);
    const result = await getRoutes(start, end, 'drive', 3);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.alternative_routes).toEqual({ target_count: 2, weight_factor: 1.4, share_factor: 0.6 });
    expect(result.map(route => route.provider)).toEqual(['ors', 'ors']);
    expect(result[1].segments[0].geometry).toEqual([[77, 12], [75, 13]]);
  });

  it('accepts a provider returning one route and never duplicates it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ routes: [osrmRoute(1000, 100, [[1, 2], [3, 4]])] }) }));
    await expect(getRoutes(start, end, 'drive', 3)).resolves.toHaveLength(1);
  });

  it('retries ORS without alternatives when its alternative request is rejected', async () => {
    process.env.OPENROUTE_API_KEY = 'server-secret';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ features: [orsFeature(1000, 100, [[1, 2], [3, 4]])] }) });
    vi.stubGlobal('fetch', fetchMock);
    const result = await getRoutes(start, end, 'walk', 3);
    expect(result).toHaveLength(1);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).alternative_routes).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects zero routes and never fabricates a primary route', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ routes: [] }) }));
    await expect(getRoutes(start, end, 'drive', 3)).rejects.toThrow('no routes');
  });

  it.each(['walk', 'bike'])('does not fall back from %s to OSRM driving', async mode => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(getRoutes(start, end, mode, 3)).rejects.toMatchObject({ code: 'UNSUPPORTED_MODE' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deduplicates identical and near-identical routes but preserves meaningful differences', () => {
    const make = (id, distance, duration) => ({ id, totalDistance: distance, totalDuration: duration });
    const input = [make('a', 1000, 100), make('same', 1000, 100), make('near', 1025, 105), make('different', 1026, 106)];
    expect(deduplicateRoutes(input).map(route => route.id)).toEqual(['a', 'different']);
    expect(deduplicateRoutes(input).map(route => route.id)).toEqual(['a', 'different']);
  });
});
