# Design Document - TravelEase: Complete Door-to-Door Travel Solution

## Overview

TravelEase transforms the existing Vagabond platform into a comprehensive door-to-door travel solution. The design integrates seamlessly with the current hotel booking system while adding multi-modal journey planning, dual-mode routing, Local Guardian hospitality features, and complete booking orchestration.

### Key Design Principles

1. **Progressive Enhancement**: Build on existing Vagabond features rather than replacing them
2. **Real API Integration**: Use actual external APIs (Google Maps, Skyscanner, OpenWeather) for live data - NO MOCK DATA
3. **API-First Architecture**: All data comes from real API calls with proper error handling and caching
4. **Modular Components**: Each feature (journey planner, chatbot, safety) is independent
5. **Mobile-First**: Optimized for travelers on-the-go
6. **Offline-Capable**: Critical features work without internet (with cached real data)

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Journey Planner  │  Booking Flow  │  Local Guardian  │ Maps│
├─────────────────────────────────────────────────────────────┤
│                   State Management (Zustand)                 │
├─────────────────────────────────────────────────────────────┤
│                    API Integration Layer                     │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ Google Maps  │  Flight APIs │  Hotel APIs  │  Weather API  │
│    API       │  (RapidAPI)  │  (Existing)  │  (OpenWeather)│
└──────────────┴──────────────┴──────────────┴───────────────┘
```

### Integration with Existing Vagabond Platform

**Existing Features to Leverage:**
- Hotel booking system (BookingAPIService, BookingModal)
- Authentication (AuthContext)
- Payment processing (PaymentAPIService)
- User profiles (UserProfile page)
- Booking history (BookingHistory page)

**New Features to Add:**
- Journey Planner (replaces/enhances Hero component)
- Multi-modal routing engine
- Local Guardian chatbot
- Safety monitoring system
- Itinerary management

## Components and Interfaces

### 1. Journey Planner Component

**Location**: `src/features/journey/components/JourneyPlanner.tsx`

**Purpose**: Main interface for users to input source, destination, and get complete travel plans

**Props Interface**:
```typescript
interface JourneyPlannerProps {
  onPlanGenerated: (plan: TravelPlan) => void;
  initialSource?: Location;
  initialDestination?: Location;
}
```

**Key Features**:
- Autocomplete location search (Google Places API)
- Date picker for departure/return
- Dual-mode toggle (Urgent vs Fun)
- Current location detection
- Recent searches

**UI Layout**:
```
┌────────────────────────────────────────┐
│  🏠 From: [Your Location ▼]           │
│  📍 To:   [Enter destination...]       │
│  📅 Dates: [Select dates]              │
│  ⚡ Mode:  [Urgent] [Fun]              │
│  [Plan My Journey →]                   │
└────────────────────────────────────────┘
```

### 2. Route Display Component

**Location**: `src/features/journey/components/RouteDisplay.tsx`

**Purpose**: Shows complete multi-modal route with timeline visualization

**Props Interface**:
```typescript
interface RouteDisplayProps {
  route: MultiModalRoute;
  mode: 'urgent' | 'fun';
  onSelectRoute: (route: MultiModalRoute) => void;
  alternativeRoutes?: MultiModalRoute[];
}
```

**Route Segment Structure**:
```typescript
interface RouteSegment {
  id: string;
  type: 'walk' | 'metro' | 'bus' | 'taxi' | 'flight' | 'train';
  from: Location;
  to: Location;
  departureTime: Date;
  arrivalTime: Date;
  duration: number; // minutes
  cost: number;
  provider?: string; // e.g., "Air India", "Uber"
  bookingRequired: boolean;
  instructions?: string;
}

