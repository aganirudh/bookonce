import { describe, expect, it, vi } from 'vitest';
import { RapidApiSkyscannerAdapter } from './rapidApiSkyscanner.js';

const query = { origin: 'JFK', destination: 'LHR', departureDate: '2026-10-10', adults: 2, children: 0, infants: 0, cabinClass: 'economy', currency: 'USD', market: 'US', locale: 'en-US' };
const okPayload = { success: true, results: [] };

describe('RapidApiSkyscannerAdapter', () => {
  it('constructs a request from server configuration and validated query fields', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify(okPayload), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const adapter = new RapidApiSkyscannerAdapter({ apiKey: 'server-secret', host: 'skyscanner-flights4.p.rapidapi.com', searchPath: '/api/v1/search', fetchImpl });
    await expect(adapter.search(query)).resolves.toEqual([]);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain('https://skyscanner-flights4.p.rapidapi.com/api/v1/search?');
    expect(String(url)).toContain('origin=JFK'); expect(String(url)).toContain('destination=LHR');
    expect(String(url)).toContain('date=2026-10-10'); expect(String(url)).toContain('cabin=economy');
    expect(String(url)).toContain('limit=20'); expect(String(url)).not.toContain('children=');
    expect(options.headers).toEqual({ 'X-RapidAPI-Key': 'server-secret', 'X-RapidAPI-Host': 'skyscanner-flights4.p.rapidapi.com' });
  });

  it('rejects unverified child or infant semantics without calling the provider', async () => {
    const fetchImpl = vi.fn();
    const adapter = new RapidApiSkyscannerAdapter({ apiKey: 'x', host: 'ok.p.rapidapi.com', fetchImpl });
    await expect(adapter.search({ ...query, children: 1 })).rejects.toMatchObject({ code: 'UNSUPPORTED_PASSENGER_COMPOSITION' });
    await expect(adapter.search({ ...query, children: 0, infants: 1 })).rejects.toMatchObject({ code: 'UNSUPPORTED_PASSENGER_COMPOSITION' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects missing, non-RapidAPI, or path-injection configuration', async () => {
    for (const config of [{}, { apiKey: 'x', host: 'evil.test' }, { apiKey: 'x', host: 'ok.p.rapidapi.com', searchPath: 'https://evil.test' }]) {
      const adapter = new RapidApiSkyscannerAdapter({ ...config, fetchImpl: vi.fn() });
      await expect(adapter.search(query)).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
    }
  });

  it.each([[401, 'AUTHENTICATION_FAILED'], [403, 'AUTHENTICATION_FAILED'], [429, 'QUOTA_EXCEEDED'], [400, 'PROVIDER_REJECTED'], [500, 'PROVIDER_UNAVAILABLE']])('maps provider status %s safely', async (status, code) => {
    const adapter = new RapidApiSkyscannerAdapter({ apiKey: 'x', host: 'ok.p.rapidapi.com', fetchImpl: vi.fn().mockResolvedValue(new Response('private provider body', { status })) });
    await expect(adapter.search(query)).rejects.toMatchObject({ code });
  });

  it('rejects provider application errors even when HTTP status is 200', async () => {
    const adapter = new RapidApiSkyscannerAdapter({ apiKey: 'x', host: 'ok.p.rapidapi.com', fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: 'date is required' }), { status: 200, headers: { 'Content-Type': 'application/json' } })) });
    await expect(adapter.search(query)).rejects.toMatchObject({ code: 'PROVIDER_REJECTED' });
  });

  it('maps timeout, network, and malformed JSON failures', async () => {
    const configured = fetchImpl => new RapidApiSkyscannerAdapter({ apiKey: 'x', host: 'ok.p.rapidapi.com', fetchImpl });
    await expect(configured(vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError'))).search(query)).rejects.toMatchObject({ code: 'TIMEOUT' });
    await expect(configured(vi.fn().mockRejectedValue(new Error('private network'))).search(query)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    await expect(configured(vi.fn().mockResolvedValue(new Response('not-json', { status: 200 }))).search(query)).rejects.toMatchObject({ code: 'MALFORMED_RESPONSE' });
  });
});
