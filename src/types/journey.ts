// Journey Planning Types

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

export type TransportMode = 'walk' | 'metro' | 'bus' | 'taxi' | 'flight' | 'train' | 'car';
export type TravelMode = 'urgent' | 'fun';
export type TripStatus = 'planned' | 'booked' | 'active' | 'completed' | 'cancelled';

export interface RouteSegment {
  id: string;
  type: TransportMode;
  from: Location;
  to: Location;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // minutes
  cost: number;
  provider?: string;
  bookingRequired: boolean;
  instructions?: string;
  distance?: number; // km
}

export interface MultiModalRoute {
  id: string;
  segments: RouteSegment[];
  totalDuration: number; // minutes
  totalCost: number;
  accommodation?: any; // Hotel type from existing system
  mode: TravelMode;
  highlights?: string[];
  carbonFootprint?: number; // kg CO2
}

export interface JourneyRequest {
  source: Location;
  destination: Location;
  departureDate: Date;
  returnDate?: Date;
  mode: TravelMode;
  passengers: number;
  preferences?: {
    budget?: 'low' | 'medium' | 'high';
    pace?: 'relaxed' | 'moderate' | 'fast';
    interests?: string[];
  };
  isRoundTrip?: boolean;
}

export interface Trip {
  id: string;
  userId: string;
  source: Location;
  destination: Location;
  departureDate: Date;
  returnDate?: Date;
  mode: TravelMode;
  route: MultiModalRoute;
  returnRoute?: MultiModalRoute;
  bookings: Booking[];
  status: TripStatus;
  safetyCheckIns: SafetyCheckIn[];
  expenses: Expense[];
  createdAt: Date;
  updatedAt: Date;
  isRoundTrip?: boolean;
}

export interface Booking {
  id: string;
  tripId: string;
  type: 'flight' | 'train' | 'hotel' | 'transport';
  provider: string;
  confirmationNumber: string;
  segment: RouteSegment;
  cost: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  cancellationPolicy?: string;
  bookingDetails: any;
  createdAt: Date;
}

export interface SafetyCheckIn {
  id: string;
  tripId: string;
  scheduledTime: Date;
  responseTime?: Date;
  status: 'pending' | 'responded' | 'missed' | 'emergency';
  location?: Location;
  notes?: string;
}

export interface Expense {
  id: string;
  tripId: string;
  category: 'transport' | 'food' | 'accommodation' | 'activities' | 'shopping' | 'other';
  amount: number;
  currency: string;
  description: string;
  date: Date;
  location?: Location;
  receipt?: string;
  isBooked: boolean;
}

export interface Recommendation {
  id: string;
  name: string;
  type: 'restaurant' | 'attraction' | 'activity' | 'shopping';
  location: Location;
  rating: number;
  priceLevel: number; // 1-4
  crowdLevel: number; // 1-5
  isLocalFavorite: boolean;
  description: string;
  openingHours?: string;
  estimatedDuration?: number; // minutes
  weatherDependent: boolean;
  images?: string[];
}
