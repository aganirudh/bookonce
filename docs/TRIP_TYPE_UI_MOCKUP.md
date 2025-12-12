# Trip Type & Time Update UI Mockup

## Home Page - Date Picker with Trip Type Selector

### Before Opening
```
┌────────────────────────────────────────────────────────┐
│  [From: Mumbai]  [To: Goa]  [Dates: Add dates]  [2]   │
└────────────────────────────────────────────────────────┘
```

### After Clicking "Dates" - Round-Trip Selected
```
┌─────────────────────────────────────────────────────────┐
│  Select your travel dates                               │
│  Choose your departure date                             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │ Round-trip   │  │   One-way    │              │ │
│  │  │  (Active)    │  │  (Inactive)  │              │ │
│  │  └──────────────┘  └──────────────┘              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         December 2024                             │ │
│  │  Su Mo Tu We Th Fr Sa                             │ │
│  │              1  2  3  4  5  6  7                  │ │
│  │   8  9 10 11 12 13 14                             │ │
│  │  [15][16][17][18][19][20] 21  ← Range Selection  │ │
│  │  22 23 24 25 26 27 28                             │ │
│  │  29 30 31                                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  5 days selected                                        │
│                                                         │
│  [Cancel]                              [Apply]          │
└─────────────────────────────────────────────────────────┘
```

### After Switching to One-Way
```
┌─────────────────────────────────────────────────────────┐
│  Select your travel dates                               │
│  Choose your departure date                             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │  Round-trip  │  │   One-way    │              │ │
│  │  │  (Inactive)  │  │   (Active)   │              │ │
│  │  └──────────────┘  └──────────────┘              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         December 2024                             │ │
│  │  Su Mo Tu We Th Fr Sa                             │ │
│  │              1  2  3  4  5  6  7                  │ │
│  │   8  9 10 11 12 13 14                             │ │
│  │  [15] 16 17 18 19 20 21  ← Single Selection      │ │
│  │  22 23 24 25 26 27 28                             │ │
│  │  29 30 31                                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  One-way trip selected                                  │
│                                                         │
│  [Cancel]                              [Apply]          │
└─────────────────────────────────────────────────────────┘
```

### After Applying - Display Updates
```
Round-trip:
┌────────────────────────────────────────────────────────┐
│  [From: Mumbai]  [To: Goa]  [Dec 15 - Dec 20 (5n)]    │
└────────────────────────────────────────────────────────┘

One-way:
┌────────────────────────────────────────────────────────┐
│  [From: Mumbai]  [To: Goa]  [Dec 15]                   │
└────────────────────────────────────────────────────────┘
```

## Route Planning Page - Dynamic Time Updates

### Time Input Control
```
┌─────────────────────────────────────────────────────────┐
│  Your Door-to-Door Route          🕐 [08:00] ← Input   │
└─────────────────────────────────────────────────────────┘
```

### Route Segments - Initial State (08:00)
```
┌─────────────────────────────────────────────────────────┐
│  🚶 Walk                                    08:00       │
│  Your Home → Metro Station                              │
│  ⏱️ 8 min  📏 650 m                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚇 Metro                                   08:08       │
│  Central Station → Airport Station                      │
│  Line 3 - Direction Airport                             │
│  ⏱️ 25 min  📏 18 km                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ✈️  Flight                                 10:33       │
│  Mumbai → Goa                                           │
│  AI 101 - Economy                                       │
│  ⏱️ 2h 30min  📏 1,200 km                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚌 Bus                                     13:03       │
│  Airport → City Center                                  │
│  ⏱️ 35 min  📏 22 km                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚶 Walk                                    13:38       │
│  Bus Stop → Your Destination                            │
│  ⏱️ 5 min  📏 400 m                                     │
└─────────────────────────────────────────────────────────┘
```

### After Changing Time to 06:00
```
┌─────────────────────────────────────────────────────────┐
│  Your Door-to-Door Route          🕐 [06:00] ← Changed │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚶 Walk                                    06:00  ✓    │
│  Your Home → Metro Station                              │
│  ⏱️ 8 min  📏 650 m                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚇 Metro                                   06:08  ✓    │
│  Central Station → Airport Station                      │
│  Line 3 - Direction Airport                             │
│  ⏱️ 25 min  📏 18 km                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ✈️  Flight                                 08:33  ✓    │
│  Mumbai → Goa                                           │
│  AI 101 - Economy                                       │
│  ⏱️ 2h 30min  📏 1,200 km                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚌 Bus                                     11:03  ✓    │
│  Airport → City Center                                  │
│  ⏱️ 35 min  📏 22 km                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚶 Walk                                    11:38  ✓    │
│  Bus Stop → Your Destination                            │
│  ⏱️ 5 min  📏 400 m                                     │
└─────────────────────────────────────────────────────────┘
```

## Interaction Flow

### Trip Type Selection
```
User Journey:
1. Click "Dates" field
   ↓
2. See trip type selector (default: Round-trip)
   ↓
3. Click "One-way" if needed
   ↓
4. Calendar changes to single date mode
   ↓
5. Select date(s)
   ↓
6. Click "Apply"
   ↓
7. Dates saved, modal closes
```

### Time Update Flow
```
User Journey:
1. View route with default times
   ↓
2. Click time input (top right)
   ↓
3. Change time (e.g., 08:00 → 06:00)
   ↓
4. All segment times update instantly
   ↓
5. Review updated schedule
   ↓
6. Adjust again if needed
```

## Visual Indicators

### Trip Type Buttons
```
Active State:
┌──────────────┐
│ Round-trip   │  ← White background, shadow
│   (Active)   │
└──────────────┘

Inactive State:
┌──────────────┐
│  One-way     │  ← Gray text, no shadow
│ (Inactive)   │
└──────────────┘
```

### Time Updates
```
Before Change:
08:00  (normal text)

After Change:
06:00  ✓  (with checkmark indicator)
```

## Responsive Design

### Mobile View
```
Trip Type Selector:
┌─────────────────────┐
│  ┌────────────────┐ │
│  │   Round-trip   │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │    One-way     │ │
│  └────────────────┘ │
└─────────────────────┘

Time Input:
┌─────────────────────┐
│  Departure Time     │
│  ┌────────────────┐ │
│  │     08:00      │ │
│  └────────────────┘ │
└─────────────────────┘
```

### Desktop View
```
Trip Type Selector:
┌──────────────────────────────────┐
│  [Round-trip]    [One-way]       │
└──────────────────────────────────┘

Time Input:
┌──────────────────────────────────┐
│  Your Route    🕐 [08:00]        │
└──────────────────────────────────┘
```

## Color Scheme

### Trip Type Selector
- Active: White background (#FFFFFF), dark text (#111827)
- Inactive: Transparent, gray text (#6B7280)
- Hover: Light gray background (#F3F4F6)

### Time Updates
- Input: Border (#E5E7EB), focus ring (#3B82F6)
- Updated times: Green checkmark (#10B981)
- Segment cards: Hover effect (#F9FAFB)