interface MultiModalRoute {
  id: string;
  segments: RouteSegment[];
  totalDuration: number;
  totalCost: number;
  accommodation?: Hotel;
  mode: 'urgent' | 'fun';
  highlights?: string[]; // e.g., "Scenic route", "Fastest option"
}
```

**UI Layout**:
```
┌────────────────────────────────────────┐
│  Urgent Mode          Fun Mode         │
│  ⚡ 8h 15min          🎨 12h 30min     │
│  ₹11,760              ₹8,450           │
│                                        │
│  Timeline:                             │
│  7:00 AM  🚶 Walk to Metro (5 min)    │
│  7:05 AM  🚇 Metro Line 2 (40 min)    │
│  7:45 AM  ✈️  Flight AI-101 (4h)      │
│  2:00 PM  🚕 Taxi to Hotel (45 min)   │
│  2:45 PM  🏨 Check-in Hotel Paradise   │
│                                        │
│  [Book This Journey →]                 │
└────────────────────────────────────────┘
```

### 3. Booking Orchestrator

**Location**: `src/features/journey/services/BookingOrchestrator.ts`

**Purpose**: Manages sequential booking of all journey components

**Key Methods**:
```typescript
class BookingOrchestrator {
  async bookCompleteJourney(route: MultiModalRoute): Promise<BookingResult> {
    // 1. Book flights/trains
    // 2. Book accommodation
    // 3. Book local transport (if pre-bookable)
    // 4. Generate consolidated confirmation
    // 5. Set up safety monitoring
  }
  
  async handleBookingFailure(
    failedSegment: RouteSegment,
    route: MultiModalRoute
  ): Promise<AlternativeOptions> {
    // Provide alternatives when booking fails
  }
  
  async modifyBooking(
    bookingId: string,
    changes: BookingChanges
  ): Promise<ModificationResult> {
    // Handle itinerary modifications
  }
}
```

**Booking Flow**:
```
User clicks "Book Everything"
  ↓
Validate payment method
  ↓
Book segments sequentially:
  1. Flights/Trains (critical path)
  2. Accommodation
  3. Local transport
  ↓
If any fails → Offer alternatives
  ↓
Generate confirmation bundle
  ↓
Send notifications (email, SMS)
  ↓
Activate Local Guardian
  ↓
Schedule safety check-ins
```

### 4. Local Guardian Chatbot

**Location**: `src/features/guardian/components/LocalGuardian.tsx`

**Purpose**: AI-powered assistant for destination support

**Props Interface**:
```typescript
interface LocalGuardianProps {
  destination: Location;
  userLanguage: string;
  tripId: string;
  isActive: boolean;
}
```

**Chat Interface**:
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  quickReplies?: QuickReply[];
}

interface QuickReply {
  id: string;
  text: string;
  action: string;
}
```

**Pre-built Templates**:
```typescript
const GUARDIAN_TEMPLATES = {
  bargaining: {
    prompt: "Help me bargain at {location}",
    response: "Fair price range for {item}: {min}-{max} {currency}"
  },
  directions: {
    prompt: "How do I get to {destination}?",
    response: "From your location: {directions}"
  },
  emergency: {
    prompt: "Emergency - I need help",
    response: "Contacting local support. Emergency numbers: {numbers}"
  },
  recommendations: {
    prompt: "What should I do now?",
    response: "Based on time and weather: {suggestions}"
  }
};
```

**UI Layout**:
```
┌────────────────────────────────────────┐
│  Local Guardian 🛡️                     │
│  Available 24/7 in English & Hindi     │
├────────────────────────────────────────┤
│  Quick Actions:                        │
│  [💰 Bargaining] [📍 Directions]      │
│  [🍽️ Food] [🚨 Emergency]             │
├────────────────────────────────────────┤
│  Chat:                                 │
│  You: Help me bargain at this market   │
│  Guardian: Fair price for handicrafts  │
│           in Anjuna Market: ₹200-500   │
│  [Type your message...]                │
└────────────────────────────────────────┘
```

### 5. Safety Monitoring System

**Location**: `src/features/safety/services/SafetyMonitor.ts`

**Purpose**: Automated safety check-ins and emergency response

