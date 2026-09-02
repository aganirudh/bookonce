import { beforeEach, describe, expect, it, vi } from 'vitest';
import { skyscannerService } from '../SkyscannerService';

const query = { originSkyId: 'BLR', destinationSkyId: 'DEL', originEntityId: '27544008', destinationEntityId: '27539793', date: '2026-10-10', cabinClass: 'economy' as const, adults: 1 };
const candidate = { provider: 'rapidapi-skyscanner', carrierCode: 'AI', flightNumber: '202', departureAirportCode: 'BLR', arrivalAirportCode: 'DEL', scheduledDeparture: '2026-10-10T10:00:00Z', scheduledArrival: '2026-10-10T12:00:00Z' };

describe('SkyscannerService', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('calls only the BookOnce backend using the normalized request contract', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true, candidates: [candidate] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await expect(skyscannerService.searchFlights(query)).resolves.toEqual([candidate]);
    expect(fetchMock).toHaveBeenCalledWith('/api/flights/search', expect.objectContaining({ method: 'POST' }));
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request).toMatchObject({ origin: 'BLR', destination: 'DEL', departureDate: '2026-10-10', adults: 1 });
    expect(request).not.toHaveProperty('price');
  });

  it('returns a safe error for backend and malformed response failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ error: 'private detail' }), { status: 503 })).mockResolvedValueOnce(new Response('bad json', { status: 200 }));
    await expect(skyscannerService.searchFlights(query)).rejects.toThrow('temporarily unavailable');
    await expect(skyscannerService.searchFlights(query)).rejects.toThrow('temporarily unavailable');
  });

  it('retains formatting helpers', () => {
    expect(skyscannerService.formatDuration(90)).toBe('1h 30m');
    expect(skyscannerService.formatTime('2026-10-10T10:00:00Z')).toMatch(/\d{2}:\d{2}/);
  });
});
