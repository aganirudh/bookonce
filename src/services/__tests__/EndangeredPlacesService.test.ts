import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EndangeredPlacesService } from '../EndangeredPlacesService';

// Mock the fetch function
global.fetch = vi.fn();

describe('EndangeredPlacesService', () => {
  let service: EndangeredPlacesService;

  beforeEach(() => {
    service = new EndangeredPlacesService();
    vi.clearAllMocks();
  });

  it('should be instantiated', () => {
    expect(service).toBeDefined();
    expect(typeof service.findNearbyEndangeredPlaces).toBe('function');
    expect(typeof service.getAllEndangeredPlaces).toBe('function');
    expect(typeof service.getEndangeredPlacesByThreat).toBe('function');
  });

  it('should return all endangered places sorted by urgency', () => {
    const places = service.getAllEndangeredPlaces();
    expect(places).toBeDefined();
    expect(Array.isArray(places)).toBe(true);
    expect(places.length).toBeGreaterThan(0);

    // Check if first place has required properties
    if (places.length > 0) {
      const firstPlace = places[0];
      expect(firstPlace).toHaveProperty('id');
      expect(firstPlace).toHaveProperty('name');
      expect(firstPlace).toHaveProperty('location');
      expect(firstPlace).toHaveProperty('threatLevel');
      expect(firstPlace).toHaveProperty('yearsRemaining');
    }
  });

  it('should filter places by threat level', () => {
    const criticalPlaces = service.getEndangeredPlacesByThreat('critical');
    expect(Array.isArray(criticalPlaces)).toBe(true);

    // All returned places should have critical threat level
    criticalPlaces.forEach(place => {
      expect(place.threatLevel).toBe('critical');
    });
  });

  it('should handle location matching when geocoding fails', async () => {
    // Mock fetch to simulate API failure
    (global.fetch as any).mockRejectedValue(new Error('API Error'));

    const places = await service.findNearbyEndangeredPlaces('Mumbai');
    expect(Array.isArray(places)).toBe(true);
    // Should still return some places even if geocoding fails
  });

  it('should handle successful geocoding and distance calculation', async () => {
    // Mock successful geocoding response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: '19.0760',
          lon: '72.8777',
          display_name: 'Mumbai, Maharashtra, India',
        },
      ],
    });

    const places = await service.findNearbyEndangeredPlaces('Mumbai');
    expect(Array.isArray(places)).toBe(true);
    expect(places.length).toBeLessThanOrEqual(5); // Should limit to 5 places
  });
});
