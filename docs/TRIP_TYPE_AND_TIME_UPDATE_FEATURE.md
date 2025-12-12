# Trip Type Selection & Dynamic Time Updates

## Overview
Enhanced the journey planning system with two key features:
1. **Trip Type Selector**: Choose between one-way and round-trip on the home page
2. **Dynamic Time Updates**: All route segment times update automatically when departure time changes

## Feature 1: Trip Type Selector

### Location
Home page journey search card - inside the date picker modal

### UI Design
```
┌─────────────────────────────────────┐
│  Select your travel dates           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Round-trip] [One-way]        │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Calendar Component]               │
│                                     │
│  [Cancel]  [Apply]                  │
└─────────────────────────────────────┘
```

### Behavior

#### Round-Trip Mode (Default)
- Calendar shows range selection
- User selects departure date, then return date
- Display shows: "Dec 15 - Dec 20 (5n)"
- Both dates required to proceed

#### One-Way Mode
- Calendar shows single date selection
- User selects only departure date
- Display shows: "Dec 15"
- Return date is null/empty

### User Flow

1. **User clicks on "Dates" field**
   - Date picker modal opens
   - Default mode: Round-trip

2. **User can switch trip type**
   - Click "One-way" button
   - Calendar switches to single date mode
   - Any selected return date is cleared

3. **User selects date(s)**
   - Round-trip: Click departure, then return
   - One-way: Click departure only

4. **User clicks "Apply"**
   - Dates are saved
   - Modal closes
   - Search button becomes active

### Technical Implementation

#### State Management
```typescript
const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');
const [tempTripType, setTempTripType] = useState<'round-trip' | 'one-way'>('round-trip');
```

#### Validation
```typescript
// One-way: Only departure required
if (!source || !destination || !departureDate) {
  alert("Please fill in source, destination, and departure date");
  return;
}

// Round-trip: Both dates required
if (tripType === 'round-trip' && !returnDate) {
  alert("Please select a return date for round-trip");
  return;
}
```

#### Calendar Component
- Conditionally renders based on trip type
- One-way: `mode="single"`
- Round-trip: `mode="range"`

## Feature 2: Dynamic Time Updates

### Location
Route Planning page - all route segment cards

### Behavior

When user changes the departure time input:
1. First segment starts at new time
2. All subsequent segments recalculate automatically
3. Times update in real-time across all tabs (Outbound/Return)

### Example

**User sets departure time to 09:30**

```
🚶 Walk: Home → Metro
   09:30 (8 min)

🚇 Metro: Station → Airport
   09:38 (25 min)

✈️  Flight: Mumbai → Goa
   12:03 (2h 30min)

🚌 Bus: Airport → City Center
   14:33 (35 min)

🚶 Walk: Bus Stop → Hotel
   15:08 (5 min)
```

**User changes to 06:00**

```
🚶 Walk: Home → Metro
   06:00 (8 min)

🚇 Metro: Station → Airport
   06:08 (25 min)

✈️  Flight: Mumbai → Goa
   08:33 (2h 30min)

🚌 Bus: Airport → City Center
   11:03 (35 min)

🚶 Walk: Bus Stop → Hotel
   11:38 (5 min)
```

### Technical Implementation

#### Time Calculation Function
```typescript
const calculateSegmentTimes = (startTime: string) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  let currentMinutes = hours * 60 + minutes;

  const addMinutes = (mins: number) => {
    currentMinutes += mins;
    const h = Math.floor(currentMinutes / 60) % 24;
    const m = currentMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return {
    walk1: startTime,
    metro: addMinutes(8),
    flight: addMinutes(25 + 120), // metro + buffer
    bus: addMinutes(150), // flight duration
    walk2: addMinutes(35), // bus duration
  };
};
```

#### Usage in Components
```typescript
const segmentTimes = calculateSegmentTimes(departureTime);

<RouteSegment
  time={segmentTimes.walk1}
  // ... other props
/>
```

#### Reactive Updates
- State change in `departureTime` triggers recalculation
- All segment times update automatically
- No manual refresh needed

## Benefits

### Trip Type Selector
1. **Flexibility**: Users can book one-way or round-trip
2. **Clarity**: Clear indication of trip type before booking
3. **Validation**: Prevents errors by requiring appropriate dates
4. **Cost Savings**: One-way option for users who don't need return

### Dynamic Time Updates
1. **Convenience**: Adjust schedule without re-planning
2. **Real-time**: See impact of time changes immediately
3. **Accuracy**: All segments stay synchronized
4. **Planning**: Easy to find optimal departure time

## User Experience Improvements

### Before
- Only round-trip supported
- Had to re-search for one-way trips
- Static times, couldn't adjust schedule
- Had to manually calculate segment times

### After
- Choose trip type upfront
- One search for any trip type
- Dynamic time adjustment
- Automatic time calculations

## Future Enhancements

### Trip Type
1. **Multi-city**: Add support for multiple destinations
2. **Open-jaw**: Different departure/return cities
3. **Flexible dates**: "±3 days" option
4. **Price comparison**: Show cost difference between types

### Time Updates
1. **Buffer customization**: Let users adjust connection times
2. **Alternative times**: Show multiple departure options
3. **Optimal time**: AI suggests best departure time
4. **Time zones**: Handle cross-timezone journeys
5. **Return journey times**: Sync return times with outbound

## Technical Notes

### Files Modified
1. `src/components/JourneySearchCard.tsx`
   - Added trip type state and selector
   - Updated calendar component logic
   - Enhanced validation

2. `src/pages/RoutePlanning.tsx`
   - Added time calculation function
   - Made segment times dynamic
   - Connected to departure time input

### Dependencies
- `date-fns`: Date manipulation
- `@/components/ui/calendar`: Calendar component
- React state management

### Performance
- Time calculations are lightweight (O(1))
- No API calls needed
- Instant updates on user input
