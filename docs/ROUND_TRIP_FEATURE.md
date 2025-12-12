# Round-Trip Journey Feature

## Overview
The journey planning system now supports round-trip bookings with separate outbound and return journeys.

## How It Works

### 1. Home Page Search
Users can select both departure and return dates from the journey search card on the home page:
- **Departure Date**: When they want to leave
- **Return Date**: When they want to come back (optional)

### 2. Journey Planning
When a return date is provided:
- The AI Journey Planner generates **two separate routes**:
  - **Outbound Journey**: Source → Destination
  - **Return Journey**: Destination → Source
- Each journey is optimized independently based on the selected travel mode (urgent/leisure)

### 3. Route Display
The Route Planning page shows:
- Separate tabs for "Outbound" and "Return" journeys
- Each journey displays its own:
  - Multi-modal transport segments
  - Timing and duration
  - Stops and meal breaks
  - Accommodation recommendations

### 4. Trip Summary
The trip summary displays:
- Full date range (e.g., "Dec 15 - Dec 20")
- Number of nights
- Both source and destination cities

## Technical Implementation

### Updated Files

#### 1. `src/features/journey/services/AIJourneyPlanner.ts`
- `planJourney()` method now returns optional `returnUrgentRoute` and `returnFunRoute`
- Generates return journey when `params.returnDate` is provided
- Return journey reverses source/destination and uses the return date

#### 2. `src/pages/RoutePlanning.tsx`
- Added "Return" tab when return date exists
- Shows return journey segments in reverse order
- Displays trip duration in nights
- Updated trip summary to show date range

#### 3. `src/types/journey.ts`
- Added `isRoundTrip` flag to `JourneyRequest`
- Added `returnRoute` to `Trip` interface

### Data Flow

```
Home Page (JourneySearchCard)
  ↓ (includes returnDate if selected)
Journey Planner Page
  ↓ (passes returnDate to AI service)
AIJourneyPlanner.planJourney()
  ↓ (generates both routes)
Route Planning Page
  ↓ (displays both journeys)
User confirms and books
```

## User Experience

### One-Way Trip
1. User enters source, destination, departure date
2. Leaves return date empty
3. System plans only outbound journey
4. Route page shows single journey

### Round-Trip
1. User enters source, destination, departure date, **and return date**
2. System plans both outbound and return journeys
3. Route page shows tabs for both journeys
4. User can review and book complete round-trip

## Benefits

- **Convenience**: Book entire trip in one flow
- **Optimization**: Each leg optimized separately for best routes
- **Flexibility**: Return journey can use different transport modes
- **Cost Savings**: System can find better deals for round-trips
- **Time Management**: See complete trip timeline upfront

## Future Enhancements

1. **Multi-City Trips**: Support for multiple destinations
2. **Flexible Dates**: "Return within 3-5 days" option
3. **Open Return**: Book outbound now, return later
4. **Round-Trip Discounts**: Detect and apply airline/hotel discounts
5. **Alternative Returns**: Show multiple return options