**Key Features**:
```typescript
class SafetyMonitor {
  async scheduleCheckIns(trip: Trip): Promise<void> {
    // Schedule daily check-ins during trip
  }
  
  async sendCheckIn(userId: string): Promise<void> {
    // Send notification asking "Are you safe?"
  }
  
  async handleMissedCheckIn(userId: string): Promise<void> {
    // Alert emergency contacts after 4 hours
  }
  
  async triggerEmergency(userId: string, location: Location): Promise<void> {
    // Immediate emergency response
    // 1. Notify local support
    // 2. Alert emergency contacts
    // 3. Share live location
    // 4. Provide local emergency numbers
  }
}
```

**Check-in Notification**:
```
┌────────────────────────────────────────┐
│  TravelEase Safety Check-in            │
│  Are you safe and enjoying your trip?  │
│  [✅ I'm Safe] [🚨 Need Help]          │
└────────────────────────────────────────┘
```

### 6. Route Calculation Engine

**Location**: `src/features/journey/services/RouteCalculator.ts`

**Purpose**: Calculate optimal multi-modal routes using Google Maps and other APIs

**Algorithm**:
```typescript
class RouteCalculator {
  async calculateRoute(
    source: Location,
    destination: Location,
    mode: 'urgent' | 'fun',
    date: Date
  ): Promise<MultiModalRoute[]> {
    // 1. Determine if inter-city or intra-city
    const distance = this.calculateDistance(source, destination);
    
    if (distance > 300) {
      // Inter-city: Need flight/train
      return this.calculateInterCityRoute(source, destination, mode, date);
    } else {
      // Intra-city: Local transport only
      return this.calculateIntraCityRoute(source, destination, mode);
    }
  }
  
  private async calculateInterCityRoute(
    source: Location,
    destination: Location,
    mode: 'urgent' | 'fun',
    date: Date
  ): Promise<MultiModalRoute[]> {
    // 1. Get local transport to airport/station
    const toAirport = await this.getLocalTransport(source, nearestAirport);
    
    // 2. Get flights/trains
    const longDistance = await this.getLongDistanceOptions(
      nearestAirport,
      destinationAirport,
      mode,
      date
    );
    
    // 3. Get local transport from airport to accommodation
    const fromAirport = await this.getLocalTransport(
      destinationAirport,
      accommodation
    );
    
    // 4. Combine segments
    return this.combineSegments([toAirport, longDistance, fromAirport]);
  }
  
  private applyModePreferences(
    routes: MultiModalRoute[],
    mode: 'urgent' | 'fun'
  ): MultiModalRoute[] {
    if (mode === 'urgent') {
      // Sort by time, prefer direct routes, premium options
      return routes.sort((a, b) => a.totalDuration - b.totalDuration);
    } else {
      // Sort by experience, prefer scenic routes, budget options
      return routes.sort((a, b) => {
        const scoreA = this.calculateFunScore(a);
        const scoreB = this.calculateFunScore(b);
        return scoreB - scoreA;
      });
    }
  }
  
  private calculateFunScore(route: MultiModalRoute): number {
    let score = 0;
    // Prefer train over flight (more scenic)
    if (route.segments.some(s => s.type === 'train')) score += 10;
    // Prefer budget options
    score += (10000 - route.totalCost) / 100;
    // Prefer routes with more local transport
    score += route.segments.filter(s => s.type === 'metro' || s.type === 'bus').length * 5;
    return score;
  }
}
```

### 7. Recommendation Engine

**Location**: `src/features/recommendations/services/RecommendationEngine.ts`

**Purpose**: Provide personalized activity and dining recommendations

