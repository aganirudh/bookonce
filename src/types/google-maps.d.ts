/**
 * Google Maps JavaScript API Type Definitions
 * Minimal type definitions for the features we use
 */

declare global {
  interface Window {
    google?: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class DirectionsService {
      route(
        request: DirectionsRequest,
        callback: (result: DirectionsResult | null, status: DirectionsStatus) => void
      ): void;
    }

    class DistanceMatrixService {
      getDistanceMatrix(
        request: DistanceMatrixRequest,
        callback: (result: DistanceMatrixResponse | null, status: DistanceMatrixStatus) => void
      ): void;
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void;
    }

    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, options?: AutocompleteOptions);
        addListener(event: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }

      interface PlaceResult {
        place_id?: string;
        formatted_address?: string;
        name?: string;
        geometry?: {
          location: LatLng;
        };
        address_components?: AddressComponent[];
      }

      interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
        componentRestrictions?: { country: string | string[] };
      }
    }

    interface DirectionsRequest {
      origin: LatLng | string;
      destination: LatLng | string;
      travelMode: TravelMode;
      transitOptions?: TransitOptions;
      provideRouteAlternatives?: boolean;
    }

    interface TransitOptions {
      modes?: TransitMode[];
      routingPreference?: TransitRoutePreference;
      departureTime?: Date;
      arrivalTime?: Date;
    }

    interface DirectionsResult {
      routes: DirectionsRoute[];
    }

    interface DirectionsRoute {
      legs: DirectionsLeg[];
      summary: string;
    }

    interface DirectionsLeg {
      steps: DirectionsStep[];
      duration?: { value: number; text: string };
      distance?: { value: number; text: string };
      start_location: LatLng;
      end_location: LatLng;
      start_address: string;
      end_address: string;
    }

    interface DirectionsStep {
      travel_mode: string;
      instructions: string;
      duration?: { value: number; text: string };
      distance?: { value: number; text: string };
      transit?: TransitDetails;
    }

    interface TransitDetails {
      line: {
        name: string;
        short_name: string;
        vehicle: {
          type: string;
          name: string;
          icon: string;
        };
      };
      departure_stop: {
        name: string;
        location: LatLng;
      };
      arrival_stop: {
        name: string;
        location: LatLng;
      };
      departure_time: { value: number };
      arrival_time: { value: number };
      num_stops: number;
    }

    interface DistanceMatrixRequest {
      origins: (LatLng | string)[];
      destinations: (LatLng | string)[];
      travelMode: TravelMode;
    }

    interface DistanceMatrixResponse {
      rows: DistanceMatrixRow[];
    }

    interface DistanceMatrixRow {
      elements: DistanceMatrixElement[];
    }

    interface DistanceMatrixElement {
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
      status: string;
    }

    interface GeocoderRequest {
      address?: string;
      location?: LatLng;
    }

    interface GeocoderResult {
      formatted_address: string;
      geometry: {
        location: LatLng;
      };
      place_id: string;
      address_components: AddressComponent[];
    }

    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    enum TravelMode {
      DRIVING = 'DRIVING',
      WALKING = 'WALKING',
      BICYCLING = 'BICYCLING',
      TRANSIT = 'TRANSIT',
    }

    enum TransitMode {
      BUS = 'BUS',
      RAIL = 'RAIL',
      SUBWAY = 'SUBWAY',
      TRAIN = 'TRAIN',
      TRAM = 'TRAM',
    }

    enum TransitRoutePreference {
      FEWER_TRANSFERS = 'FEWER_TRANSFERS',
      LESS_WALKING = 'LESS_WALKING',
    }

    enum DirectionsStatus {
      OK = 'OK',
      NOT_FOUND = 'NOT_FOUND',
      ZERO_RESULTS = 'ZERO_RESULTS',
      MAX_WAYPOINTS_EXCEEDED = 'MAX_WAYPOINTS_EXCEEDED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    }

    enum DistanceMatrixStatus {
      OK = 'OK',
      INVALID_REQUEST = 'INVALID_REQUEST',
      MAX_ELEMENTS_EXCEEDED = 'MAX_ELEMENTS_EXCEEDED',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    }

    enum GeocoderStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    }
  }
}

export {};
