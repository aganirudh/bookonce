/**
 * Google Maps Service
 *
 * Wrapper for Google Maps APIs with error handling, retry logic, and caching
 * Required APIs: Maps JavaScript API, Places API, Directions API, Distance Matrix API, Geocoding API
 */

import type { } from '../../../types/google-maps.d.ts';

import { cacheStore } from '../utils/cache';

// Declare google as any to avoid type errors with dynamically loaded script
declare const google: any;

export interface Location {
  address: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  timezone?: string;
}

export interface DirectionsRequest {
  origin: Location;
  destination: Location;
  mode: 'urgent' | 'fun';
  departureTime?: Date;
}

export interface DirectionsResult {
  routes: Route[];
  status: string;
}

export interface Route {
  legs: RouteLeg[];
  duration: number; // minutes
  distance: number; // meters
  summary: string;
}

export interface RouteLeg {
  steps: RouteStep[];
  duration: number;
  distance: number;
  startLocation: Location;
  endLocation: Location;
  startAddress: string;
  endAddress: string;
}

export interface RouteStep {
  travelMode: 'WALKING' | 'TRANSIT' | 'DRIVING';
  instructions: string;
  duration: number;
  distance: number;
  transitDetails?: TransitDetails;
}

export interface TransitDetails {
  line: {
    name: string;
    shortName: string;
    vehicle: {
      type: string;
      name: string;
      icon: string;
    };
  };
  departureStop: {
    name: string;
    location: { lat: number; lng: number };
  };
  arrivalStop: {
    name: string;
    location: { lat: number; lng: number };
  };
  departureTime: Date;
  arrivalTime: Date;
  numStops: number;
}

export interface DistanceMatrixRequest {
  origins: Location[];
  destinations: Location[];
  mode?: 'driving' | 'walking' | 'transit';
}

export interface DistanceMatrixResult {
  rows: Array<{
    elements: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      status: string;
    }>;
  }>;
}

export interface PlaceAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

class GoogleMapsService {
  private readonly API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  // Cache durations (in milliseconds)
  private readonly CACHE_DURATION = {
    directions: 15 * 60 * 1000, // 15 minutes
    distance: 30 * 60 * 1000, // 30 minutes
    geocoding: 60 * 60 * 1000, // 1 hour
    places: 60 * 60 * 1000, // 1 hour
  };

