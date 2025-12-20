# Booking Stores

State management for the booking feature using Zustand.

## Stores

### bookingStore.ts

Manages the booking flow state and actions.

**State:**

- `currentBooking` - Active booking in progress
- `bookingHistory` - List of completed bookings
- `isLoading` - Loading state for async operations
- `error` - Error message if any

**Actions:**

- `startBooking(hotel)` - Initialize a new booking
- `updateBookingStep(step)` - Navigate between booking steps
- `setDates(checkIn, checkOut)` - Set booking dates
- `selectRoom(room)` - Select a room option
- `setGuestInfo(info)` - Update guest information
- `setAvailability(availability)` - Store availability data
- `setPricing(pricing)` - Store pricing data
- `submitBooking(paymentMethodId)` - Submit booking (placeholder)
- `addToHistory(booking)` - Add booking to history
- `cancelCurrentBooking()` - Cancel and reset current booking
- `setLoading(isLoading)` - Set loading state
- `setError(error)` - Set error message
- `clearError()` - Clear error message

**Selectors:**

- `selectCurrentBooking` - Get current booking
- `selectBookingHistory` - Get booking history
- `selectIsLoading` - Get loading state
- `selectError` - Get error message
- `selectCurrentStep` - Get current booking step
- `selectSelectedRoom` - Get selected room
- `selectGuestInfo` - Get guest information
- `selectPricing` - Get pricing details

### cacheStore.ts

Manages caching for availability and pricing data with TTL.

**State:**

- `availabilityCache` - Map of cached availability responses
- `pricingCache` - Map of cached pricing details

**Actions:**

- `setAvailability(key, data, ttl?)` - Cache availability data
- `getAvailability(key)` - Retrieve cached availability
- `setPricing(key, data, ttl?)` - Cache pricing data
- `getPricing(key)` - Retrieve cached pricing
- `invalidate(key)` - Remove specific cache entry
- `invalidateAll()` - Clear all caches
- `invalidateAvailability()` - Clear availability cache
- `invalidatePricing()` - Clear pricing cache
- `cleanExpired()` - Remove expired entries

**Utilities:**

- `getAvailabilityCacheKey(hotelId, checkIn, checkOut)` - Generate cache key
- `getPricingCacheKey(hotelId, roomId, checkIn, checkOut)` - Generate cache key
- `getCacheStats()` - Get cache statistics

## Usage

```typescript
import { useBookingStore, useCacheStore } from '@/features/booking';

// In a component
function BookingComponent() {
  const { startBooking, currentBooking } = useBookingStore();
  const { getAvailability, setAvailability } = useCacheStore();

  // Start booking
  const handleBookNow = (hotel: Hotel) => {
    startBooking(hotel);
  };

  // Check cache before API call
  const checkAvailability = async (hotelId, checkIn, checkOut) => {
    const key = getAvailabilityCacheKey(hotelId, checkIn, checkOut);
    const cached = getAvailability(key);

    if (cached) {
      return cached;
    }

    // Fetch from API and cache
    const data = await api.checkAvailability(...);
    setAvailability(key, data);
    return data;
  };
}
```

## Testing

Tests are located in `__tests__/` directory:

- `bookingStore.test.ts` - Tests for booking store actions and state
- `cacheStore.test.ts` - Tests for cache TTL and invalidation

Run tests:

```bash
npm test
```

## Cache Configuration

Cache TTL values are defined in `../constants.ts`:

- Availability: 5 minutes
- Pricing: 5 minutes
- Booking details: 1 hour
- User bookings: 10 minutes
