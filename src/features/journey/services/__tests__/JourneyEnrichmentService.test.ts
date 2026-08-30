import { beforeEach, describe, expect, it, vi } from 'vitest';
import { geocodingService } from '@/services/GeocodingService';
import { routingService } from '@/services/RoutingService';
import { journeyEnrichmentService } from '../JourneyEnrichmentService';

vi.mock('@/services/GeocodingService', () => ({ geocodingService: { searchLocation: vi.fn() } }));
vi.mock('@/services/RoutingService', () => ({ routingService: { getRoute: vi.fn() } }));

const locations: Record<string, { lat: number; lng: number }> = {
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
};

const baseItinerary = {
  origin: { name: 'Bengaluru', latitude: 1, longitude: 2 },
  destination: { name: 'Mysuru', latitude: 3, longitude: 4 },
  segments: [{
    mode: 'walk' as const,
    from: { name: 'Bengaluru', latitude: 1, longitude: 2 },
    to: { name: 'Mysuru', latitude: 3, longitude: 4 },
    duration: 200,
    distance: 150,
  }],
  summary: 'A proposed journey.',
};

describe('JourneyEnrichmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geocodingService.searchLocation).mockImplementation(async name => {
      const point = locations[name];
      return point ? [{ ...point, displayName: name, address: {}, type: 'city' }] : [];
    });
    vi.mocked(routingService.getRoute).mockResolvedValue({
      segments: [{ mode: 'walk', distance: 145000, duration: 10800, steps: [], geometry: [[77.5946, 12.9716], [76.6394, 12.2958]] }],
      totalDistance: 145000,
      totalDuration: 10800,
      summary: '145 km',
    });
  });

  it('geocodes endpoints once and replaces untrusted AI coordinates', async () => {
    const result = await journeyEnrichmentService.enrich(baseItinerary);
    expect(geocodingService.searchLocation).toHaveBeenCalledTimes(2);
    expect(result.origin).toEqual({ name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 });
    expect(result.destination).toEqual({ name: 'Mysuru', latitude: 12.2958, longitude: 76.6394 });
    expect(result.segments[0].from.latitude).toBe(12.9716);
  });

  it('routes walking segments and stores authoritative distance, duration, and geometry', async () => {
    const result = await journeyEnrichmentService.enrich(baseItinerary);
    expect(routingService.getRoute).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'walk');
    expect(result.segments[0]).toMatchObject({
      routeDistance: 145000,
      routeDuration: 10800,
      routeGeometry: [[77.5946, 12.9716], [76.6394, 12.2958]],
      routingStatus: 'routed',
    });
  });

  it.each(['car', 'taxi', 'auto', 'rapido'] as const)('maps %s to driving without changing the AI mode', async mode => {
    const result = await journeyEnrichmentService.enrich({ ...baseItinerary, segments: [{ ...baseItinerary.segments[0], mode }] });
    expect(routingService.getRoute).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'drive');
    expect(result.segments[0].mode).toBe(mode);
  });

  it('does not fake road routing for unsupported train segments', async () => {
    const result = await journeyEnrichmentService.enrich({ ...baseItinerary, segments: [{ ...baseItinerary.segments[0], mode: 'train' }] });
    expect(routingService.getRoute).not.toHaveBeenCalled();
    expect(result.segments[0]).toMatchObject({ routingStatus: 'unsupported', duration: 200, distance: 150 });
    expect(result.segments[0].routeGeometry).toBeUndefined();
  });

  it('removes unverified AI coordinates when geocoding fails', async () => {
    vi.mocked(geocodingService.searchLocation).mockRejectedValue(new Error('offline'));
    const result = await journeyEnrichmentService.enrich(baseItinerary);
    expect(result.origin).toEqual({ name: 'Bengaluru' });
    expect(result.segments[0].routingStatus).toBe('unavailable');
    expect(routingService.getRoute).not.toHaveBeenCalled();
  });

  it('keeps the itinerary and AI estimates when routing fails', async () => {
    vi.mocked(routingService.getRoute).mockRejectedValue(new Error('routing offline'));
    const result = await journeyEnrichmentService.enrich(baseItinerary);
    expect(result.summary).toBe(baseItinerary.summary);
    expect(result.segments[0]).toMatchObject({ routingStatus: 'unavailable', duration: 200, distance: 150 });
    expect(result.segments[0].routeDistance).toBeUndefined();
  });
});
