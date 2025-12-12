import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleMapsService } from '../GoogleMapsService';

describe('GoogleMapsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should be properly instantiated', () => {
      expect(googleMapsService).toBeDefined();
      expect(typeof googleMapsService.loadGoogleMaps).toBe('function');
      expect(typeof googleMapsService.getDirections).toBe('function');
      expect(typeof googleMapsService.getDistanceMatrix).toBe('function');
      expect(typeof googleMapsService.geocodeAddress).toBe('function');
      expect(typeof googleMapsService.reverseGeocode).toBe('function');
      expect(typeof googleMapsService.calculateDistance).toBe('function');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two locations', () => {
      const origin = {
        address: 'Mumbai',
        city: 'Mumbai',
        country: 'India',
        coordinates: { lat: 19.0760, lng: 72.8777 },
      };

      const destination = {
        address: 'Goa',
        city: 'Goa',
        country: 'India',
        coordinates: { lat: 15.2993, lng: 74.1240 },
      };

      const distance = googleMapsService.calculateDistance(origin, destination);
      
      // Distance between Mumbai and Goa is approximately 440-460 km
      expect(distance).toBeGreaterThan(400000); // 400 km
      expect(distance).toBeLessThan(500000); // 500 km
    });

    it('should return 0 for same location', () => {
      const location = {
        address: 'Mumbai',
        city: 'Mumbai',
        country: 'India',
        coordinates: { lat: 19.0760, lng: 72.8777 },
      };

      const distance = googleMapsService.calculateDistance(location, location);
      expect(distance).toBe(0);
    });
  });

  describe('API Key Configuration', () => {
    it('should throw error when API key is not configured', async () => {
      // Mock environment to have no API key
      const originalKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY = '';

      await expect(googleMapsService.loadGoogleMaps()).rejects.toThrow();

      // Restore key
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY = originalKey;
    }, 10000); // Increase timeout to 10 seconds
  });
});
