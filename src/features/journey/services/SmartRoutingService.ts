/**
 * Smart Routing Service
 *
 * Intelligently determines the best transportation mode based on:
 * - Distance between locations
 * - Available transport options
 * - Real-time data
 * - User preferences (urgent vs leisure)
 */

import { freeRoutingService } from './FreeRoutingService';
import { freeGeocodingService } from './FreeGeocodingService';

export interface SmartRouteRequest {
  from: string;
  to: string;
  intent: 'urgent' | 'leisure';
  departureTime?: Date;
}

export interface TransportSegment {
  mode: 'walk' | 'metro' | 'bus' | 'auto' | 'train' | 'flight';
  from: string;
  to: string;
  duration: number; // minutes
  distance: number; // meters
  cost: number; // INR
  details?: string;
  realTime?: boolean;
}

export interface SmartRouteResult {
  segments: TransportSegment[];
  totalDuration: number; // minutes
  totalDistance: number; // meters
  totalCost: number; // INR
  summary: string;
  routeType: 'local' | 'intercity' | 'long-distance';
}

class SmartRoutingService {
  // Distance thresholds (in meters)
  private readonly WALKING_DISTANCE = 2000; // 2 km
  private readonly LOCAL_DISTANCE = 50000; // 50 km (within city)
  private readonly INTERCITY_DISTANCE = 300000; // 300 km

  // Cost estimates (INR)
  private readonly COSTS = {
    walk: 0,
    metro: 60,
    bus: 40,
    auto: 15, // per km
    train: 200, // base
    flight: 5500, // base
  };

  /**
   * Calculate smart route based on distance and context
   */
  async calculateSmartRoute(request: SmartRouteRequest): Promise<SmartRouteResult> {
    try {
      // Geocode locations
      const originResults = await freeGeocodingService.search(request.from);
      const destResults = await freeGeocodingService.search(request.to);

      if (originResults.length === 0 || destResults.length === 0) {
        throw new Error('Could not find locations');
      }

      const origin = originResults[0];
      const dest = destResults[0];

      // Calculate straight-line distance
      const distance = this.calculateDistance(
        origin.coordinates.lat,
        origin.coordinates.lng,
        dest.coordinates.lat,
        dest.coordinates.lng
      );

      // Determine route type and generate appropriate segments
      if (distance <= this.LOCAL_DISTANCE) {
        return this.generateLocalRoute(request, origin, dest, distance);
      } else if (distance <= this.INTERCITY_DISTANCE) {
        return this.generateIntercityRoute(request, origin, dest, distance);
      } else {
        return this.generateLongDistanceRoute(request, origin, dest, distance);
      }
    } catch (error) {
      console.error('Smart routing error:', error);
      throw error;
    }
  }

  /**
   * Generate route for local travel (within city, < 50km)
   * Uses: Walk + Metro/Bus + Auto
   */
  private async generateLocalRoute(
    request: SmartRouteRequest,
    origin: any,
    dest: any,
    distance: number
  ): Promise<SmartRouteResult> {
    const segments: TransportSegment[] = [];

    // If very close, just walk
    if (distance <= this.WALKING_DISTANCE) {
      const walkDuration = Math.ceil((distance / 1000) * 12); // 12 min per km
      segments.push({
        mode: 'walk',
        from: request.from,
        to: request.to,
        duration: walkDuration,
        distance: distance,
        cost: 0,
        details: 'Direct walking route',
      });

      return {
        segments,
        totalDuration: walkDuration,
        totalDistance: distance,
        totalCost: 0,
        summary: `${(distance / 1000).toFixed(1)} km walk, ${walkDuration} min`,
        routeType: 'local',
      };
    }

    // For longer local distances, use public transport
    // 1. Walk to nearest metro/bus stop (assume 650m)
    segments.push({
      mode: 'walk',
      from: request.from,
      to: 'Nearest Metro/Bus Stop',
      duration: 8,
      distance: 650,
      cost: 0,
      details: 'Walk to public transport',
    });

    // 2. Metro or Bus (main segment)
    const transitDistance = distance - 1300; // Subtract walk distances
    const transitDuration = Math.ceil((transitDistance / 1000) * 2.5); // 2.5 min per km

    if (distance > 10000) {
      // Use metro for longer distances
      segments.push({
        mode: 'metro',
        from: 'Metro Station',
        to: 'Destination Metro Station',
        duration: transitDuration,
        distance: transitDistance,
        cost: this.COSTS.metro,
        details: 'Metro line - check real-time schedules',
        realTime: true,
      });
    } else {
      // Use bus for shorter distances
      segments.push({
        mode: 'bus',
        from: 'Bus Stop',
        to: 'Destination Bus Stop',
        duration: transitDuration,
        distance: transitDistance,
        cost: this.COSTS.bus,
        details: 'Local bus - check real-time schedules',
        realTime: true,
      });
    }

    // 3. Walk from stop to destination (assume 650m)
    segments.push({
      mode: 'walk',
      from: 'Metro/Bus Stop',
      to: request.to,
      duration: 8,
      distance: 650,
      cost: 0,
      details: 'Walk to destination',
    });

    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
    const totalCost = segments.reduce((sum, s) => sum + s.cost, 0);

    return {
      segments,
      totalDuration,
      totalDistance: distance,
      totalCost,
      summary: `${(distance / 1000).toFixed(1)} km via public transport, ${totalDuration} min, ₹${totalCost}`,
      routeType: 'local',
    };
  }

