import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { FlightSearchCache } from '../flights/cache.js';
import { FlightProviderError } from '../flights/types.js';
import { createFlightsRouter } from './flights.js';

const valid = { origin: '27544008', destination: '27539793', departureDate: '2026-10-10', adults: 1, children: 0, infants: 0, cabinClass: 'economy', currency: 'INR', market: 'IN', locale: 'en-IN' };

describe('POST /api/flights/search', () => {
  let server; let baseUrl; const provider = { search: vi.fn(async query => [{ provider: 'rapidapi-skyscanner', carrierCode: 'AI', flightNumber: String(query.adults), departureAirportCode: 'BLR', arrivalAirportCode: 'DEL', scheduledDeparture: '2026-10-10T10:00:00Z', scheduledArrival: '2026-10-10T12:00:00Z' }]) };
  beforeAll(async () => {
    const app = express(); app.use(express.json()); app.use('/api/flights', createFlightsRouter({ provider, cache: new FlightSearchCache() }));
    server = app.listen(0); await new Promise(resolve => server.once('listening', resolve)); baseUrl = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

  const post = body => fetch(`${baseUrl}/api/flights/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  it('accepts a valid strict request and caches an identical search', async () => {
    expect((await post(valid)).status).toBe(200); const second = await post(valid);
    await expect(second.json()).resolves.toMatchObject({ success: true, cached: true });
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  it('uses separate entries for date, passenger, and cabin changes', async () => {
    await post({ ...valid, departureDate: '2026-10-11' }); await post({ ...valid, adults: 2 }); await post({ ...valid, cabinClass: 'business' });
    expect(provider.search).toHaveBeenCalledTimes(4);
  });

  it('rejects invalid fields and arbitrary provider URL/header injection', async () => {
    for (const addition of [{ providerUrl: 'https://evil.test' }, { headers: { authorization: 'x' } }, { departureDate: 'tomorrow' }, { adults: 20 }]) {
      expect((await post({ ...valid, ...addition })).status).toBe(400);
    }
  });

  it('returns a safe provider error without raw details', async () => {
    const failingProvider = { search: vi.fn().mockRejectedValue(new FlightProviderError('AUTHENTICATION_FAILED', 'private upstream body')) };
    const app = express(); app.use(express.json()); app.use('/api/flights', createFlightsRouter({ provider: failingProvider }));
    const failingServer = app.listen(0); await new Promise(resolve => failingServer.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${failingServer.address().port}/api/flights/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid) });
    expect(response.status).toBe(503); const text = await response.text(); expect(text).toContain('PROVIDER_AUTHENTICATION_FAILED'); expect(text).not.toContain('private upstream body');
    await new Promise(resolve => failingServer.close(resolve));
  });
});
