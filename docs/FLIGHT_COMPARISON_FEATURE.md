# Flight Comparison Feature

## Overview
When users click on a flight segment in their journey, a modal opens showing all available flight options from different airlines and booking platforms, allowing them to compare prices, amenities, and book directly.

## Features

### 1. Clickable Flight Segments
- Flight segments in the route timeline are now interactive
- Visual indicator: "View Options →" appears on hover
- Enhanced hover state with border highlight and shadow
- Click to open flight comparison modal

### 2. Flight Comparison Modal

#### Display Information
For each flight option, users see:
- **Airline Details**
  - Airline name and logo
  - Flight number
  - Star rating and review count

- **Schedule**
  - Departure time and airport
  - Arrival time and airport
  - Flight duration
  - Number of stops (Non-stop, 1 stop, etc.)

- **Pricing**
  - Total price for all passengers
  - Per-person breakdown
  - Varies by airline and class

- **Amenities**
  - WiFi availability
  - Meal service
  - Extra legroom
  - Class (Economy/Business)

- **Booking**
  - Direct link to booking site
  - Opens in new tab
  - Multiple booking platforms (MakeMyTrip, Cleartrip, Goibibo, etc.)

### 3. Multiple Airlines Shown

#### Airlines Included
- Air India (AI)
- IndiGo (6E)
- SpiceJet (SG)
- Vistara (UK)
- Go First (G8)

Each with different:
- Departure times (staggered by 30 minutes)
- Pricing (varies by ±₹2,000)
- Amenities
- Class options

### 4. Booking Platform Integration

#### Supported Platforms
- MakeMyTrip
- Cleartrip
- Goibibo
- Yatra
- EaseMyTrip

Each flight links to the respective booking site for direct booking.

## User Experience Flow

### Step 1: View Route
```
User sees journey with flight segment:
┌─────────────────────────────────────┐
│  ✈️  Flight    10:33    ₹27,500    │
│  Mumbai → Goa                       │
│  AI 101 - Economy • 5 passengers    │
│  View Options →                     │
└─────────────────────────────────────┘
```

### Step 2: Click Flight
```
Modal opens showing all available flights
```

### Step 3: Compare Options
```
┌──────────────────────────────────────────────────────┐
│  Available Flights: Mumbai → Goa                     │
│  Compare prices from different airlines • 5 passengers│
├──────────────────────────────────────────────────────┤
│                                                      │
│  🇮🇳 Air India  AI 100  ⭐ 4.3 (2,345)             │
│  10:33 → 13:03  (2h 30min)  Non-stop               │
│  Economy • WiFi • Meals                             │
│  ₹27,500 total (₹5,500/person)                     │
│  [Book on MakeMyTrip →]                             │
│                                                      │
│  ✈️  IndiGo  6E 101  ⭐ 4.5 (3,892)                │
│  11:03 → 13:33  (2h 30min)  Non-stop               │
│  Business • WiFi • Extra Legroom                    │
│  ₹32,500 total (₹6,500/person)                     │
│  [Book on Cleartrip →]                              │
│                                                      │
│  ... more options ...                               │
└──────────────────────────────────────────────────────┘
```

### Step 4: Book Flight
```
Click "Book on [Platform]" → Opens booking site in new tab
```

## Visual Design

### Flight Card Layout
```
┌────────────────────────────────────────────────────────┐
│  🇮🇳  Air India        ⭐ 4.3 (2,345 reviews)         │
│      AI 100                                            │
│                                                        │
│  Departure      Duration        Arrival                │
│  10:33          2h 30min        13:03                  │
│  Mumbai         ✈️ Non-stop     Goa                    │
│                                                        │
│  [Economy] 📶 WiFi ☕ Meals                           │
│                                                        │
│                              Total for 5               │
│                              ₹27,500                   │
│                              ₹5,500/person             │
│                                                        │
│                    [Book on MakeMyTrip →]              │
└────────────────────────────────────────────────────────┘
```