**Algorithm**:
```typescript
class RecommendationEngine {
  async getRecommendations(
    location: Location,
    userPreferences: UserPreferences,
    context: Context
  ): Promise<Recommendation[]> {
    // Context: time of day, weather, budget, crowd levels
    
    const recommendations = await this.fetchNearbyPlaces(location);
    
    // Filter by context
    const filtered = recommendations
      .filter(r => this.matchesTimeOfDay(r, context.timeOfDay))
      .filter(r => this.matchesWeather(r, context.weather))
      .filter(r => this.matchesBudget(r, userPreferences.budget))
      .filter(r => !this.isTouristTrap(r));
    
    // Score and sort
    return filtered
      .map(r => ({
        ...r,
        score: this.calculateRecommendationScore(r, userPreferences, context)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  
  private calculateRecommendationScore(
    rec: Recommendation,
    prefs: UserPreferences,
    context: Context
  ): number {
    let score = rec.rating * 10;
    
    // Prefer less crowded places
    score -= rec.crowdLevel * 5;
    
    // Prefer authentic local experiences
    if (rec.isLocalFavorite) score += 15;
    
    // Prefer places within budget
    if (rec.priceLevel <= prefs.budget) score += 10;
    
    // Weather-appropriate
    if (this.isWeatherAppropriate(rec, context.weather)) score += 10;
    
    return score;
  }
}
```

## Data Models

### Trip Model
```typescript
interface Trip {
  id: string;
  userId: string;
  source: Location;
  destination: Location;
  departureDate: Date;
  returnDate: Date;
  mode: 'urgent' | 'fun';
  route: MultiModalRoute;
  bookings: Booking[];
  status: 'planned' | 'booked' | 'active' | 'completed' | 'cancelled';
  safetyCheckIns: SafetyCheckIn[];
  expenses: Expense[];
  memories: Memory[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Location Model
```typescript
interface Location {
  address: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string; // Google Places ID
  timezone?: string;
}
```

### Booking Model
```typescript
interface Booking {
  id: string;
  tripId: string;
  type: 'flight' | 'train' | 'hotel' | 'transport';
  provider: string;
  confirmationNumber: string;
  segment: RouteSegment;
  cost: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  cancellationPolicy?: string;
  bookingDetails: any; // Provider-specific details
  createdAt: Date;
}
```

### Safety Check-in Model
```typescript
interface SafetyCheckIn {
  id: string;
  tripId: string;
  scheduledTime: Date;
  responseTime?: Date;
  status: 'pending' | 'responded' | 'missed' | 'emergency';
  location?: Location;
  notes?: string;
}
```

### Expense Model
```typescript
interface Expense {
  id: string;
  tripId: string;
  category: 'transport' | 'food' | 'accommodation' | 'activities' | 'shopping' | 'other';
  amount: number;
  currency: string;
  description: string;
  date: Date;
  location?: Location;
  receipt?: string; // URL to receipt image
  isBooked: boolean; // true if booked through platform
}
```

## Error Handling

### Booking Failure Scenarios

1. **Flight/Train Unavailable**
   - Show alternative departure times
   - Suggest nearby airports/stations
   - Offer different transport modes (train vs flight)

2. **Accommodation Unavailable**
   - Show alternative hotels in same area
   - Adjust price range
   - Suggest different neighborhoods

3. **Payment Failure**
   - Retry with same method
   - Offer alternative payment methods
   - Save itinerary for later booking

4. **API Timeout**
   - Use cached data if available
   - Show estimated routes
   - Allow manual booking

### Error Recovery Flow
```typescript
async function handleBookingError(
  error: BookingError,
  route: MultiModalRoute
): Promise<RecoveryOptions> {
  switch (error.type) {
    case 'unavailable':
      return await findAlternatives(route, error.segment);
    case 'payment_failed':
      return await retryPayment(route);
    case 'timeout':
      return await useCachedData(route);
    default:
      return await saveForLater(route);
  }
}
```

## Testing Strategy

### Unit Tests
- Route calculation logic
- Booking orchestration
- Recommendation scoring
- Safety check-in scheduling

### Integration Tests
- Google Maps API integration
- Flight/train API integration
- Payment processing
- Notification delivery

### E2E Tests
- Complete journey planning flow
- One-click booking flow
- Local Guardian chat interaction
- Safety emergency trigger

### Test Scenarios
1. **Happy Path**: Mumbai to Goa, Urgent mode, successful booking
2. **Alternative Route**: Flight unavailable, suggest train
3. **Booking Failure**: Payment fails, retry flow
4. **Emergency**: User triggers emergency, verify response
5. **Offline**: User loses connection, verify offline access

## Performance Considerations

### Optimization Strategies

1. **Route Caching**
   - Cache popular routes for 1 hour
   - Invalidate on real-time updates
   - Store in IndexedDB for offline access

2. **Lazy Loading**
   - Load journey planner on demand
   - Defer Local Guardian until destination
   - Progressive image loading for recommendations

3. **API Rate Limiting**
   - Batch Google Maps requests
   - Debounce autocomplete searches
   - Cache place details

4. **Bundle Size**
   - Code split by feature
   - Lazy load chatbot components
   - Optimize map libraries

### Performance Targets
- Initial page load: < 2 seconds
- Route calculation: < 3 seconds
- Booking confirmation: < 5 seconds
- Chatbot response: < 1 second

## Security Considerations

### Data Protection
- Encrypt booking details at rest
- Secure payment information (PCI compliance)
- Protect location data (GDPR compliance)
- Secure emergency contact information

### API Security
- Use API keys with domain restrictions
- Implement rate limiting
- Validate all user inputs
- Sanitize chatbot responses

### Emergency Features
- Verify emergency contacts
- Secure location sharing (time-limited)
- Encrypted emergency communications
- Audit log for all emergency triggers

## Real API Integration Strategy

### API Services Architecture

```typescript
// Centralized API service layer
src/features/journey/services/
  ├── GoogleMapsService.ts      // Google Maps API wrapper
  ├── SkyscannerService.ts      // Already exists - use this!
  ├── WeatherService.ts         // OpenWeather API wrapper
  ├── GeocodingService.ts       // Already exists - use this!
  └── RouteCalculator.ts        // Orchestrates all APIs
