import { WEATHER_THRESHOLDS as T } from './weatherThresholds';
import type { CompatibilityResult, WeatherActivity } from './types';
import type { WeatherHour } from '@/services/WeatherService';

export function nearestWeatherHour(timestamp: string, hourly: readonly WeatherHour[]): WeatherHour | undefined {
  const target = Date.parse(timestamp);
  if (!Number.isFinite(target) || hourly.length === 0) return undefined;
  return hourly.reduce((best, item) => Math.abs(Date.parse(item.timestamp) - target) < Math.abs(Date.parse(best.timestamp) - target) ? item : best);
}

export function evaluateWeatherCompatibility(activity: WeatherActivity, weather?: WeatherHour): CompatibilityResult {
  if (!weather) return { activityId: activity.id, compatibility: 'unknown', reasons: ['weather-unavailable'] };
  if (activity.category === 'indoor' || activity.category === 'transport') return { activityId: activity.id, compatibility: 'compatible', reasons: [], weather };
  const reasons: CompatibilityResult['reasons'] = [];
  const heavyRain = weather.precipitationMm >= T.heavyPrecipitationMm || weather.precipitationProbability >= T.highPrecipitationProbability;
  if (heavyRain) reasons.push('heavy-rain');
  else if (weather.precipitationProbability >= T.moderatePrecipitationProbability) reasons.push('rain-likely');
  if (weather.temperatureC >= T.veryHighTemperatureC) reasons.push('very-high-heat');
  else if (weather.temperatureC >= T.highTemperatureC) reasons.push('high-heat');
  if (weather.windSpeedKph >= T.highWindKph) reasons.push('high-wind');
  const unsuitable = activity.category === 'outdoor' && (reasons.includes('heavy-rain') || reasons.includes('very-high-heat'));
  return { activityId: activity.id, compatibility: unsuitable ? 'unsuitable' : reasons.length ? 'caution' : 'compatible', reasons, weather };
}
