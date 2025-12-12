# Traveler/Passenger Count Features

## Overview
The journey planner now fully integrates the number of travelers throughout the booking flow, affecting pricing, seating, accommodations, and dining recommendations.

## Features Implemented

### 1. Dynamic Pricing Based on Travelers

#### Per-Person Pricing
- Each transport segment shows individual price
- Total automatically multiplies by number of travelers
- Clear breakdown in pricing summary

#### Group Discounts
- **4+ travelers**: Automatic 10% group discount
- Discount clearly shown in pricing breakdown
- Applied to total journey cost

#### Example Pricing
```
2 Travelers:
- Metro: ₹60 × 2 = ₹120
- Flight: ₹5,500 × 2 = ₹11,000
- Bus: ₹40 × 2 = ₹80
Total: ₹11,200

5 Travelers (with 10% discount):
- Metro: ₹60 × 5 = ₹300
- Flight: ₹5,500 × 5 = ₹27,500
- Bus: ₹40 × 5 = ₹200
Subtotal: ₹28,000
Discount: -₹2,800
Total: ₹25,200
```

### 2. Seat Requirements

#### Visual Indicators
- Each transport segment shows required seats
- Icon with seat count (e.g., "5 seats")
- Color-coded for easy identification

#### Segment-Specific Display
- **Walk**: Shows traveler count, no seats needed
- **Metro/Bus**: Shows seat requirements
- **Flight**: Shows passenger count in details

### 3. Accommodation Recommendations

#### Room Calculations
- Automatic room count based on travelers
- Standard: 2 guests per room
- Displays total nights needed

#### Group Tips
- **3+ travelers**: Suggests connecting rooms
- **6+ travelers**: Recommends suites or group bookings
- Personalized based on group size

#### Example Display
```
For 5 travelers, 3-night stay:
• 5 travelers
• 3 rooms recommended (2 guests per room)
• 3 nights

💡 Tip: For groups of 5, consider booking 
connecting rooms or a suite for better coordination.
```

### 4. Dining Recommendations

#### Group Dining Alerts
- **4+ travelers**: Shows group dining notice
- Suggests restaurants with group seating
- Recommends making reservations

#### Personalized Descriptions
- Mentions party size in descriptions
- Adjusts recommendations for group size
- **6+ travelers**: Mentions set menus and group discounts

#### Example
```
For 6 travelers:

[Alert Box]
Group Dining
For groups of 6, we recommend restaurants 
with group seating. Reservations suggested.

Breakfast Stop
Quick grab-and-go options for 6 people

Lunch
Popular local restaurant • Seating for 6

💡 Tip: Large groups may qualify for set 
menus or group discounts at select restaurants.
```

### 5. Trip Summary Card

#### Comprehensive Overview
Located in the right sidebar, shows:
- Number of travelers
- Price per person
- Subtotal (before discount)
- Group discount (if applicable)
- Final total
- Trip type (round-trip/one-way)

#### Real-Time Updates
- Updates when traveler count changes
- Recalculates all pricing
- Shows discount eligibility

### 6. Route Segment Enhancements

#### Each Segment Shows
- **Time**: Departure time
- **Price**: Total for all travelers
- **Seats**: Required seats (for transport)
- **Duration**: Travel time
- **Distance**: Route distance

#### Color-Coded Information
- Time: Gray (muted)
- Price: Blue (primary)
- Seats: Blue with icon
- Duration/Distance: Gray

## User Experience Flow

### Booking Journey
```
1. Home Page
   ↓ Select 5 travelers
   
2. Journey Planner
   ↓ Choose travel preferences
   
3. Route Planning
   ↓ See personalized route
   
   - Pricing: ₹25,200 (with 10% discount)
   - Seats: 5 seats on each segment
   - Rooms: 3 rooms recommended
   - Dining: Group seating suggestions
   
4. Confirm & Book
   ↓ All travelers included
```

### Visual Hierarchy

#### Priority 1: Pricing
- Large, bold total in summary card
- Per-segment pricing visible
- Discount highlighted in green

#### Priority 2: Logistics
- Seat requirements on each segment
- Room count in accommodation tab
- Group size in dining recommendations

#### Priority 3: Tips & Recommendations
- Group-specific suggestions
- Discount eligibility notices
- Booking recommendations

## Technical Implementation

### Pricing Calculation
```typescript
const calculatePricing = () => {
  const basePrices = {
    metro: 60,
    flight: intent === 'urgent' ? 8500 : 5500,
    bus: 40,
  };

  const totalPerPerson = basePrices.metro + basePrices.flight + basePrices.bus;
  const total = totalPerPerson * numGuests;

  // Group discount for 4+ travelers
  const discount = numGuests >= 4 ? 0.1 : 0;
  const finalTotal = total * (1 - discount);

  return {
    perPerson: totalPerPerson,
    subtotal: total,
    discount: total * discount,
    total: finalTotal,
    hasDiscount: numGuests >= 4,
  };
};
```

### Room Calculation
```typescript
const roomsNeeded = Math.ceil(numGuests / 2);
// 1-2 travelers: 1 room
// 3-4 travelers: 2 rooms
// 5-6 travelers: 3 rooms
```

### Conditional Rendering
```typescript
{numGuests >= 4 && (
  <div>Group discount applied!</div>
)}

{numGuests >= 6 && (
  <div>Large group tips...</div>
)}
```

## Benefits

### For Solo Travelers (1 person)
- Clear single-person pricing
- No unnecessary group features
- Streamlined experience

### For Couples (2 people)
- Standard pricing
- 1 room recommendation
- Intimate dining suggestions

### For Small Groups (3-4 people)
- Group discount at 4 travelers
- 2 rooms recommended
- Group seating suggestions

### For Large Groups (5+ people)
- 10% discount automatically applied
- Multiple room coordination
- Group dining recommendations
- Set menu suggestions

## Future Enhancements

### Pricing
1. **Dynamic discounts**: Vary by season/demand
2. **Early bird**: Discounts for advance booking
3. **Loyalty points**: For repeat travelers
4. **Split payment**: Divide cost among travelers

### Accommodations
1. **Room preferences**: Single/double/suite options
2. **Bed configuration**: Twin/king/queen selection
3. **Connecting rooms**: Automatic booking
4. **Family rooms**: For groups with children

### Dining
1. **Dietary restrictions**: Per traveler
2. **Reservation booking**: Direct integration
3. **Menu preview**: For group orders
4. **Cost splitting**: Bill division options

### Logistics
1. **Seat selection**: Choose specific seats
2. **Baggage**: Per-person allowance
3. **Special needs**: Accessibility requirements
4. **Age groups**: Children/adults/seniors

## Accessibility

### Screen Readers
- Clear labels for traveler count
- Pricing breakdown announced
- Discount information accessible

### Visual Indicators
- Icons for seat requirements
- Color coding for pricing
- Clear typography hierarchy

### Keyboard Navigation
- Tab through pricing details
- Navigate between segments
- Access all traveler information

## Mobile Optimization

### Compact Display
- Pricing summary collapsible
- Segment details expandable
- Touch-friendly controls

### Priority Information
- Total price always visible
- Traveler count in header
- Quick access to key details
