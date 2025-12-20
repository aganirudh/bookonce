import type { JourneyParams } from '@/components/HeroEnhanced';
import type { MultiModalRoute, RouteSegment, Location } from '@/types/journey';

/**
 * AI-Powered Journey Planner
 *
 * This service uses AI and internet search to plan complete door-to-door journeys.
 * For hackathon: Uses mock data with intelligent routing logic
 * For production: Connect to Google Maps API, flight APIs, OpenAI, etc.
 */

export class AIJourneyPlanner {
  /**
   * Plan a complete journey from source to destination
   */
  async planJourney(params: JourneyParams): Promise<{
    urgentRoute: MultiModalRoute;
    funRoute: MultiModalRoute;
    destination: Location;
    returnUrgentRoute?: MultiModalRoute;
    returnFunRoute?: MultiModalRoute;
  }> {
    // Simulate AI processing time
    await this.delay(1000);

    // Parse locations
    const sourceLocation = await this.parseLocation(params.source);
    const destLocation = await this.parseLocation(params.destination);

    // Calculate distance to determine transport type
    const distance = this.calculateDistance(sourceLocation, destLocation);

    // Generate outbound routes
    const urgentRoute = await this.generateRoute(
      sourceLocation,
      destLocation,
      'urgent',
      distance,
      params.departureDate
    );

    const funRoute = await this.generateRoute(
      sourceLocation,
      destLocation,
      'fun',
      distance,
      params.departureDate
    );

    // Generate return routes if return date is provided
    let returnUrgentRoute: MultiModalRoute | undefined;
    let returnFunRoute: MultiModalRoute | undefined;

    if (params.returnDate) {
      returnUrgentRoute = await this.generateRoute(
        destLocation,
        sourceLocation,
        'urgent',
        distance,
        params.returnDate
      );

      returnFunRoute = await this.generateRoute(
        destLocation,
        sourceLocation,
        'fun',
        distance,
        params.returnDate
      );
    }

    return {
      urgentRoute,
      funRoute,
      destination: destLocation,
      returnUrgentRoute,
      returnFunRoute,
    };
  }

  /**
   * Parse location string into Location object
   * In production: Use Google Places API
   */
  private async parseLocation(locationStr: string): Promise<Location> {
    // Mock location parsing
    const cityMatch = locationStr.match(
      /(Mumbai|Delhi|Bangalore|Goa|Jaipur|Kolkata|Chennai|Hyderabad)/i
    );
    const city = cityMatch ? cityMatch[0] : locationStr;

    // Mock coordinates (in production, use Geocoding API)
    const coordinates = this.getMockCoordinates(city);

    return {
      address: locationStr,
      city: city,
      country: 'India',
      coordinates,
      timezone: 'Asia/Kolkata',
    };
  }

  /**
   * Get mock coordinates for cities
   */
  private getMockCoordinates(city: string): { lat: number; lng: number } {
    const coords: Record<string, { lat: number; lng: number }> = {
      Mumbai: { lat: 19.076, lng: 72.8777 },
      Delhi: { lat: 28.7041, lng: 77.1025 },
      Bangalore: { lat: 12.9716, lng: 77.5946 },
      Goa: { lat: 15.2993, lng: 74.124 },
      Jaipur: { lat: 26.9124, lng: 75.7873 },
      Kolkata: { lat: 22.5726, lng: 88.3639 },
      Chennai: { lat: 13.0827, lng: 80.2707 },
      Hyderabad: { lat: 17.385, lng: 78.4867 },
    };

    return coords[city] || { lat: 20.5937, lng: 78.9629 }; // Default to India center
  }

