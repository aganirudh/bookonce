import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWeatherForecast, resetWeatherCache } from './weather.js';

const providerData = { timezone: 'Asia/Kolkata', hourly: { time: ['2026-09-01T09:00'], temperature_2m: [28], apparent_temperature: [30], precipitation_probability: [75], precipitation: [4], weather_code: [63], wind_speed_10m: [12] } };

describe('weather service', () => {
  beforeEach(() => resetWeatherCache());
  it('normalizes provider data and caches identical requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(providerData) });
    const request = { lat: 12.9, lng: 77.6, startDate: '2026-09-01', endDate: '2026-09-01' };
    const first = await fetchWeatherForecast(request, fetchMock);
    const second = await fetchWeatherForecast(request, fetchMock);
    expect(first.hourly[0]).toEqual({ timestamp: '2026-09-01T09:00', temperatureC: 28, apparentTemperatureC: 30, precipitationProbability: 75, precipitationMm: 4, weatherCode: 63, windSpeedKph: 12 });
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('rejects provider failures without exposing details', async () => {
    await expect(fetchWeatherForecast({ lat: 1, lng: 2, startDate: '2026-09-01', endDate: '2026-09-01' }, vi.fn().mockResolvedValue({ ok: false }))).rejects.toThrow('Weather provider failed');
  });
});
