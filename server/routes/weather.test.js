import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/weather.js', () => ({ fetchWeatherForecast: vi.fn() }));
import { fetchWeatherForecast } from '../services/weather.js';
import { app } from '../../server.js';

describe('GET /api/weather/forecast', () => {
  let server;
  let baseUrl;
  beforeAll(async () => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-08-31T12:00:00Z')); server = app.listen(0); await new Promise(resolve => server.once('listening', resolve)); baseUrl = `http://127.0.0.1:${server.address().port}`; });
  afterAll(async () => { await new Promise(resolve => server.close(resolve)); vi.useRealTimers(); });
  beforeEach(() => vi.clearAllMocks());

  it('returns a normalized valid forecast', async () => {
    const data = { status: 'available', timezone: 'Asia/Kolkata', hourly: [] };
    vi.mocked(fetchWeatherForecast).mockResolvedValue(data);
    const response = await fetch(`${baseUrl}/api/weather/forecast?lat=12.9&lng=77.6&startDate=2026-09-01&endDate=2026-09-01`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data });
  });

  it.each([
    'lat=91&lng=77&startDate=2026-09-01&endDate=2026-09-01',
    'lat=12&lng=181&startDate=2026-09-01&endDate=2026-09-01',
    'lat=12&lng=77&startDate=nope&endDate=2026-09-01',
    'lat=12&lng=77&startDate=2026-09-02&endDate=2026-09-01',
  ])('rejects invalid query %s', async query => expect((await fetch(`${baseUrl}/api/weather/forecast?${query}`)).status).toBe(400));

  it('returns controlled out-of-range status without calling the provider', async () => {
    const response = await fetch(`${baseUrl}/api/weather/forecast?lat=12&lng=77&startDate=2030-01-01&endDate=2030-01-01`);
    await expect(response.json()).resolves.toEqual({ success: true, data: { status: 'unavailable-out-of-range', hourly: [] } });
    expect(fetchWeatherForecast).not.toHaveBeenCalled();
  });

  it('returns a safe 502 when the provider fails or times out', async () => {
    vi.mocked(fetchWeatherForecast).mockRejectedValue(new Error('private provider detail'));
    const response = await fetch(`${baseUrl}/api/weather/forecast?lat=12&lng=77&startDate=2026-09-01&endDate=2026-09-01`);
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Weather forecast is temporarily unavailable' });
  });
});
