import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataProvenanceBadge } from '@/components/ui/data-provenance';
import type { WeatherForecast, WeatherHour } from '@/services/WeatherService';
import type { CompatibilityResult, WeatherActivity } from '../weather/types';
import { nearestWeatherHour } from '../weather/WeatherCompatibilityEngine';
import { weatherConditionLabel } from '../weather/weatherCode';

const reasonText: Record<string, string> = {
  'heavy-rain': 'Heavy precipitation may affect this activity.', 'rain-likely': 'Rain is likely during this activity.',
  'high-heat': 'High temperature may make this activity less comfortable.', 'very-high-heat': 'Very high temperature conflicts with this outdoor activity.',
  'high-wind': 'High wind may affect this activity.', 'weather-unavailable': 'Weather data is unavailable for this activity.',
};
function timeLabel(timestamp: string) { const parsed = new Date(timestamp); return Number.isNaN(parsed.getTime()) ? timestamp.slice(11, 16) : new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(parsed); }
function HourCard({ hour }: { hour: WeatherHour }) { return <li className="min-w-36 rounded-lg border p-3 text-sm"><time dateTime={hour.timestamp}>{timeLabel(hour.timestamp)}</time><p>{hour.temperatureC}°C</p><p>Feels like {hour.apparentTemperatureC}°C</p><p>{hour.precipitationProbability}% rain</p><p>{hour.precipitationMm} mm</p><p>{hour.windSpeedKph} km/h wind</p><p>{weatherConditionLabel(hour.weatherCode)}</p></li>; }

export function WeatherReport({ location, date, forecast, activities, compatibility }: { location: string; date: string; forecast?: WeatherForecast; activities: WeatherActivity[]; compatibility: CompatibilityResult[] }) {
  const [open, setOpen] = useState(false);
  if (!forecast) return <Card><CardContent className="p-4">Weather temporarily unavailable.</CardContent></Card>;
  if (forecast.status === 'unavailable-out-of-range') return <Card><CardContent className="p-4">Forecast unavailable for the selected date.</CardContent></Card>;
  const datedHours = forecast.hourly.filter(hour => hour.timestamp.slice(0, 10) === date);
  const relevant = activities.map(activity => activity.timestamp ? nearestWeatherHour(activity.timestamp, datedHours) : undefined).filter((hour): hour is WeatherHour => Boolean(hour));
  const hours = relevant.length ? [...new Map(relevant.map(hour => [hour.timestamp, hour])).values()] : datedHours;
  const summary = relevant[0] ?? datedHours[0];
  const overall = compatibility.some(item => item.compatibility === 'unsuitable') ? 'Unsuitable' : compatibility.some(item => item.compatibility === 'caution') ? 'Caution' : compatibility.length ? 'Compatible' : 'Unknown';
  return <Card data-testid="weather-report"><CardHeader><CardTitle>Forecast at {location}</CardTitle></CardHeader><CardContent className="space-y-3">
    {summary && <div className="flex flex-wrap items-center gap-3"><span>{summary.temperatureC}°C</span><span>Rain chance {summary.precipitationProbability}%</span><span>Outdoor plans: {overall}</span><DataProvenanceBadge provenance="verified" /></div>}
    <Button type="button" variant="outline" aria-expanded={open} aria-controls="weather-details" onClick={() => setOpen(value => !value)}>{open ? 'Hide weather details' : 'View weather details'}</Button>
    {open && <section id="weather-details" aria-labelledby="weather-details-heading" className="space-y-4"><h3 id="weather-details-heading" className="font-semibold">Detailed forecast</h3><p>{location} • {date}{forecast.timezone ? ` • ${forecast.timezone}` : ''}</p>
      <ul className="flex gap-3 overflow-x-auto pb-2" aria-label="Hourly forecast">{hours.map(hour => <HourCard key={hour.timestamp} hour={hour} />)}</ul>
      <section aria-labelledby="weather-impact-heading"><div className="flex items-center gap-2"><h4 id="weather-impact-heading" className="font-semibold">Weather impact</h4><DataProvenanceBadge provenance="bookonce-derived" /></div>{activities.map(activity => { const result = compatibility.find(item => item.activityId === activity.id); return <div key={activity.id} className="mt-2"><p><strong>{activity.title}</strong>{activity.timestamp ? ` • ${timeLabel(activity.timestamp)}` : ''}: {result ? result.compatibility[0].toUpperCase() + result.compatibility.slice(1) : 'Unknown'}</p>{result?.reasons.map(reason => <p className="text-sm text-muted-foreground" key={reason}>{reasonText[reason]}</p>)}</div>; })}</section>
      <p className="text-xs text-muted-foreground">Provider forecast data. BookOnce compatibility is a planning heuristic, not official safety, emergency, or medical guidance.</p>
    </section>}
  </CardContent></Card>;
}