### Color Scheme
- Primary: Blue (#3B82F6) for prices and CTAs
- Success: Green for ratings
- Muted: Gray for secondary info
- Accent: Yellow for star ratings

### Icons
- ✈️ Plane: Flight indicator
- ⭐ Star: Ratings
- 📶 WiFi: Internet availability
- ☕ Coffee: Meal service
- 🧳 Luggage: Extra legroom
- 🔗 External Link: Booking redirect

## Technical Implementation

### Flight Generation
```typescript
const generateFlightOptions = (from: string, to: string, time: string) => {
  const airlines = [
    { name: 'Air India', code: 'AI', logo: '🇮🇳' },
    { name: 'IndiGo', code: '6E', logo: '✈️' },
    // ... more airlines
  ];

  return airlines.map((airline, index) => {
    const basePrice = intent === 'urgent' ? 8500 : 5500;
    const priceVariation = (Math.random() - 0.5) * 2000;
    const price = Math.round((basePrice + priceVariation) / 100) * 100;
    
    return {
      airline: airline.name,
      flightNumber: `${airline.code} ${100 + index}`,
      departure: calculateTime(time, index),
      price: price,
      amenities: generateAmenities(),
      // ... more details
    };
  });
};
```

### Modal State Management
```typescript
const [showFlightModal, setShowFlightModal] = useState(false);
const [selectedFlightRoute, setSelectedFlightRoute] = useState(null);

const handleFlightClick = (from, to, time) => {
  setSelectedFlightRoute({ from, to, time });
  setShowFlightModal(true);
};
```

### Clickable Segment
```typescript
<RouteSegment
  mode="Flight"
  isClickable={true}
  onClick={() => handleFlightClick(from, to, time)}
  // ... other props
/>
```

## Benefits

### For Users
1. **Price Comparison**: See all options at once
2. **Time Flexibility**: Multiple departure times
3. **Amenity Selection**: Choose based on preferences
4. **Direct Booking**: One-click to booking site
5. **Informed Decision**: Ratings and reviews visible

### For Business
1. **Affiliate Revenue**: Booking site partnerships
2. **User Engagement**: Interactive experience
3. **Transparency**: Build trust with comparisons
4. **Conversion**: Direct booking links

## Future Enhancements

### Phase 2
1. **Real API Integration**
   - Connect to Skyscanner API
   - Google Flights integration
   - Live pricing updates

2. **Advanced Filters**
   - Price range slider
   - Departure time preferences
   - Airline preferences
   - Number of stops filter
   - Baggage allowance

3. **Sorting Options**
   - Cheapest first
   - Fastest first
   - Best rated
   - Recommended (AI-powered)

### Phase 3
1. **Price Alerts**
   - Set price drop notifications
   - Track specific flights
   - Email/SMS alerts

2. **Seat Selection**
   - View seat maps
   - Select specific seats
   - Extra legroom options

3. **Bundle Deals**
   - Flight + Hotel packages
   - Car rental add-ons
   - Travel insurance

### Phase 4
1. **Historical Data**
   - Price trends
   - Best time to book
   - Seasonal patterns

2. **Loyalty Integration**
   - Frequent flyer miles
   - Credit card points
   - Airline status benefits

3. **Group Booking**
   - Coordinate seats together
   - Group discounts
   - Split payment options

## API Integration Guide

### Recommended APIs

#### 1. Skyscanner API
```javascript
const searchFlights = async (from, to, date, passengers) => {
  const response = await fetch(
    `https://partners.api.skyscanner.net/apiservices/browseroutes/v1.0/
     {market}/{currency}/{locale}/{originPlace}/{destinationPlace}/
     {outboundPartialDate}?apiKey={apiKey}`
  );
  return response.json();
};
```

#### 2. Amadeus API
```javascript
const amadeus = new Amadeus({
  clientId: 'YOUR_API_KEY',
  clientSecret: 'YOUR_API_SECRET'
});

const flightOffers = await amadeus.shopping.flightOffersSearch.get({
  originLocationCode: 'BOM',
  destinationLocationCode: 'GOI',
  departureDate: '2024-12-15',
  adults: '2'
});
```

#### 3. Google Flights (QPX Express - Deprecated)
Alternative: Use Google Flights scraping or partner APIs

### Data Structure
```typescript
interface FlightOption {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
  class: 'Economy' | 'Business' | 'First';
  stops: number;
  amenities: string[];
  bookingUrl: string;
  bookingSite: string;
  rating?: number;
  reviews?: number;
}
```

## Performance Considerations

### Optimization
1. **Lazy Loading**: Load flight data only when modal opens
2. **Caching**: Cache results for 5-10 minutes
3. **Pagination**: Show 5-10 flights initially, load more on scroll
4. **Debouncing**: Prevent rapid API calls

### Loading States
```typescript
const [isLoadingFlights, setIsLoadingFlights] = useState(false);

const handleFlightClick = async (from, to, time) => {
  setIsLoadingFlights(true);
  const flights = await fetchFlights(from, to, time);
  setFlightOptions(flights);
  setIsLoadingFlights(false);
  setShowFlightModal(true);
};
```

## Accessibility

### Keyboard Navigation
- Tab through flight options
- Enter to select/book
- Escape to close modal

### Screen Readers
- Announce flight details
- Price information clearly labeled
- Booking links descriptive

### Visual
- High contrast for prices
- Clear focus indicators
- Large touch targets (mobile)

## Mobile Optimization

### Responsive Design
- Stack flight cards vertically
- Collapsible details
- Sticky booking button
- Swipe to dismiss modal

### Touch Interactions
- Large tap targets
- Swipe between flights
- Pull to refresh prices
