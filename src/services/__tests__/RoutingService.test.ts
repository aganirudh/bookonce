import { afterEach, describe, expect, it, vi } from 'vitest';
import { routingService, type Route } from '../RoutingService';

const route: Route = { segments: [{ mode: 'drive', distance: 1000, duration: 120, steps: [], geometry: [[77, 12], [78, 13]] }], totalDistance: 1000, totalDuration: 120, summary: '1.0 km • 2m' };

describe('RoutingService backend client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts deterministic inputs to the BookOnce routing API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true, data: route }) });
    vi.stubGlobal('fetch', fetchMock);
    const start = { lat: 12, lng: 77, address: 'Start' };
    const end = { lat: 13, lng: 78 };
    await expect(routingService.getRoute(start, end, 'drive')).resolves.toEqual(route);
    expect(fetchMock).toHaveBeenCalledWith('/api/routing/route', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start, end, mode: 'drive' }) });
  });

  it('propagates the safe backend error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ success: false, error: 'Routing mode is unavailable' }) }));
    await expect(routingService.getRoute({ lat: 12, lng: 77 }, { lat: 13, lng: 78 }, 'walk')).rejects.toThrow('Routing mode is unavailable');
  });
});
