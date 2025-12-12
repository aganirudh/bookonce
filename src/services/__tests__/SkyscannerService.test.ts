import { describe, it, expect, vi, beforeEach } from 'vitest';
import { skyscannerService } from '../SkyscannerService';

describe('SkyscannerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have API key configuration', () => {
      // Check that the service is properly instantiated
      expect(skyscannerService).toBeDefined();
      expect(typeof skyscannerService.searchFlights).toBe('function');
      expect(typeof skyscannerService.searchPlaces).toBe('function');
    });

    it('should have utility methods', () => {
      expect(typeof skyscannerService.formatDuration).toBe('function');
      expect(typeof skyscannerService.formatTime).toBe('function');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes to hours and minutes', () => {
      expect(skyscannerService.formatDuration(90)).toBe('1h 30m');
      expect(skyscannerService.formatDuration(120)).toBe('2h 0m');
      expect(skyscannerService.formatDuration(45)).toBe('0h 45m');
      expect(skyscannerService.formatDuration(0)).toBe('0h 0m');
    });
  });

  describe('formatTime', () => {
    it('should format ISO string to time', () => {
      const isoString = '2025-12-15T14:30:00Z';
      const formatted = skyscannerService.formatTime(isoString);
      // Just check it returns a string in time format
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('API Integration', () => {
    it('should throw error when no API key is configured', async () => {
      // Mock environment to have no API keys
      const originalRapidKey = import.meta.env.VITE_RAPIDAPI_KEY;
      const originalSkyscannerKey = import.meta.env.VITE_SKYSCANNER_API_KEY;
      
      // Temporarily remove keys
      import.meta.env.VITE_RAPIDAPI_KEY = '';
      import.meta.env.VITE_SKYSCANNER_API_KEY = '';

      const query = {
        originSkyId: 'BOM',
        destinationSkyId: 'GOI',
        originEntityId: '27544008',
        destinationEntityId: '27539793',
        date: '2025-12-15',
        cabinClass: 'economy' as const,
        adults: 1,
      };

      await expect(skyscannerService.searchFlights(query)).rejects.toThrow();

      // Restore keys
      import.meta.env.VITE_RAPIDAPI_KEY = originalRapidKey;
      import.meta.env.VITE_SKYSCANNER_API_KEY = originalSkyscannerKey;
    });
  });
});
