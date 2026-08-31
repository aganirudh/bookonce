import { weatherService as backendWeatherService } from '@/services/WeatherService';

export interface WeatherData { temp: number; feelsLike: number; tempMin: number; tempMax: number; pressure: number; humidity: number; condition: string; description: string; icon: string; iconUrl: string; windSpeed: number; windDeg: number; clouds: number; visibility: number; sunrise: Date; sunset: Date; timezone: number; cityName: string; country: string }
const conditionForCode = (code: number) => code >= 51 ? 'Rain' : code >= 45 ? 'Fog' : code >= 2 ? 'Clouds' : 'Clear';

class LegacyWeatherCompatibilityService {
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    const date = new Date().toISOString().slice(0, 10);
    const forecast = await backendWeatherService.getForecast(lat, lng, date);
    const hour = forecast.hourly[0];
    if (!hour) throw new Error('Weather unavailable');
    const condition = conditionForCode(hour.weatherCode);
    return { temp: hour.temperatureC, feelsLike: hour.apparentTemperatureC, tempMin: hour.temperatureC, tempMax: hour.temperatureC, pressure: 0, humidity: 0, condition, description: condition.toLowerCase(), icon: '', iconUrl: '', windSpeed: hour.windSpeedKph, windDeg: 0, clouds: 0, visibility: 0, sunrise: new Date(0), sunset: new Date(0), timezone: 0, cityName: `${lat.toFixed(2)}, ${lng.toFixed(2)}`, country: '' };
  }
  async getForecast(lat: number, lng: number) { const date = new Date().toISOString().slice(0, 10); return backendWeatherService.getForecast(lat, lng, date); }
  getWeatherRecommendations(weather: WeatherData) {
    const warnings: string[] = []; const suggestions: string[] = []; let message = '';
    if (weather.temp > 35) { warnings.push('Very hot weather'); suggestions.push('Carry water'); }
    if (weather.condition === 'Rain') { warnings.push('Rainy weather expected'); suggestions.push('Carry an umbrella'); }
    if (weather.condition === 'Clear') { message = 'Clear weather, great for sightseeing'; suggestions.push('Plan outdoor activities'); }
    return { suitable: weather.condition !== 'Thunderstorm', message, suggestions, warnings };
  }
  getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x') { return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`; }
  formatTemperature(temp: number, unit: 'C' | 'F' = 'C') { return `${Math.round(unit === 'F' ? temp * 9 / 5 + 32 : temp)}°${unit}`; }
  getTimeBasedRecommendation(weather: WeatherData, hour: number) {
    if (weather.condition === 'Clear') return hour >= 6 && hour < 18 ? 'Clear day - great for sightseeing' : 'Clear night - great for evening walks';
    if (weather.condition === 'Rain') return hour >= 6 && hour < 18 ? 'Rainy day - consider indoor attractions' : 'Rainy evening - carry an umbrella';
    return 'Check current conditions before heading out';
  }
}
export const weatherService = new LegacyWeatherCompatibilityService();
export default weatherService;
