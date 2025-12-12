# Booking Feature

This directory contains all booking-related functionality for the Vagabond AI Navigator.

## Directory Structure

```
src/features/booking/
├── components/          # React components for booking UI
├── services/           # API services and external integrations
├── stores/             # Zustand state management stores
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── constants.ts        # Constants and configuration values
├── index.ts            # Barrel export for the feature
└── README.md           # This file
```

## Type Definitions

All booking-related TypeScript types are defined in `src/types/booking.ts` and exported through `src/types/index.ts`.

### Core Types

- **Hotel** - Extended hotel model with booking fields
- **RoomOption** - Room type details and availability
- **AvailabilityResponse** - Real-time availability data
- **PricingDetails** - Pricing breakdown with taxes and fees
- **GuestInfo** - Guest information for bookings
- **BookingRequest** - Booking submission payload
- **BookingConfirmation** - Confirmed booking details
- **CancellationPolicy** - Cancellation rules and refund policies

## Usage

Import booking functionality from the feature barrel export:

```typescript
import { 
  Hotel, 
  BookingRequest, 
  BookingConfirmation,
  CACHE_TTL,
  ERROR_MESSAGES 
} from '@/features/booking';
```

## Implementation Status

- [x] Project structure created
- [x] Core type definitions
- [x] Constants and configuration
- [ ] State management (Zustand stores)
- [ ] API services
- [ ] UI components
- [ ] Custom hooks
- [ ] Utility functions

## Next Steps

1. Implement booking state management (Task 2)
2. Create booking API service layer (Task 3)
3. Implement payment integration (Task 4)
4. Build UI components (Tasks 5-7)
5. Add booking history and management (Tasks 10-12)
