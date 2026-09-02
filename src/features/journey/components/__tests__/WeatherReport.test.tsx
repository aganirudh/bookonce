import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeatherReport } from '../WeatherReport';
import { evaluateWeatherCompatibility } from '../../weather/WeatherCompatibilityEngine';
import { weatherConditionLabel } from '../../weather/weatherCode';
import type { WeatherActivity } from '../../weather/types';

const activities: WeatherActivity[] = [{ id: 'park', title: 'City park', category: 'outdoor', flexibility: 'flexible', timestamp: '2026-09-20T10:10' }];
const hours = [
  { timestamp: '2026-09-20T09:00', temperatureC: 24, apparentTemperatureC: 25, precipitationProbability: 20, precipitationMm: 0.2, weatherCode: 2, windSpeedKph: 6 },
  { timestamp: '2026-09-20T10:00', temperatureC: 29, apparentTemperatureC: 31, precipitationProbability: 78, precipitationMm: 5, weatherCode: 65, windSpeedKph: 18 },
];
const compatibility = [evaluateWeatherCompatibility(activities[0], hours[1])];
describe('WeatherReport', () => {
  it('shows normalized summary and expands provider details without fetching', () => { const before = globalThis.fetch; render(<WeatherReport location="Mysuru" date="2026-09-20" forecast={{ status: 'available', timezone: 'Asia/Kolkata', hourly: hours }} activities={activities} compatibility={compatibility} />); expect(screen.getByText('29°C')).toBeInTheDocument(); expect(screen.getByText('Rain chance 78%')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'View weather details' })); expect(screen.getByRole('heading', { name: 'Detailed forecast' })).toBeInTheDocument(); expect(screen.getByText('Feels like 31°C')).toBeInTheDocument(); expect(screen.getByText('5 mm')).toBeInTheDocument(); expect(screen.getByText('18 km/h wind')).toBeInTheDocument(); expect(screen.getByText('Heavy rain')).toBeInTheDocument(); expect(globalThis.fetch).toBe(before); });
  it('uses the nearest activity hour and the engine result/reason', () => { render(<WeatherReport location="Mysuru" date="2026-09-20" forecast={{ status: 'available', hourly: hours }} activities={activities} compatibility={compatibility} />); fireEvent.click(screen.getByRole('button', { name: 'View weather details' })); expect(screen.queryByText('24°C')).not.toBeInTheDocument(); expect(screen.getByText('City park').closest('p')).toHaveTextContent('Unsuitable'); expect(screen.getByText('Heavy precipitation may affect this activity.')).toBeInTheDocument(); expect(screen.getByText('BookOnce derived')).toBeInTheDocument(); });
  it('uses deterministic WMO labels', () => { expect(weatherConditionLabel(0)).toBe('Clear'); expect(weatherConditionLabel(63)).toBe('Rain'); expect(weatherConditionLabel(95)).toBe('Thunderstorm'); expect(weatherConditionLabel(500)).toBe('Unknown'); });
  it('shows provider and range failures without fabricated values', () => { const { rerender } = render(<WeatherReport location="Mysuru" date="2026-09-20" activities={[]} compatibility={[]} />); expect(screen.getByText('Weather temporarily unavailable.')).toBeInTheDocument(); rerender(<WeatherReport location="Mysuru" date="2027-09-20" forecast={{ status: 'unavailable-out-of-range', hourly: [] }} activities={[]} compatibility={[]} />); expect(screen.getByText('Forecast unavailable for the selected date.')).toBeInTheDocument(); expect(screen.queryByText(/current weather|clear skies/i)).not.toBeInTheDocument(); });
});
