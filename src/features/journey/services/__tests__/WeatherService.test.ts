import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherService } from '../WeatherService';

describe('WeatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should be properly instantiated', () => {
      expect(weatherService).toBeDefined();
      expect(typeof weatherService.getCurrentWeather).toBe('function');
      expect(typeof weatherService.getForecast).toBe('function');
      expect(typeof weatherService.getWeatherRecommendations).toBe('function');
      expect(typeof weatherService.getWeatherIconUrl).toBe('function');
      expect(typeof weatherService.formatTemperature).toBe('function');
      expect(typeof weatherService.getTimeBasedRecommendation).toBe('function');
    });
  });

  describe('getWeatherIconUrl', () => {
    it('should generate correct icon URL', () => {
      const url = weatherService.getWeatherIconUrl('01d');
      expect(url).toBe('https://openweathermap.org/img/wn/01d@2x.png');
    });

    it('should support different sizes', () => {
      const url2x = weatherService.getWeatherIconUrl('01d', '2x');
      const url4x = weatherService.getWeatherIconUrl('01d', '4x');

      expect(url2x).toBe('https://openweathermap.org/img/wn/01d@2x.png');
      expect(url4x).toBe('https://openweathermap.org/img/wn/01d@4x.png');
    });
  });

  describe('formatTemperature', () => {
    it('should format temperature in Celsius', () => {
      expect(weatherService.formatTemperature(25)).toBe('25°C');
      expect(weatherService.formatTemperature(0)).toBe('0°C');
      expect(weatherService.formatTemperature(-5)).toBe('-5°C');
    });

    it('should format temperature in Fahrenheit', () => {
      expect(weatherService.formatTemperature(25, 'F')).toBe('77°F');
      expect(weatherService.formatTemperature(0, 'F')).toBe('32°F');
    });

    it('should round to nearest integer', () => {
      expect(weatherService.formatTemperature(25.7)).toBe('26°C');
      expect(weatherService.formatTemperature(25.3)).toBe('25°C');
    });
  });

  describe('getWeatherRecommendations', () => {
    it('should recommend for perfect weather', () => {
      const weather = {
        temp: 25,
        feelsLike: 26,
        tempMin: 23,
        tempMax: 27,
        pressure: 1013,
        humidity: 60,
        condition: 'Clear',
        description: 'clear sky',
        icon: '01d',
        iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
        windSpeed: 3,
        windDeg: 180,
        clouds: 0,
        visibility: 10000,
        sunrise: new Date(),
        sunset: new Date(),
        timezone: 19800,
        cityName: 'Mumbai',
        country: 'IN',
      };

      const recommendations = weatherService.getWeatherRecommendations(weather);

      expect(recommendations.suitable).toBe(true);
      expect(recommendations.message).toContain('great for sightseeing');
      expect(recommendations.suggestions.length).toBeGreaterThan(0);
    });

    it('should warn about hot weather', () => {
      const weather = {
        temp: 38,
        feelsLike: 40,
        tempMin: 36,
        tempMax: 40,
        pressure: 1010,
        humidity: 70,
        condition: 'Clear',
        description: 'clear sky',
        icon: '01d',
        iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
        windSpeed: 2,
        windDeg: 180,
        clouds: 0,
        visibility: 10000,
        sunrise: new Date(),
        sunset: new Date(),
        timezone: 19800,
        cityName: 'Mumbai',
        country: 'IN',
      };

      const recommendations = weatherService.getWeatherRecommendations(weather);

      expect(recommendations.warnings.length).toBeGreaterThan(0);
      expect(recommendations.warnings.some(w => w.includes('hot'))).toBe(true);
      expect(recommendations.suggestions.some(s => s.includes('water'))).toBe(true);
    });

    it('should warn about rainy weather', () => {
      const weather = {
        temp: 22,
        feelsLike: 22,
        tempMin: 20,
        tempMax: 24,
        pressure: 1008,
        humidity: 85,
        condition: 'Rain',
        description: 'moderate rain',
        icon: '10d',
        iconUrl: 'https://openweathermap.org/img/wn/10d@2x.png',
        windSpeed: 5,
        windDeg: 180,
        clouds: 90,
        visibility: 8000,
        sunrise: new Date(),
        sunset: new Date(),
        timezone: 19800,
        cityName: 'Mumbai',
        country: 'IN',
      };

      const recommendations = weatherService.getWeatherRecommendations(weather);

      expect(recommendations.warnings.some(w => w.includes('Rain'))).toBe(true);
      expect(recommendations.suggestions.some(s => s.includes('umbrella'))).toBe(true);
    });

    it('should mark thunderstorm as unsuitable', () => {
      const weather = {
        temp: 20,
        feelsLike: 20,
        tempMin: 18,
        tempMax: 22,
        pressure: 1005,
        humidity: 90,
        condition: 'Thunderstorm',
        description: 'thunderstorm with rain',
        icon: '11d',
        iconUrl: 'https://openweathermap.org/img/wn/11d@2x.png',
        windSpeed: 8,
        windDeg: 180,
        clouds: 100,
        visibility: 5000,
        sunrise: new Date(),
        sunset: new Date(),
        timezone: 19800,
        cityName: 'Mumbai',
        country: 'IN',
      };

      const recommendations = weatherService.getWeatherRecommendations(weather);

      expect(recommendations.suitable).toBe(false);
    });
  });

  describe('getTimeBasedRecommendation', () => {
    const weather = {
      temp: 25,
      feelsLike: 26,
      tempMin: 23,
      tempMax: 27,
      pressure: 1013,
      humidity: 60,
      condition: 'Clear',
      description: 'clear sky',
      icon: '01d',
      iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
      windSpeed: 3,
      windDeg: 180,
      clouds: 0,
      visibility: 10000,
      sunrise: new Date(),
      sunset: new Date(),
      timezone: 19800,
      cityName: 'Mumbai',
      country: 'IN',
    };

    it('should provide daytime recommendations', () => {
      const recommendation = weatherService.getTimeBasedRecommendation(weather, 12);
      expect(recommendation).toContain('day');
    });

    it('should provide nighttime recommendations', () => {
      const recommendation = weatherService.getTimeBasedRecommendation(weather, 20);
      expect(recommendation).toContain('night');
    });
  });

  describe('API Key Configuration', () => {
    it('should throw error when API key is not configured', async () => {
      // Mock environment to have no API key
      const originalKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      import.meta.env.VITE_OPENWEATHER_API_KEY = '';

      await expect(weatherService.getCurrentWeather(19.076, 72.8777)).rejects.toThrow();

      // Restore key
      import.meta.env.VITE_OPENWEATHER_API_KEY = originalKey;
    });
  });
});
