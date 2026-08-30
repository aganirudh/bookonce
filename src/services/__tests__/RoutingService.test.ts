import { afterEach, describe, expect, it, vi } from 'vitest';
import { routingService } from '../RoutingService';

describe('RoutingService OSRM fallback', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the real public OSRM driving profile', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        routes: [{
          distance: 1000,
          duration: 120,
          geometry: '??',
          legs: [{ distance: 1000, duration: 120, steps: [] }],
        }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await routingService.getRoute({ lat: 12, lng: 77 }, { lat: 13, lng: 78 }, 'drive');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/route/v1/driving/'));
  });

  it.each(['walk', 'bike'] as const)('does not fake %s routing through public OSRM', async mode => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(routingService.getRoute({ lat: 12, lng: 77 }, { lat: 13, lng: 78 }, mode)).rejects.toThrow('Failed to calculate route');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