```

### API Error Handling Strategy

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

// Graceful degradation
async function fetchWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>,
  errorMessage: string = 'Service unavailable'
): Promise<APIResponse<T>> {
  try {
    const data = await primaryFn();
    return { success: true, data };
  } catch (error) {
    if (fallbackFn) {
      try {
        const data = await fallbackFn();
        return { success: true, data };
      } catch (fallbackError) {
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: errorMessage,
            retryable: true
          }
        };
      }
    }
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: errorMessage,
        retryable: true
      }
    };
  }
}
```

### API Rate Limiting & Caching

```typescript
// Cache strategy for expensive API calls
const CACHE_DURATION = {
  flights: 5 * 60 * 1000,      // 5 minutes
  directions: 15 * 60 * 1000,  // 15 minutes
  weather: 30 * 60 * 1000,     // 30 minutes
  places: 60 * 60 * 1000       // 1 hour
};

// Use existing cacheStore from booking feature
import { cacheStore } from '@/features/booking/stores/cacheStore';

async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  duration: number
): Promise<T> {
  const cached = cacheStore.get(key);
  if (cached) return cached as T;
  
  const data = await fetchFn();
  cacheStore.set(key, data, duration);
  return data;
}
```

### Real API Usage Examples

#### 1. Google Maps Autocomplete (REAL)
```typescript
// Use Google Places Autocomplete widget
const autocomplete = new google.maps.places.Autocomplete(inputElement, {
  types: ['(cities)'],
  fields: ['place_id', 'geometry', 'name', 'formatted_address']
});

autocomplete.addListener('place_changed', () => {
  const place = autocomplete.getPlace();
  if (place.geometry) {
    // Use real place data
    const location = {
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      placeId: place.place_id
    };
  }
});
```

