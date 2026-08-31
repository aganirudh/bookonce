const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 8_000;
export const WEATHER_CACHE_TTL_MS = 15 * 60_000;
const cache = new Map();

export function resetWeatherCache() { cache.clear(); }

export async function fetchWeatherForecast({ lat, lng, startDate, endDate }, fetchImpl = fetch) {
  const key = `${lat}:${lng}:${startDate}:${endDate}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('hourly', 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m');
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error('Weather provider failed');
  const data = await response.json();
  const hourly = data.hourly;
  if (!hourly || !Array.isArray(hourly.time)) throw new Error('Invalid weather provider response');
  const value = {
    status: 'available',
    timezone: data.timezone,
    hourly: hourly.time.map((timestamp, index) => ({
      timestamp,
      temperatureC: hourly.temperature_2m[index],
      apparentTemperatureC: hourly.apparent_temperature[index],
      precipitationProbability: hourly.precipitation_probability[index],
      precipitationMm: hourly.precipitation[index],
      weatherCode: hourly.weather_code[index],
      windSpeedKph: hourly.wind_speed_10m[index],
    })),
  };
  cache.set(key, { value, expiresAt: Date.now() + WEATHER_CACHE_TTL_MS });
  return value;
}