  /**
   * Calculate distance between two locations (in km)
   */
  private calculateDistance(from: Location, to: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.coordinates.lat - from.coordinates.lat);
    const dLon = this.toRad(to.coordinates.lng - from.coordinates.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.coordinates.lat)) *
        Math.cos(this.toRad(to.coordinates.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate a complete multi-modal route
   */
  private async generateRoute(
    from: Location,
    to: Location,
    mode: 'urgent' | 'fun',
    distance: number,
    departureDate: string
  ): Promise<MultiModalRoute> {
    const segments: RouteSegment[] = [];
    let currentTime = new Date(departureDate + 'T07:00:00');
    let totalCost = 0;

    // Determine if inter-city or intra-city
    if (distance > 100) {
      // Inter-city journey: Need flight/train

      // 1. Local transport to airport/station
      const toAirport = this.generateLocalTransport(
        from,
        { ...from, address: `${from.city} Airport` },
        currentTime,
        mode
      );
      segments.push(toAirport);
      currentTime = toAirport.arrivalTime;
      totalCost += toAirport.cost;

      // 2. Flight or train
      const longDistance = this.generateLongDistanceTransport(
        from,
        to,
        currentTime,
        mode,
        distance
      );
      segments.push(longDistance);
      currentTime = longDistance.arrivalTime;
      totalCost += longDistance.cost;

      // 3. Local transport from airport to hotel
      const fromAirport = this.generateLocalTransport(
        { ...to, address: `${to.city} Airport` },
        to,
        currentTime,
        mode
      );
      segments.push(fromAirport);
      currentTime = fromAirport.arrivalTime;
      totalCost += fromAirport.cost;
    } else {
      // Intra-city: Only local transport
      const localRoute = this.generateLocalTransport(from, to, currentTime, mode);
      segments.push(localRoute);
      totalCost += localRoute.cost;
    }

    // Calculate total duration
    const totalDuration = Math.floor(
      (segments[segments.length - 1].arrivalTime.getTime() - segments[0].departureTime.getTime()) /
        60000
    );

    // Add highlights based on mode
    const highlights =
      mode === 'urgent'
        ? ['Fastest route', 'Direct connections', 'Premium options']
        : ['Scenic route', 'Budget-friendly', 'Local experiences', 'Comfortable journey'];

    return {
      id: `route-${mode}-${Date.now()}`,
      segments,
      totalDuration,
      totalCost,
      mode,
      highlights,
      carbonFootprint: this.calculateCarbonFootprint(segments),
    };
  }

  /**
   * Generate local transport segment
   */
  private generateLocalTransport(
    from: Location,
    to: Location,
    startTime: Date,
    mode: 'urgent' | 'fun'
  ): RouteSegment {
    const transportOptions =
      mode === 'urgent'
        ? [{ type: 'taxi' as const, duration: 30, cost: 300 }]
        : [
            { type: 'metro' as const, duration: 45, cost: 60 },
            { type: 'bus' as const, duration: 50, cost: 40 },
          ];

    const selected = transportOptions[Math.floor(Math.random() * transportOptions.length)];
    const arrivalTime = new Date(startTime.getTime() + selected.duration * 60000);

    return {
      id: `segment-${Date.now()}-${Math.random()}`,
      type: selected.type,
      from,
      to,
      departureTime: startTime,
      arrivalTime,
      duration: selected.duration,
      cost: selected.cost,
      provider:
        selected.type === 'taxi' ? 'Uber' : selected.type === 'metro' ? 'Metro Rail' : 'City Bus',
      bookingRequired: selected.type === 'taxi',
      instructions: `Take ${selected.type} from ${from.address} to ${to.address}`,
      distance: 15,
    };
  }

  /**
   * Generate long-distance transport (flight/train)
   */
  private generateLongDistanceTransport(
    from: Location,
    to: Location,
    startTime: Date,
    mode: 'urgent' | 'fun',
    distance: number
  ): RouteSegment {
    // Add 2 hours buffer for check-in
    const departureTime = new Date(startTime.getTime() + 120 * 60000);

    if (mode === 'urgent' || distance > 500) {
      // Flight
      const flightDuration = Math.max(60, Math.floor(distance / 10)); // ~600 km/h
      const arrivalTime = new Date(departureTime.getTime() + flightDuration * 60000);
      const cost = mode === 'urgent' ? 8500 : 5500;

      return {
        id: `segment-${Date.now()}-${Math.random()}`,
        type: 'flight',
        from: { ...from, address: `${from.city} Airport` },
        to: { ...to, address: `${to.city} Airport` },
        departureTime,
        arrivalTime,
        duration: flightDuration,
        cost,
        provider: mode === 'urgent' ? 'Air India Express' : 'IndiGo',
        bookingRequired: true,
        instructions: `Flight from ${from.city} to ${to.city}`,
        distance,
      };
    } else {
      // Train
      const trainDuration = Math.floor(distance / 60); // ~60 km/h
      const arrivalTime = new Date(departureTime.getTime() + trainDuration * 60000);
      const cost = 1200;

      return {
        id: `segment-${Date.now()}-${Math.random()}`,
        type: 'train',
        from: { ...from, address: `${from.city} Railway Station` },
        to: { ...to, address: `${to.city} Railway Station` },
        departureTime,
        arrivalTime,
        duration: trainDuration,
        cost,
        provider: 'Indian Railways',
        bookingRequired: true,
        instructions: `Train from ${from.city} to ${to.city}`,
        distance,
      };
    }
  }

  /**
   * Calculate carbon footprint
   */
  private calculateCarbonFootprint(segments: RouteSegment[]): number {
    let total = 0;
    segments.forEach(segment => {
      const distance = segment.distance || 0;
      switch (segment.type) {
        case 'flight':
          total += distance * 0.255; // kg CO2 per km
          break;
        case 'train':
          total += distance * 0.041;
          break;
        case 'bus':
          total += distance * 0.089;
          break;
        case 'metro':
          total += distance * 0.028;
          break;
        case 'taxi':
        case 'car':
          total += distance * 0.171;
          break;
        case 'walk':
          total += 0;
          break;
      }
    });
    return Math.round(total * 10) / 10;
  }

  /**
   * Utility: Delay for simulation
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const aiJourneyPlanner = new AIJourneyPlanner();