#### 2. Skyscanner Flight Search (REAL - Already Implemented)
```typescript
// Use existing SkyscannerService
import { SkyscannerService } from '@/services/SkyscannerService';

const skyscanner = new SkyscannerService();

// Search airports
const airports = await skyscanner.searchAirports('Mumbai');
const sourceAirport = airports[0]; // Get skyId and entityId

// Search flights with real data
const flights = await skyscanner.searchFlights({
  originSkyId: sourceAirport.skyId,
  destinationSkyId: destAirport.skyId,
  originEntityId: sourceAirport.entityId,
  destinationEntityId: destAirport.entityId,
  date: '2025-12-15',
  adults: 1,
  cabinClass: 'CABIN_CLASS_ECONOMY'
});

// flights contains real pricing, airlines, times
```

#### 3. OpenWeather API (REAL)
```typescript
async function getWeather(lat: number, lng: number): Promise<Weather> {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`
  );
  
  if (!response.ok) {
    throw new Error('Weather API failed');
  }
  
  const data = await response.json();
  return {
    temp: data.main.temp,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon
  };
}
```

#### 4. Google Directions API (REAL)
```typescript
async function getDirections(
  origin: Location,
  destination: Location,
  mode: 'urgent' | 'fun'
): Promise<google.maps.DirectionsResult> {
  const directionsService = new google.maps.DirectionsService();
  
  const request: google.maps.DirectionsRequest = {
    origin: new google.maps.LatLng(origin.coordinates.lat, origin.coordinates.lng),
    destination: new google.maps.LatLng(destination.coordinates.lat, destination.coordinates.lng),
    travelMode: google.maps.TravelMode.TRANSIT,
    transitOptions: {
      modes: ['BUS', 'RAIL', 'SUBWAY', 'TRAIN'],
      routingPreference: mode === 'urgent' 
        ? google.maps.TransitRoutePreference.FEWER_TRANSFERS
        : google.maps.TransitRoutePreference.LESS_WALKING
    },
    provideRouteAlternatives: true
  };
  
  return new Promise((resolve, reject) => {
    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        resolve(result);
      } else {
        reject(new Error(`Directions failed: ${status}`));
      }
    });
  });
}
```

### API Cost Optimization

1. **Caching**: Cache all API responses with appropriate TTL
2. **Debouncing**: Debounce autocomplete searches (500ms)
3. **Batch Requests**: Combine multiple requests where possible
4. **Lazy Loading**: Only load Google Maps when needed
5. **Error Budgets**: Set daily API call limits

### API Key Security

```typescript
// NEVER expose API keys in client code
// Use environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// For Google Maps, restrict by domain in Google Cloud Console
// For RapidAPI, restrict by domain in RapidAPI dashboard
// For OpenWeather, restrict by domain in OpenWeather dashboard
```

## Deployment Strategy

### Phase 1: Core Journey Planner with Real APIs (Week 1)
- Journey input component with Google Places Autocomplete (REAL)
- Route calculation engine with Google Directions API (REAL)
- Basic route display with real data
- Integration with existing hotel booking (REAL)

### Phase 2: Booking Orchestration (Week 2)
- One-click booking flow
- Payment integration
- Confirmation generation
- Email/SMS notifications

### Phase 3: Local Guardian (Week 3)
- Chatbot UI
- Pre-built templates
- AI integration (OpenAI)
- Human escalation

### Phase 4: Safety & Recommendations (Week 4)
- Safety monitoring system
- Check-in notifications
- Recommendation engine
- Expense tracking

### Phase 5: Polish & Launch (Week 5)
- Offline capabilities
- Performance optimization
- E2E testing
- User documentation

## Integration Points with Existing Vagabond Platform

### 1. Replace Hero Component
- Current: Simple destination search
- New: Complete journey planner with dual-mode routing

### 2. Enhance Hotel Booking
- Current: Standalone hotel booking
- New: Integrated as part of complete journey

### 3. Extend User Profile
- Current: Basic user info and booking history
- New: Add trip history, safety contacts, preferences

### 4. Leverage Existing Services
- Use BookingAPIService for hotel bookings
- Use PaymentAPIService for payment processing
- Use AuthContext for user authentication
- Use NotificationService for alerts

### 5. Add New Routes
```typescript
// New routes to add
/journey/plan - Journey planner
/journey/:id - View specific journey
/journey/:id/book - Booking flow
/guardian - Local Guardian chat
/safety - Safety dashboard
/trips - All trips (past and upcoming)
```

## API Integration Details - REAL IMPLEMENTATION ONLY

**CRITICAL: This system MUST use real APIs. No mock data is acceptable for the journey planner.**

### Environment Variables Required
```bash
# .env file
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_RAPIDAPI_KEY=your_rapidapi_key (for Skyscanner)
VITE_OPENWEATHER_API_KEY=your_openweather_key
```

### Google Maps APIs (REAL)
```typescript
// Required APIs - ALL MUST BE ENABLED IN GOOGLE CLOUD CONSOLE
- Places API (autocomplete, place details)
- Directions API (multi-modal routing)
- Distance Matrix API (travel time estimation)
- Geocoding API (address to coordinates)
- Maps JavaScript API (map display)

