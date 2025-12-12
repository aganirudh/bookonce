/**
 * Weather Service
 * 
 * Uses Open-Meteo API - completely FREE, no API key required!
 * Unlimited requests, no rate limits
 */

import { cacheStore } from '../utils/cache';

export interface WeatherData {
  temp: number; // Celsius
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  pressure: number; // hPa
  humidity: number; // percentage
  condition: string; // e.g., "Clear", "Clouds", "Rain"
  description: string; // e.g., "clear sky", "few clouds"
  icon: string; // icon code (e.g., "01d")
  iconUrl: string; // full URL to icon
  windSpeed: number; // m/s
  windDeg: number; // degrees
  clouds: number; // percentage
  visibility: number; // meters
  sunrise: Date;
  sunset: Date;
  timezone: number; // seconds from UTC
  cityName: string;
  country: string;
}

export interface ForecastData {
  list: Array<{
    dt: Date;
    temp: number;
    feelsLike: number;
    tempMin: number;
    tempMax: number;
    condition: string;
    description: string;
    icon: string;
    iconUrl: string;
    pop: number; // Probability of precipitation (0-1)
    rain?: number; // Rain volume (mm)
    snow?: number; // Snow volume (mm)
  }>;
  city: {
    name: string;
    country: string;
    timezone: number;
    sunrise: Date;
    sunset: Date;
  };
}

export interface WeatherRecommendation {
  suitable: boolean;
  message: string;
  suggestions: string[];
  warnings: string[];
}

class WeatherService {
  // Open-Meteo API - completely free, no API key needed!
  private readonly BASE_URL = 'https://api.open-meteo.com/v1';
  
  // Cache duration: 30 minutes (weather doesn't change that fast)
  private readonly CACHE_DURATION = 30 * 60 * 1000;

