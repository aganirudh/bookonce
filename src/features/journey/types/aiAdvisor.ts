/**
 * Type definitions for AI Journey Advisor
 */

// Journey Context
export interface JourneyContext {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  travelers: number;
  intent: 'urgent' | 'leisure';
  visitor: 'first-time' | 'returning';
  departureTime: string;
}

// Transportation Types
export interface RouteSegment {
  mode: 'walk' | 'metro' | 'bus' | 'train' | 'flight' | 'car';
  from: string;
  to: string;
  duration: number; // minutes
  distance: number; // meters
  departureTime?: string;
  arrivalTime?: string;
  line?: string;
  direction?: string;
  stops?: number;
  price?: number;
}

export interface LiveSchedule {
  mode: 'metro' | 'bus' | 'train';
  line: string;
  nextDepartures: string[];
  frequency: string;
  delays?: string;
  platform?: string;
}

export interface TrafficCondition {
  level: 'clear' | 'moderate' | 'heavy' | 'severe';
  affectedSegments: number[];
  description: string;
  alternativeRoute?: RouteSegment[];
  estimatedDelay?: number;
}

export interface TransitInfo {
  segments: RouteSegment[];
  liveSchedules: LiveSchedule[];
  trafficConditions: TrafficCondition;
  totalDuration: number;
  totalDistance: number;
  totalCost: number;
}

// Weather Types
export interface WeatherCondition {
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  icon: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  precipitation: number;
  icon: string;
}

export interface WeatherRecommendation {
  clothing: string[];
  gear: string[];
  activities: string[];
  warnings?: string[];
}

export interface WeatherInfo {
  current: WeatherCondition;
  hourly: HourlyForecast[];
  recommendations: WeatherRecommendation;
}

// Dining Types
export interface Restaurant {
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  distance: string;
  location: string;
  specialties: string[];
  groupFriendly: boolean;
  reservationRecommended: boolean;
}

export interface MealStop {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  location: string;
  restaurants: Restaurant[];
  suggestions: string[];
}

export interface LocalCuisine {
  name: string;
  description: string;
  recommendedDishes: string[];
  whereToTry: string[];
}

export interface DiningRecommendations {
  mealStops: MealStop[];
  localCuisine: LocalCuisine[];
  dietaryOptions: string[];
  budgetTips: string[];
}

// Accommodation Types
export interface Hotel {
  name: string;
  type: string;
  pricePerNight: number;
  rating: number;
  distance: string;
  amenities: string[];
  location: string;
  bookingUrl?: string;
}

export interface AccommodationInfo {
  recommendations: Hotel[];
  roomsNeeded: number;
  estimatedCost: {
    budget: number;
    standard: number;
    premium: number;
  };
  bookingTips: string[];
  checkInTime: string;
  checkOutTime: string;
}

// Activities Types
export interface Activity {
  name: string;
  description: string;
  duration: string;
  cost: string;
  category: string;
  weatherDependent: boolean;
  groupFriendly: boolean;
  rating: number;
  location: string;
  bestTime: string;
}

export interface ActivityRecommendations {
  mustSee: Activity[];
  hiddenGems: Activity[];
  weatherBased: Activity[];
  groupFriendly: Activity[];
  byCategory: {
    [category: string]: Activity[];
  };
}

// Safety Types
export interface EmergencyContact {
  service: string;
  number: string;
  description: string;
}

export interface SafetyInfo {
  tips: string[];
  emergencyContacts: EmergencyContact[];
  advisories: string[];
  safeAreas: string[];
  avoidAreas?: string[];
  healthTips: string[];
}

// Budget Types
export interface CostItem {
  category: string;
  amount: number;
  perPerson: boolean;
  description: string;
}

export interface Discount {
  type: string;
  amount: number;
  description: string;
}

export interface BudgetBreakdown {
  transportation: number;
  accommodation: number;
  meals: number;
  activities: number;
  miscellaneous: number;
  total: number;
  perPerson: number;
  discounts: Discount[];
  savingsTips: string[];
}

// Packing Types
export interface PackingItem {
  name: string;
  essential: boolean;
  weatherDependent: boolean;
  activityDependent: boolean;
  checked: boolean;
  category: string;
}

export interface PackingCategory {
  name: string;
  items: PackingItem[];
  icon: string;
}

export interface PackingList {
  categories: PackingCategory[];
  totalItems: number;
  checkedItems: number;
  weatherNotes: string[];
  activityNotes: string[];
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface QuickQuestion {
  question: string;
  category: string;
}

export interface ChatState {
  messages: ChatMessage[];
  quickQuestions: QuickQuestion[];
  isTyping: boolean;
}

// Complete AI Recommendations
export interface AIRecommendations {
  transportation: TransitInfo;
  weather: WeatherInfo;
  dining: DiningRecommendations;
  accommodation: AccommodationInfo;
  activities: ActivityRecommendations;
  safety: SafetyInfo;
  budget: BudgetBreakdown;
  packing: PackingList;
  lastUpdated: Date;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Loading States
export interface LoadingState {
  transportation: boolean;
  weather: boolean;
  dining: boolean;
  accommodation: boolean;
  activities: boolean;
  safety: boolean;
  budget: boolean;
  packing: boolean;
}
