import { describe, expect, it } from 'vitest';
import { crawlioDirectSearchResponse } from './fixtures/crawlioSearchResponse.js';
import { normalizeRapidApiResponse } from './normalizer.js';

describe('normalizeRapidApiResponse', () => {
  it('normalizes the sanitized real Crawlio direct-flight shape', () => {
    expect(normalizeRapidApiResponse(crawlioDirectSearchResponse)).toEqual([{
      provider: 'rapidapi-skyscanner', carrierCode: 'DL', carrierName: 'Delta', flightNumber: '5923',
      departureAirportCode: 'JFK', arrivalAirportCode: 'LHR',
      scheduledDeparture: '2026-09-15T18:30:00', scheduledArrival: '2026-09-16T06:30:00',
      price: 294.5, currency: 'USD', formattedPrice: '$295',
    }]);
  });

  it('does not collapse connecting operational segments into one identity', () => {
    const connecting = structuredClone(crawlioDirectSearchResponse);
    connecting.results[0].legs[0].segments.push({ flight: 'BA204', from: 'BOS', to: 'LHR', dep: '2026-09-15T21:00:00', arr: '2026-09-16T08:30:00' });
    expect(normalizeRapidApiResponse(connecting)).toEqual([]);
  });

  it('does not fabricate missing or unparseable identity', () => {
    const missing = structuredClone(crawlioDirectSearchResponse);
    missing.results[0].legs[0].segments[0].flight = 'Unknown flight';
    expect(normalizeRapidApiResponse(missing)).toEqual([]);
  });

  it('leaves missing price unavailable instead of fabricating zero', () => {
    const missing = structuredClone(crawlioDirectSearchResponse);
    delete missing.results[0].price_raw; delete missing.results[0].price;
    const [candidate] = normalizeRapidApiResponse(missing);
    expect(candidate).not.toHaveProperty('price'); expect(candidate).not.toHaveProperty('formattedPrice');
  });

  it('treats a successful empty result as no flights, not a failure', () => {
    expect(normalizeRapidApiResponse({ success: true, currency: 'USD', results: [] })).toEqual([]);
  });

  it('rejects malformed and application-error provider responses', () => {
    expect(() => normalizeRapidApiResponse({ success: true })).toThrow();
    expect(() => normalizeRapidApiResponse({ success: false, error: 'provider detail' })).toThrow();
  });
});