  /**
   * Load Google Maps JavaScript API
   */
  async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    if (!this.API_KEY) {
      throw new Error(
        'Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to .env'
      );
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (google?.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Get directions between two locations
   */
  async getDirections(request: DirectionsRequest): Promise<DirectionsResult> {
    await this.loadGoogleMaps();

    if (!google) {
      throw new Error('Google Maps not loaded');
    }

    const cacheKey = `directions_${request.origin.coordinates.lat}_${request.origin.coordinates.lng}_${request.destination.coordinates.lat}_${request.destination.coordinates.lng}_${request.mode}`;

    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as DirectionsResult;
    }

    try {
      const directionsService = new google.maps.DirectionsService();

      const directionsRequest: any = {
        origin: new google.maps.LatLng(
          request.origin.coordinates.lat,
          request.origin.coordinates.lng
        ),
        destination: new google.maps.LatLng(
          request.destination.coordinates.lat,
          request.destination.coordinates.lng
        ),
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
          modes: [
            google.maps.TransitMode.BUS,
            google.maps.TransitMode.RAIL,
            google.maps.TransitMode.SUBWAY,
            google.maps.TransitMode.TRAIN,
          ],
          routingPreference:
            request.mode === 'urgent'
              ? google.maps.TransitRoutePreference.FEWER_TRANSFERS
              : google.maps.TransitRoutePreference.LESS_WALKING,
        },
        provideRouteAlternatives: true,
      };

      if (request.departureTime) {
        directionsRequest.transitOptions!.departureTime = request.departureTime;
      }

      const result = await new Promise<any>((resolve, reject) => {
        directionsService.route(directionsRequest, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      const parsedResult = this.parseDirectionsResult(result);

      // Cache result
      cacheStore.set(cacheKey, parsedResult, this.CACHE_DURATION.directions);

      return parsedResult;
    } catch (error) {
      console.error('Google Maps Directions API error:', error);
      throw this.handleError(error, 'Failed to get directions');
    }
  }

  /**
   * Calculate distance matrix between multiple origins and destinations
   */
  async getDistanceMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrixResult> {
    await this.loadGoogleMaps();

    const cacheKey = `distance_${JSON.stringify(request)}`;

    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as DistanceMatrixResult;
    }

    try {
      const service = new google.maps.DistanceMatrixService();

      const origins = request.origins.map(
        loc => new google.maps.LatLng(loc.coordinates.lat, loc.coordinates.lng)
      );
      const destinations = request.destinations.map(
        loc => new google.maps.LatLng(loc.coordinates.lat, loc.coordinates.lng)
      );

      const result = await new Promise<any>((resolve, reject) => {
        service.getDistanceMatrix(
          {
            origins,
            destinations,
            travelMode: google.maps.TravelMode.TRANSIT,
          },
          (result, status) => {
            if (status === google.maps.DistanceMatrixStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Distance Matrix request failed: ${status}`));
            }
          }
        );
      });

      const parsedResult = this.parseDistanceMatrixResult(result);

      // Cache result
      cacheStore.set(cacheKey, parsedResult, this.CACHE_DURATION.distance);

      return parsedResult;
    } catch (error) {
      console.error('Google Maps Distance Matrix API error:', error);
      throw this.handleError(error, 'Failed to calculate distance');
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<Location> {
    await this.loadGoogleMaps();

    const cacheKey = `geocode_${address}`;

    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as Location;
    }

    try {
      const geocoder = new google.maps.Geocoder();

      const result = await new Promise<any[]>((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (result.length === 0) {
        throw new Error('No results found for address');
      }

      const location = this.parseGeocoderResult(result[0]);

      // Cache result
      cacheStore.set(cacheKey, location, this.CACHE_DURATION.geocoding);

      return location;
    } catch (error) {
      console.error('Google Maps Geocoding API error:', error);
      throw this.handleError(error, 'Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<Location> {
    await this.loadGoogleMaps();

    const cacheKey = `reverse_geocode_${lat}_${lng}`;

    // Check cache
    const cached = cacheStore.get(cacheKey);
    if (cached) {
      return cached as Location;
    }

    try {
      const geocoder = new google.maps.Geocoder();
      const latlng = new google.maps.LatLng(lat, lng);

      const result = await new Promise<any[]>((resolve, reject) => {
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        });
      });

      if (result.length === 0) {
        throw new Error('No results found for coordinates');
      }

      const location = this.parseGeocoderResult(result[0]);

      // Cache result
      cacheStore.set(cacheKey, location, this.CACHE_DURATION.geocoding);

      return location;
    } catch (error) {
      console.error('Google Maps Reverse Geocoding API error:', error);
      throw this.handleError(error, 'Failed to reverse geocode coordinates');
    }
  }

  /**
   * Calculate distance between two points (in meters)
   */
  calculateDistance(origin: Location, destination: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (origin.coordinates.lat * Math.PI) / 180;
    const φ2 = (destination.coordinates.lat * Math.PI) / 180;
    const Δφ = ((destination.coordinates.lat - origin.coordinates.lat) * Math.PI) / 180;
    const Δλ = ((destination.coordinates.lng - origin.coordinates.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Parse Google Directions API result
   */
  private parseDirectionsResult(result: any): DirectionsResult {
    return {
      routes: result.routes.map(route => ({
        legs: route.legs.map(leg => ({
          steps: leg.steps.map(step => ({
            travelMode: step.travel_mode as 'WALKING' | 'TRANSIT' | 'DRIVING',
            instructions: step.instructions,
            duration: step.duration?.value ? step.duration.value / 60 : 0, // Convert to minutes
            distance: step.distance?.value || 0,
            transitDetails: step.transit
              ? {
                line: {
                  name: step.transit.line.name || '',
                  shortName: step.transit.line.short_name || '',
                  vehicle: {
                    type: step.transit.line.vehicle.type || '',
                    name: step.transit.line.vehicle.name || '',
                    icon: step.transit.line.vehicle.icon || '',
                  },
                },
                departureStop: {
                  name: step.transit.departure_stop.name,
                  location: {
                    lat: step.transit.departure_stop.location.lat(),
                    lng: step.transit.departure_stop.location.lng(),
                  },
                },
                arrivalStop: {
                  name: step.transit.arrival_stop.name,
                  location: {
                    lat: step.transit.arrival_stop.location.lat(),
                    lng: step.transit.arrival_stop.location.lng(),
                  },
                },
                departureTime: new Date(step.transit.departure_time.value),
                arrivalTime: new Date(step.transit.arrival_time.value),
                numStops: step.transit.num_stops || 0,
              }
              : undefined,
          })),
          duration: leg.duration?.value ? leg.duration.value / 60 : 0,
          distance: leg.distance?.value || 0,
          startLocation: {
            address: leg.start_address,
            city: '',
            country: '',
            coordinates: {
              lat: leg.start_location.lat(),
              lng: leg.start_location.lng(),
            },
          },
          endLocation: {
            address: leg.end_address,
            city: '',
            country: '',
            coordinates: {
              lat: leg.end_location.lat(),
              lng: leg.end_location.lng(),
            },
          },
          startAddress: leg.start_address,
          endAddress: leg.end_address,
        })),
        duration: route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) / 60,
        distance: route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0),
        summary: route.summary,
      })),
      status: 'OK',
    };
  }

  /**
   * Parse Distance Matrix API result
   */
  private parseDistanceMatrixResult(result: any): DistanceMatrixResult {
    return {
      rows: result.rows.map(row => ({
        elements: row.elements.map(element => ({
          distance: {
            value: element.distance?.value || 0,
            text: element.distance?.text || '',
          },
          duration: {
            value: element.duration?.value || 0,
            text: element.duration?.text || '',
          },
          status: element.status,
        })),
      })),
    };
  }

  /**
   * Parse Geocoder result
   */
  private parseGeocoderResult(result: any): Location {
    const addressComponents = result.address_components;

    let city = '';
    let country = '';

    addressComponents.forEach(component => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
      }
    });

    return {
      address: result.formatted_address,
      city,
      country,
      coordinates: {
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
      },
      placeId: result.place_id,
    };
  }

  /**
   * Handle API errors with retry logic
   */
  private async handleError(error: any, defaultMessage: string): Promise<never> {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;

    // Check for specific error types
    if (errorMessage.includes('OVER_QUERY_LIMIT')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }

    if (errorMessage.includes('REQUEST_DENIED')) {
      throw new Error('API request denied. Please check your API key configuration.');
    }

    if (errorMessage.includes('INVALID_REQUEST')) {
      throw new Error('Invalid request. Please check your input parameters.');
    }

    throw new Error(errorMessage);
  }
}

export const googleMapsService = new GoogleMapsService();
export default googleMapsService;
