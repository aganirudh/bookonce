# Flight Comparison UI Mockup

## Clickable Flight Segment

### Before Hover
```
┌─────────────────────────────────────────────────────┐
│  ✈️  Flight                      10:33    ₹27,500   │
│                                                     │
│  Mumbai → Goa                                       │
│  AI 101 - Economy • 5 passengers                    │
│                                                     │
│  ⏱️ 2h 30min    📏 1,200 km    👥 5 seats          │
└─────────────────────────────────────────────────────┘
```

### On Hover (Clickable State)
```
┌═════════════════════════════════════════════════════┐
║  ✈️  Flight  View Options →      10:33    ₹27,500  ║
║                                                     ║
║  Mumbai → Goa                                       ║
║  AI 101 - Economy • 5 passengers                    ║
║                                                     ║
║  ⏱️ 2h 30min    📏 1,200 km    👥 5 seats          ║
╚═════════════════════════════════════════════════════╝
   ↑ Border highlight + shadow + cursor pointer
```

## Flight Comparison Modal

### Full Modal View
```
┌──────────────────────────────────────────────────────────────┐
│  ✈️  Available Flights: Mumbai → Goa                    [X]  │
│  Compare prices from different airlines • 5 passengers       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🇮🇳  Air India              ⭐ 4.3 (2,345 reviews)   │ │
│  │      AI 100                                            │ │
│  │                                                        │ │
│  │  Departure      Duration        Arrival                │ │
│  │  10:33          2h 30min        13:03                  │ │
│  │  Mumbai         ✈️ Non-stop     Goa                    │ │
│  │                                                        │ │
│  │  [Economy] 📶 WiFi ☕ Meals                           │ │
│  │                                                        │ │
│  │                              Total for 5               │ │
│  │                              ₹27,500                   │ │
│  │                              ₹5,500/person             │ │
│  │                                                        │ │
│  │                    [Book on MakeMyTrip →]              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ✈️  IndiGo                  ⭐ 4.5 (3,892 reviews)   │ │
│  │      6E 101                                            │ │
│  │                                                        │ │
│  │  Departure      Duration        Arrival                │ │
│  │  11:03          2h 30min        13:33                  │ │
│  │  Mumbai         ✈️ Non-stop     Goa                    │ │
│  │                                                        │ │
│  │  [Business] 📶 WiFi 🧳 Extra Legroom                  │ │
│  │                                                        │ │
│  │                              Total for 5               │ │
│  │                              ₹32,500                   │ │
│  │                              ₹6,500/person             │ │
│  │                                                        │ │
│  │                    [Book on Cleartrip →]               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🌶️  SpiceJet                ⭐ 4.1 (1,567 reviews)   │ │
│  │      SG 102                                            │ │
│  │                                                        │ │
│  │  Departure      Duration        Arrival                │ │
│  │  11:33          2h 30min        14:03                  │ │
│  │  Mumbai         ✈️ 1 stop       Goa                    │ │
│  │                                                        │ │
│  │  [Economy] ☕ Meals                                    │ │
│  │                                                        │ │
│  │                              Total for 5               │ │
│  │                              ₹24,500                   │ │
│  │                              ₹4,900/person             │ │
│  │                                                        │ │
│  │                    [Book on Goibibo →]                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ... more flights ...                                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  💡 Tip: Prices may vary by booking site. We          │ │
│  │  recommend comparing across multiple platforms for     │ │
│  │  the best deal. Prices shown are estimates.            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Individual Flight Card Breakdown

### Card Structure
```
┌────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────┬─────────────────┐ │
│  │ LEFT SECTION                    │ RIGHT SECTION   │ │
│  │                                 │                 │ │
│  │ 🇮🇳  Air India  ⭐ 4.3 (2,345)  │  Total for 5    │ │
│  │     AI 100                      │  ₹27,500        │ │
│  │                                 │  ₹5,500/person  │ │
│  │ ┌─────┬─────────┬─────┐        │                 │ │
│  │ │10:33│ 2h 30min│13:03│        │  [Book Now →]   │ │
│  │ │Mumbai│ ✈️ Non │ Goa │        │                 │ │
│  │ └─────┴─────────┴─────┘        │                 │ │
│  │                                 │                 │ │
│  │ [Economy] 📶 WiFi ☕ Meals      │                 │ │
│  └─────────────────────────────────┴─────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Airline Header
```
┌──────────────────────────────────────────┐
│  🇮🇳  Air India        ⭐ 4.3 (2,345)    │
│      AI 100                              │
└──────────────────────────────────────────┘
     ↑        ↑              ↑      ↑
   Logo    Name          Rating  Reviews
```

### Flight Timeline
```
┌─────────────────────────────────────────┐
│  Departure    Duration      Arrival     │
│  ───────────────────────────────────    │
│    10:33      2h 30min       13:03      │
│   Mumbai    ✈️ Non-stop       Goa       │
└─────────────────────────────────────────┘
```

### Amenities Row
```
┌──────────────────────────────────────────┐
│  [Economy] 📶 WiFi ☕ Meals 🧳 Legroom   │
└──────────────────────────────────────────┘
    ↑         ↑      ↑         ↑
  Class     WiFi   Food    Extra Space
```