// Real implementation example
const directionsService = new google.maps.DirectionsService();
const result = await directionsService.route({
  origin: sourceLocation,
  destination: destLocation,
  travelMode: google.maps.TravelMode.TRANSIT,
  transitOptions: {
    modes: ['BUS', 'RAIL', 'SUBWAY'],
    routingPreference: mode === 'urgent' ? 'FEWER_TRANSFERS' : 'LESS_WALKING'
  }
});

// Handle real API responses
if (result.status === 'OK') {
  const route = result.routes[0];
  // Process real route data
} else {
  // Handle API errors gracefully
  throw new Error(`Directions API error: ${result.status}`);
}
```

### Flight API (RapidAPI - Skyscanner) - REAL IMPLEMENTATION
```typescript
// Use the existing SkyscannerService.ts which already has real API integration
import { SkyscannerService } from '@/services/SkyscannerService';

const skyscannerService = new SkyscannerService();

// Real flight search with live data
const flightOptions = await skyscannerService.searchFlights({
  originSkyId: sourceAirport.skyId,
  destinationSkyId: destAirport.skyId,
  originEntityId: sourceAirport.entityId,
  destinationEntityId: destAirport.entityId,
  date: departureDate,
  adults: 1,
  cabinClass: mode === 'urgent' ? 'CABIN_CLASS_BUSINESS' : 'CABIN_CLASS_ECONOMY',
  sortBy: mode === 'urgent' ? 'best' : 'price_low'
});

// Get airport details using real API
const airports = await skyscannerService.searchAirports(cityName);
```

### Weather API (OpenWeather)
```typescript
const weather = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}`
);
```

### AI Chatbot (OpenAI)
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'system',
      content: `You are a local travel assistant in ${destination}. Help with bargaining, directions, and recommendations. Be concise and practical.`
    },
    {
      role: 'user',
      content: userMessage
    }
  ]
});
```

## Mobile Responsiveness

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile-Specific Features
- Bottom sheet for route selection
- Swipeable itinerary cards
- One-tap emergency button
- Voice input for chatbot
- Offline-first architecture

## Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation for all features
- Screen reader support
- High contrast mode
- Focus indicators
- Alt text for all images
- ARIA labels for interactive elements

### Emergency Accessibility
- Large emergency button
- Voice-activated emergency trigger
- Simple emergency flow (minimal steps)
- Multi-language support

## Monitoring and Analytics

### Key Metrics
- Journey planning completion rate
- Booking conversion rate
- Average booking value
- Local Guardian usage
- Safety check-in response rate
- User satisfaction score

### Error Tracking
- API failures
- Booking failures
- Payment errors
- Emergency triggers

### User Behavior
- Popular routes
- Mode preference (Urgent vs Fun)
- Most used Local Guardian features
- Recommendation click-through rate