  /**
   * Generate route for intercity travel (50-300km)
   * Uses: Walk + Metro + Train + Auto
   */
  private async generateIntercityRoute(
    request: SmartRouteRequest,
    origin: any,
    dest: any,
    distance: number
  ): Promise<SmartRouteResult> {
    const segments: TransportSegment[] = [];

    // 1. Walk to metro
    segments.push({
      mode: 'walk',
      from: request.from,
      to: 'Metro Station',
      duration: 8,
      distance: 650,
      cost: 0,
    });

    // 2. Metro to railway station
    segments.push({
      mode: 'metro',
      from: 'Metro Station',
      to: 'Railway Station',
      duration: 25,
      distance: 18000,
      cost: this.COSTS.metro,
      details: 'Metro to railway station',
    });

    // 3. Train (main segment)
    const trainDistance = distance - 20000;
    const trainDuration = Math.ceil((trainDistance / 1000) * 0.8); // 0.8 min per km
    const trainCost = this.COSTS.train + Math.ceil((trainDistance / 1000) * 2);

    segments.push({
      mode: 'train',
      from: request.from,
      to: request.to,
      duration: trainDuration,
      distance: trainDistance,
      cost: trainCost,
      details: 'Express train - check IRCTC for real-time schedules',
      realTime: true,
    });

    // 4. Auto from destination station
    segments.push({
      mode: 'auto',
      from: 'Railway Station',
      to: request.to,
      duration: 15,
      distance: 5000,
      cost: this.COSTS.auto * 5,
      details: 'Auto-rickshaw to destination',
    });

    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
    const totalCost = segments.reduce((sum, s) => sum + s.cost, 0);

    return {
      segments,
      totalDuration,
      totalDistance: distance,
      totalCost,
      summary: `${(distance / 1000).toFixed(0)} km via train, ${Math.ceil(totalDuration / 60)}h ${totalDuration % 60}m, ₹${totalCost}`,
      routeType: 'intercity',
    };
  }

  /**
   * Generate route for long-distance travel (> 300km)
   * Uses: Walk + Metro + Flight + Bus
   */
  private async generateLongDistanceRoute(
    request: SmartRouteRequest,
    origin: any,
    dest: any,
    distance: number
  ): Promise<SmartRouteResult> {
    const segments: TransportSegment[] = [];

    // 1. Walk to metro
    segments.push({
      mode: 'walk',
      from: request.from,
      to: 'Metro Station',
      duration: 8,
      distance: 650,
      cost: 0,
    });

    // 2. Metro to airport
    segments.push({
      mode: 'metro',
      from: 'Metro Station',
      to: 'Airport Station',
      duration: 25,
      distance: 18000,
      cost: this.COSTS.metro,
      details: 'Metro to airport',
    });

    // 3. Flight (main segment)
    const flightDuration = Math.ceil((distance / 1000) * 0.12); // 0.12 min per km
    const flightCost = request.intent === 'urgent' ? 8500 : this.COSTS.flight;

    segments.push({
      mode: 'flight',
      from: request.from,
      to: request.to,
      duration: flightDuration,
      distance: distance,
      cost: flightCost,
      details: 'Flight - check airlines for real-time prices',
      realTime: true,
    });

    // 4. Bus from destination airport
    segments.push({
      mode: 'bus',
      from: 'Airport',
      to: request.to,
      duration: 35,
      distance: 22000,
      cost: this.COSTS.bus,
      details: 'Airport bus to city',
    });

    // 5. Walk to final destination
    segments.push({
      mode: 'walk',
      from: 'Bus Stop',
      to: request.to,
      duration: 5,
      distance: 400,
      cost: 0,
    });

    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
    const totalCost = segments.reduce((sum, s) => sum + s.cost, 0);

    return {
      segments,
      totalDuration,
      totalDistance: distance,
      totalCost,
      summary: `${(distance / 1000).toFixed(0)} km via flight, ${Math.ceil(totalDuration / 60)}h ${totalDuration % 60}m, ₹${totalCost}`,
      routeType: 'long-distance',
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get real-time transit suggestions
   * This would integrate with real transit APIs in production
   */
  getRealTimeTransitSuggestions(segment: TransportSegment): string[] {
    const suggestions: string[] = [];

    switch (segment.mode) {
      case 'metro':
        suggestions.push('Check Google Maps for real-time metro schedules');
        suggestions.push('Download local metro app for live updates');
        suggestions.push('Metro frequency: Every 5-10 minutes during peak hours');
        break;

      case 'bus':
        suggestions.push('Use Google Maps for real-time bus tracking');
        suggestions.push('Check local transport app for live bus locations');
        suggestions.push('Have exact change ready (₹40-60 typical fare)');
        break;

      case 'train':
        suggestions.push('Book tickets on IRCTC (https://www.irctc.co.in/)');
        suggestions.push('Check PNR status for real-time updates');
        suggestions.push('Arrive 30 minutes before departure');
        break;

      case 'flight':
        suggestions.push('Compare prices on Google Flights, Skyscanner, MakeMyTrip');
        suggestions.push('Book 2-3 weeks in advance for best prices');
        suggestions.push('Arrive 2 hours before domestic flights');
        break;

      case 'auto':
        suggestions.push('Use Uber/Ola for metered fares');
        suggestions.push('Negotiate fare before starting journey');
        suggestions.push('Typical rate: ₹15-20 per km');
        break;
    }

    return suggestions;
  }
}

export const smartRoutingService = new SmartRoutingService();
export default smartRoutingService;
