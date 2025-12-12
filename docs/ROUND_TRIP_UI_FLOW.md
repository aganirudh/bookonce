# Round-Trip UI Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        HOME PAGE                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Journey Search Card                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  From    │  │    To    │  │  Dates   │           │  │
│  │  │  Mumbai  │→ │   Goa    │  │ Dec 15-  │           │  │
│  │  │          │  │          │  │  Dec 20  │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │                                                       │  │
│  │  [Explore Journey] ────────────────────────────────► │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   JOURNEY PLANNER PAGE                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Select Travel Purpose:                               │  │
│  │  ○ Urgent Travel    ● Leisure Travel                  │  │
│  │                                                        │  │
│  │  Select Experience:                                    │  │
│  │  ● First Visit      ○ Returning                       │  │
│  │                                                        │  │
│  │  [Start Planning My Route] ─────────────────────────► │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ROUTE PLANNING PAGE                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Trip Summary                                         │  │
│  │  From: Mumbai  │  To: Goa  │  Dec 15 - Dec 20 (5n)  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tabs: [Outbound] [Return] [Stops] [Accommodation]   │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  OUTBOUND - Friday, December 15, 2024          │ │  │
│  │  │  Mumbai → Goa                                   │ │  │
│  │  │                                                 │ │  │
│  │  │  🚶 Walk: Home → Metro (8 min)                 │ │  │
│  │  │  🚇 Metro: Station → Airport (25 min)          │ │  │
│  │  │  ✈️  Flight: Mumbai → Goa (2h 30min)           │ │  │
│  │  │  🚌 Bus: Airport → City Center (35 min)        │ │  │
│  │  │  🚶 Walk: Bus Stop → Hotel (5 min)             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  RETURN - Wednesday, December 20, 2024         │ │  │
│  │  │  Goa → Mumbai                                   │ │  │
│  │  │                                                 │ │  │
│  │  │  🚶 Walk: Hotel → Bus Stop (5 min)             │ │  │
│  │  │  🚌 Bus: City Center → Airport (35 min)        │ │  │
│  │  │  ✈️  Flight: Goa → Mumbai (2h 30min)           │ │  │
│  │  │  🚇 Metro: Airport → Station (25 min)          │ │  │
│  │  │  🚶 Walk: Metro → Home (8 min)                 │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  [Confirm & Book Journey] ───────────────────────────────►  │
└─────────────────────────────────────────────────────────────┘
```

## Key UI Elements

### 1. Date Picker (Home Page)
```
┌────────────────────────────────┐
│  Dates                         │
│  ┌──────────────────────────┐ │
│  │  Dec 15 - Dec 20 (5n)    │ │
│  └──────────────────────────┘ │
│                                │
│  Calendar View:                │
│  ┌──────────────────────────┐ │
│  │  [Select departure date] │ │
│  │  [Select return date]    │ │
│  │                          │ │
│  │  [Cancel]  [Apply]       │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

### 2. Route Tabs (Route Planning Page)
```
┌────────────────────────────────────────────────┐
│  [Outbound] [Return] [Stops] [Accommodation]  │
└────────────────────────────────────────────────┘
     Active      Inactive
```

### 3. Journey Segment Card
```
┌────────────────────────────────────────┐
│  🚇  Metro              08:15          │
│  Central Station → Airport Station     │
│  Line 3 - Direction Airport            │
│  ⏱️ 25 min  📏 18 km                   │
└────────────────────────────────────────┘
```

## User Interactions

### Selecting Dates
1. Click on "Dates" field
2. Calendar opens
3. Click departure date (highlights)
4. Click return date (creates range)
5. Shows "X nights" indicator
6. Click "Apply" to confirm

### Viewing Routes
1. System generates both routes
2. Default view shows "Outbound" tab
3. Click "Return" tab to see return journey
4. Each tab shows complete door-to-door route
5. Segments displayed chronologically

### Booking
1. Review both outbound and return journeys
2. Check stops and accommodation
3. Click "Confirm & Book Journey"
4. System books all segments for both directions

## Responsive Design

### Mobile View
- Tabs stack vertically
- Segments show in compact cards
- Swipe between outbound/return
- Date range shows abbreviated format

### Desktop View
- Tabs horizontal at top
- Full segment details visible
- Side-by-side comparison option
- Map view shows both routes

## Empty States

### No Return Date
```
┌────────────────────────────────┐
│  [Outbound] [Stops] [Stay]    │
│  (No Return tab shown)         │
└────────────────────────────────┘
```

### With Return Date
```
┌────────────────────────────────────────┐
│  [Outbound] [Return] [Stops] [Stay]   │
│  (Return tab available)                │
└────────────────────────────────────────┘
```