### Pricing Section
```
┌─────────────────┐
│  Total for 5    │
│  ₹27,500        │  ← Large, bold
│  ₹5,500/person  │  ← Small, muted
│                 │
│  [Book Now →]   │  ← CTA button
└─────────────────┘
```

## Mobile View

### Stacked Layout
```
┌─────────────────────────────┐
│  ✈️  Flights: Mumbai → Goa  │
│  5 passengers          [X]  │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │  🇮🇳 Air India        │  │
│  │  AI 100  ⭐ 4.3       │  │
│  │                       │  │
│  │  10:33 → 13:03        │  │
│  │  2h 30min • Non-stop  │  │
│  │                       │  │
│  │  [Economy] 📶 ☕      │  │
│  │                       │  │
│  │  ₹27,500 (5 pax)      │  │
│  │  ₹5,500/person        │  │
│  │                       │  │
│  │  [Book MakeMyTrip →]  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  ✈️  IndiGo           │  │
│  │  6E 101  ⭐ 4.5       │  │
│  │                       │  │
│  │  11:03 → 13:33        │  │
│  │  2h 30min • Non-stop  │  │
│  │                       │  │
│  │  [Business] 📶 🧳     │  │
│  │                       │  │
│  │  ₹32,500 (5 pax)      │  │
│  │  ₹6,500/person        │  │
│  │                       │  │
│  │  [Book Cleartrip →]   │  │
│  └───────────────────────┘  │
│                             │
│  ... more ...               │
└─────────────────────────────┘
```

## Interactive States

### Hover State (Desktop)
```
┌════════════════════════════════════════┐
║  🇮🇳  Air India    ⭐ 4.3 (2,345)     ║  ← Shadow + Border
║      AI 100                            ║
║  ... flight details ...                ║
║  [Book on MakeMyTrip →]                ║
╚════════════════════════════════════════╝
```

### Loading State
```
┌────────────────────────────────────────┐
│  ✈️  Loading flight options...         │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  ⏳ Searching airlines...         │ │
│  │  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 40%        │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Empty State
```
┌────────────────────────────────────────┐
│  ✈️  No flights found                  │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  😔 No flights available for      │ │
│  │  this route and date.             │ │
│  │                                   │ │
│  │  Try adjusting your dates or      │ │
│  │  check alternative airports.      │ │
│  │                                   │ │
│  │  [Modify Search]                  │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## Color Palette

### Primary Colors
- **Blue (#3B82F6)**: Prices, CTAs, links
- **Purple (#8B5CF6)**: Flight icons, accents
- **Green (#10B981)**: Ratings, success states
- **Yellow (#F59E0B)**: Star ratings

### Neutral Colors
- **Gray 900 (#111827)**: Primary text
- **Gray 600 (#4B5563)**: Secondary text
- **Gray 400 (#9CA3AF)**: Muted text
- **Gray 100 (#F3F4F6)**: Backgrounds

### Semantic Colors
- **Red (#EF4444)**: Errors, warnings
- **Orange (#F97316)**: Alerts, tips
- **Teal (#14B8A6)**: Info, highlights

## Typography

### Font Sizes
- **2xl (24px)**: Modal title
- **xl (20px)**: Price (total)
- **lg (18px)**: Airline name
- **base (16px)**: Body text
- **sm (14px)**: Details, labels
- **xs (12px)**: Metadata, tips

### Font Weights
- **Bold (700)**: Prices, titles
- **Semibold (600)**: Airline names, CTAs
- **Medium (500)**: Labels
- **Regular (400)**: Body text

## Spacing

### Card Padding
- **Large (24px)**: Modal content
- **Medium (16px)**: Card padding
- **Small (12px)**: Compact sections
- **XS (8px)**: Tight spacing

### Gaps
- **4 (16px)**: Between cards
- **3 (12px)**: Between sections
- **2 (8px)**: Between elements
- **1 (4px)**: Inline elements

## Animations

### Modal Entry
```
Fade in + Scale up
Duration: 200ms
Easing: ease-out
```

### Card Hover
```
Shadow increase + Border highlight
Duration: 150ms
Easing: ease-in-out
```

### Button Click
```
Scale down (0.95)
Duration: 100ms
Easing: ease-in
```

## Accessibility

### Focus States
```
┌────────────────────────────────────────┐
│  🇮🇳  Air India    ⭐ 4.3 (2,345)     │
│      AI 100                            │
│  ... flight details ...                │
│  ┌──────────────────────────────────┐ │
│  │ [Book on MakeMyTrip →]           │ │ ← Focus ring
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Screen Reader Labels
```html
<button aria-label="Book Air India flight AI 100 
  departing 10:33 arriving 13:03 for ₹27,500 
  total on MakeMyTrip">
  Book on MakeMyTrip →
</button>
```

### Keyboard Navigation
- **Tab**: Move between flights
- **Enter**: Open booking link
- **Escape**: Close modal
- **Arrow keys**: Navigate within card
