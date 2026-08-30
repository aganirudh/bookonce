import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/geocoding.js', () => ({ searchLocations: vi.fn(), reverseLocation: vi.fn() }));
vi.mock('../services/routing.js', () => ({ getRoute: vi.fn(), getRoutes: vi.fn() }));

import { app } from '../../server.js';
import { searchLocations } from '../services/geocoding.js';
import { getRoute, getRoutes } from '../services/routing.js';

describe('location API routes', () => {
  let server;
  let baseUrl;
  beforeAll(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(async () => new Promise(resolve => server.close(resolve)));
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized geocoding data for a valid query', async () => {
    const data = [{ lat: 12.97, lng: 77.59, displayName: 'Bengaluru', address: {}, type: 'city' }];
    vi.mocked(searchLocations).mockResolvedValue(data);
    const response = await fetch(`${baseUrl}/api/geocoding/search?q=Bengaluru`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data });
  });

  it('rejects a blank query', async () => {
    const response = await fetch(`${baseUrl}/api/geocoding/search?q=%20%20`);
    expect(response.status).toBe(400);
    expect(searchLocations).not.toHaveBeenCalled();
  });

  it('hides geocoding provider errors', async () => {
    vi.mocked(searchLocations).mockRejectedValue(new Error('private provider response'));
    const response = await fetch(`${baseUrl}/api/geocoding/search?q=Bengaluru`);
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Unable to geocode location' });
  });

  it('returns a valid normalized route', async () => {
    const data = { segments: [], totalDistance: 10, totalDuration: 2, summary: '10 m • 0m' };
    vi.mocked(getRoute).mockResolvedValue(data);
    const response = await fetch(`${baseUrl}/api/routing/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: { lat: 12, lng: 77 }, end: { lat: 13, lng: 78 }, mode: 'drive' }) });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data });
  });

  it.each([
    { start: { lat: 91, lng: 77 }, end: { lat: 13, lng: 78 }, mode: 'drive' },
    { start: { lat: 12, lng: 77 }, end: { lat: 13, lng: 78 }, mode: 'transit' },
  ])('rejects invalid route input', async body => {
    const response = await fetch(`${baseUrl}/api/routing/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    expect(response.status).toBe(400);
    expect(getRoute).not.toHaveBeenCalled();
  });

  it('returns 422 for a genuinely unavailable mode', async () => {
    vi.mocked(getRoute).mockRejectedValue(Object.assign(new Error('internal'), { code: 'UNSUPPORTED_MODE' }));
    const response = await fetch(`${baseUrl}/api/routing/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: { lat: 12, lng: 77 }, end: { lat: 13, lng: 78 }, mode: 'walk' }) });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Routing mode is unavailable' });
  });

  it('hides routing provider failures and timeouts', async () => {
    vi.mocked(getRoute).mockRejectedValue(new DOMException('private timeout', 'AbortError'));
    const response = await fetch(`${baseUrl}/api/routing/route`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: { lat: 12, lng: 77 }, end: { lat: 13, lng: 78 }, mode: 'drive' }) });
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Unable to calculate route' });
  });

  it('accepts alternatives requests and defaults to three routes', async () => {
    vi.mocked(getRoutes).mockResolvedValue([]);
    const response = await fetch(`${baseUrl}/api/routing/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: { lat: 12, lng: 77 }, end: { lat: 13, lng: 78 }, mode: 'drive' }) });
    expect(response.status).toBe(200);
    expect(getRoutes).toHaveBeenCalledWith({ lat: 12, lng: 77 }, { lat: 13, lng: 78 }, 'drive', 3);
  });

  it.each([0, 4, 1.5])('rejects invalid maxAlternatives %s', async maxAlternatives => {
    const response = await fetch(`${baseUrl}/api/routing/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: { lat: 12, lng: 77 }, end: { lat: 13, lng: 78 }, mode: 'drive', maxAlternatives }) });
    expect(response.status).toBe(400);
  });

  it('returns safe alternatives provider errors', async () => {
    vi.mocked(getRoutes).mockRejectedValue(new Error('private provider details'));
    const response = await fetch(`${baseUrl}/api/routing/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: { lat: 12, lng: 77 }, end: { lat: 13, lng: 78 }, mode: 'drive' }) });
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Unable to calculate routes' });
  });
});
