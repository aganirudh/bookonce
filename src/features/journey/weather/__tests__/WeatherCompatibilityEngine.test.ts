import { describe, expect, it } from 'vitest';
import { evaluateWeatherCompatibility } from '../WeatherCompatibilityEngine';

const hour = (overrides = {}) => ({ timestamp: '2026-09-01T09:00', temperatureC: 28, apparentTemperatureC: 29, precipitationProbability: 0, precipitationMm: 0, weatherCode: 0, windSpeedKph: 5, ...overrides });
const activity = (category: 'indoor' | 'outdoor') => ({ id: 'a', title: 'Visit', category, flexibility: 'flexible' as const });

describe('WeatherCompatibilityEngine', () => {
  it('keeps indoor activities compatible in rain', () => expect(evaluateWeatherCompatibility(activity('indoor'), hour({ precipitationMm: 10 })).compatibility).toBe('compatible'));
  it('marks heavy rain outdoors unsuitable', () => expect(evaluateWeatherCompatibility(activity('outdoor'), hour({ precipitationMm: 4 })).compatibility).toBe('unsuitable'));
  it('marks moderate rain outdoors caution', () => expect(evaluateWeatherCompatibility(activity('outdoor'), hour({ precipitationProbability: 50 })).compatibility).toBe('caution'));
  it('applies deterministic heat and wind thresholds', () => {
    expect(evaluateWeatherCompatibility(activity('outdoor'), hour({ temperatureC: 40 })).compatibility).toBe('unsuitable');
    expect(evaluateWeatherCompatibility(activity('outdoor'), hour({ windSpeedKph: 40 })).compatibility).toBe('caution');
  });
  it('returns unknown when weather is missing', () => expect(evaluateWeatherCompatibility(activity('outdoor')).compatibility).toBe('unknown'));
});
