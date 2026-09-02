import { afterEach, describe, expect, it, vi } from 'vitest';
import { DisruptionClient } from '../DisruptionClient';

describe('DisruptionClient', () => {
  it('reads provider capabilities without exposing credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ providers: [{ provider: 'Aviationstack', capabilities: ['flight_status'] }] }) }));
    await expect(new DisruptionClient().providers()).resolves.toEqual([{ provider: 'Aviationstack', capabilities: ['flight_status'] }]);
  });
  afterEach(() => vi.unstubAllGlobals());
  it('uses only the backend endpoint and returns safe results', async () => {
    const body = { success: true, status: 'ok', results: [] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(body) }); vi.stubGlobal('fetch', fetchMock);
    const request = { provider: 'Configured Provider', capability: 'flight_status' as const, itineraryNodes: [{ nodeId: 'flight', kind: 'transport' }], query: { subjects: [{ type: 'flight', carrierCode: 'AI', flightNumber: '202' }] } };
    await expect(new DisruptionClient().check(request)).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith('/api/disruptions/check', expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }));
  });
  it('maps unavailable providers to a safe client error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ status: 'provider-unavailable' }) }));
    await expect(new DisruptionClient().check({ provider: 'none', capability: 'flight_status', itineraryNodes: [], query: { subjects: [] } })).rejects.toThrow('PROVIDER_UNAVAILABLE');
  });
  it('preserves only safe provider failure categories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ status: 'provider-unavailable', reason: 'quota' }) }));
    await expect(new DisruptionClient().check({ provider: 'Aviationstack', capability: 'flight_status', itineraryNodes: [], query: { subjects: [] } })).rejects.toThrow('PROVIDER_QUOTA');
  });
});
