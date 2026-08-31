import type { WeatherHour } from '@/services/WeatherService';

export type ActivityCategory = 'indoor' | 'outdoor' | 'mixed' | 'transport';
export type ActivityFlexibility = 'fixed' | 'flexible';
export type WeatherCompatibility = 'compatible' | 'caution' | 'unsuitable' | 'unknown';
export type WeatherReasonCode = 'heavy-rain' | 'rain-likely' | 'high-heat' | 'very-high-heat' | 'high-wind' | 'weather-unavailable';

export interface WeatherActivity {
  id: string; title: string; category: ActivityCategory; flexibility: ActivityFlexibility;
  timestamp?: string; durationMinutes?: number;
}
export interface CompatibilityResult {
  activityId: string; compatibility: WeatherCompatibility; reasons: WeatherReasonCode[]; weather?: WeatherHour;
}