  // Retry configuration
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    const cacheKey = `weather_current_${lat}_${lng}`;
    
    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as WeatherData;
    }

    try {
      // Open-Meteo API - no key required!
      const url = `${this.BASE_URL}/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&timezone=auto`;
      
      const data = await this.fetchWithRetry(url);

      const weather = this.parseCurrentWeather(data, lat, lng);

      // Cache result
      cacheStore.set(cacheKey, weather, this.CACHE_DURATION);

      return weather;
    } catch (error) {
      console.error('Open-Meteo API error:', error);
      throw this.handleError(error, 'Failed to fetch current weather');
    }
  }

  /**
   * Get 7-day weather forecast
   */
  async getForecast(lat: number, lng: number): Promise<ForecastData> {
    const cacheKey = `weather_forecast_${lat}_${lng}`;
    
    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as ForecastData;
    }

    try {
      // Open-Meteo API - no key required!
      const url = `${this.BASE_URL}/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,weather_code,precipitation_probability_max&timezone=auto&forecast_days=7`;
      
      const data = await this.fetchWithRetry(url);

      const forecast = this.parseForecast(data);

      // Cache result
      cacheStore.set(cacheKey, forecast, this.CACHE_DURATION);

      return forecast;
    } catch (error) {
      console.error('Open-Meteo Forecast API error:', error);
      throw this.handleError(error, 'Failed to fetch weather forecast');
    }
  }

  /**
   * Get weather-based travel recommendations
   */
  getWeatherRecommendations(weather: WeatherData): WeatherRecommendation {
    const recommendations: WeatherRecommendation = {
      suitable: true,
      message: '',
      suggestions: [],
      warnings: [],
    };

    // Temperature checks
    if (weather.temp > 35) {
      recommendations.warnings.push('Very hot weather - stay hydrated');
      recommendations.suggestions.push('Visit indoor attractions during peak heat (12 PM - 4 PM)');
      recommendations.suggestions.push('Carry water bottle and sunscreen');
    } else if (weather.temp < 10) {
      recommendations.warnings.push('Cold weather - dress warmly');
      recommendations.suggestions.push('Carry warm clothing and layers');
    } else if (weather.temp >= 20 && weather.temp <= 30) {
      recommendations.message = 'Perfect weather for outdoor activities!';
    }

    // Weather condition checks
    switch (weather.condition.toLowerCase()) {
      case 'rain':
      case 'drizzle':
      case 'thunderstorm':
        recommendations.warnings.push('Rainy weather expected');
        recommendations.suggestions.push('Carry umbrella or raincoat');
        recommendations.suggestions.push('Consider indoor activities');
        recommendations.suitable = weather.condition.toLowerCase() !== 'thunderstorm';
        break;
      
      case 'snow':
        recommendations.warnings.push('Snowy conditions - travel may be affected');
        recommendations.suggestions.push('Wear warm, waterproof clothing');
        recommendations.suggestions.push('Check road conditions before traveling');
        break;
      
      case 'clear':
        recommendations.message = 'Clear skies - great for sightseeing!';
        recommendations.suggestions.push('Perfect for outdoor activities and photography');
        break;
      
      case 'clouds':
        recommendations.message = 'Cloudy but comfortable weather';
        recommendations.suggestions.push('Good for walking tours and outdoor exploration');
        break;
      
      case 'mist':
      case 'fog':
      case 'haze':
        recommendations.warnings.push('Reduced visibility due to ' + weather.condition.toLowerCase());
        recommendations.suggestions.push('Drive carefully if traveling by road');
        break;
    }

    // Humidity checks
    if (weather.humidity > 80) {
      recommendations.suggestions.push('High humidity - stay in air-conditioned spaces when possible');
    }

    // Wind checks
    if (weather.windSpeed > 10) {
      recommendations.warnings.push('Strong winds expected');
      recommendations.suggestions.push('Secure loose items and be cautious outdoors');
    }

    // Visibility checks
    if (weather.visibility < 1000) {
      recommendations.warnings.push('Poor visibility - travel with caution');
      recommendations.suitable = false;
    }

    return recommendations;
  }

  /**
   * Get weather icon URL
   */
  getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
  }

  /**
   * Format temperature
   */
  formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
    if (unit === 'F') {
      temp = (temp * 9) / 5 + 32;
    }
    return `${Math.round(temp)}°${unit}`;
  }

  /**
   * Get weather description for time of day
   */
  getTimeBasedRecommendation(weather: WeatherData, hour: number): string {
    const isDay = hour >= 6 && hour < 18;
    
    if (weather.condition.toLowerCase() === 'clear') {
      if (isDay) {
        if (weather.temp > 30) {
          return 'Hot and sunny - seek shade during midday';
        }
        return 'Beautiful sunny day - perfect for outdoor activities';
      }
      return 'Clear night - great for evening walks';
    }
    
    if (weather.condition.toLowerCase() === 'rain') {
      return isDay ? 'Rainy day - consider indoor attractions' : 'Rainy evening - stay indoors or carry umbrella';
    }
    
    if (weather.condition.toLowerCase() === 'clouds') {
      return isDay ? 'Cloudy day - comfortable for sightseeing' : 'Cloudy evening - good for city exploration';
    }
    
    return 'Check current conditions before heading out';
  }

  /**
   * Parse current weather API response from Open-Meteo
   */
  private parseCurrentWeather(data: any, lat: number, lng: number): WeatherData {
    const current = data.current;
    const weatherCode = current.weather_code;
    const { condition, description, icon } = this.getWeatherFromCode(weatherCode);
    
    return {
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      tempMin: current.temperature_2m - 2, // Estimate
      tempMax: current.temperature_2m + 2, // Estimate
      pressure: current.pressure_msl,
      humidity: current.relative_humidity_2m,
      condition,
      description,
      icon,
      iconUrl: this.getWeatherIconUrl(icon),
      windSpeed: current.wind_speed_10m,
      windDeg: current.wind_direction_10m,
      clouds: current.cloud_cover,
      visibility: 10000, // Default 10km
      sunrise: new Date(), // Would need additional API call
      sunset: new Date(), // Would need additional API call
      timezone: 0,
      cityName: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      country: '',
    };
  }

  /**
   * Parse forecast API response from Open-Meteo
   */
  private parseForecast(data: any): ForecastData {
    const daily = data.daily;
    
    return {
      list: daily.time.map((time: string, index: number) => {
        const weatherCode = daily.weather_code[index];
        const { condition, description, icon } = this.getWeatherFromCode(weatherCode);
        
        return {
          dt: new Date(time),
          temp: (daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2,
          feelsLike: (daily.apparent_temperature_max[index] + daily.apparent_temperature_min[index]) / 2,
          tempMin: daily.temperature_2m_min[index],
          tempMax: daily.temperature_2m_max[index],
          condition,
          description,
          icon,
          iconUrl: this.getWeatherIconUrl(icon),
          pop: daily.precipitation_probability_max[index] / 100,
          rain: daily.precipitation_sum[index],
        };
      }),
      city: {
        name: data.timezone || 'Location',
        country: '',
        timezone: 0,
        sunrise: new Date(),
        sunset: new Date(),
      },
    };
  }

  /**
   * Convert WMO weather code to condition/description/icon
   * WMO Weather interpretation codes (WW)
   */
  private getWeatherFromCode(code: number): { condition: string; description: string; icon: string } {
    const codeMap: Record<number, { condition: string; description: string; icon: string }> = {
      0: { condition: 'Clear', description: 'clear sky', icon: '01d' },
      1: { condition: 'Clear', description: 'mainly clear', icon: '01d' },
      2: { condition: 'Clouds', description: 'partly cloudy', icon: '02d' },
      3: { condition: 'Clouds', description: 'overcast', icon: '03d' },
      45: { condition: 'Fog', description: 'fog', icon: '50d' },
      48: { condition: 'Fog', description: 'depositing rime fog', icon: '50d' },
      51: { condition: 'Drizzle', description: 'light drizzle', icon: '09d' },
      53: { condition: 'Drizzle', description: 'moderate drizzle', icon: '09d' },
      55: { condition: 'Drizzle', description: 'dense drizzle', icon: '09d' },
      61: { condition: 'Rain', description: 'slight rain', icon: '10d' },
      63: { condition: 'Rain', description: 'moderate rain', icon: '10d' },
      65: { condition: 'Rain', description: 'heavy rain', icon: '10d' },
      71: { condition: 'Snow', description: 'slight snow', icon: '13d' },
      73: { condition: 'Snow', description: 'moderate snow', icon: '13d' },
      75: { condition: 'Snow', description: 'heavy snow', icon: '13d' },
      77: { condition: 'Snow', description: 'snow grains', icon: '13d' },
      80: { condition: 'Rain', description: 'slight rain showers', icon: '09d' },
      81: { condition: 'Rain', description: 'moderate rain showers', icon: '09d' },
      82: { condition: 'Rain', description: 'violent rain showers', icon: '09d' },
      85: { condition: 'Snow', description: 'slight snow showers', icon: '13d' },
      86: { condition: 'Snow', description: 'heavy snow showers', icon: '13d' },
      95: { condition: 'Thunderstorm', description: 'thunderstorm', icon: '11d' },
      96: { condition: 'Thunderstorm', description: 'thunderstorm with slight hail', icon: '11d' },
      99: { condition: 'Thunderstorm', description: 'thunderstorm with heavy hail', icon: '11d' },
    };

    return codeMap[code] || { condition: 'Unknown', description: 'unknown', icon: '01d' };
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, retries = this.MAX_RETRIES): Promise<any> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          // Rate limit - retry after delay
          await this.delay(this.RETRY_DELAY);
          return this.fetchWithRetry(url, retries - 1);
        }

        if (response.status >= 500 && retries > 0) {
          // Server error - retry
          await this.delay(this.RETRY_DELAY);
          return this.fetchWithRetry(url, retries - 1);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (retries > 0) {
        await this.delay(this.RETRY_DELAY);
        return this.fetchWithRetry(url, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle API errors
   */
  private handleError(error: any, defaultMessage: string): Error {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    
    // Check for specific error types
    if (errorMessage.includes('401')) {
      return new Error('Invalid API key. Please check your OpenWeather API key configuration.');
    }
    
    if (errorMessage.includes('429')) {
      return new Error('API rate limit exceeded. Please try again later.');
    }
    
    if (errorMessage.includes('404')) {
      return new Error('Location not found. Please check your coordinates.');
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      return new Error('Weather service temporarily unavailable. Please try again later.');
    }
    
    return new Error(errorMessage);
  }
}

export const weatherService = new WeatherService();
export default weatherService;
