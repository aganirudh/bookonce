# Booking Components Documentation

## Overview

This document provides detailed information about the booking system components, their props, usage, and examples.

## Table of Contents

1. [BookingModal](#bookingmodal)
2. [DateSelector](#dateselector)
3. [RoomSelector](#roomselector)
4. [GuestInfoForm](#guestinfoform)
5. [PaymentForm](#paymentform)
6. [PricingSummary](#pricingsummary)
7. [BookingCard](#bookingcard)
8. [BookingDetails](#bookingdetails)
9. [ModifyBooking](#modifybooking)
10. [CancelBooking](#cancelbooking)

---

## BookingModal

The main booking modal component that orchestrates the entire booking flow.

### Props

```typescript
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  initialDates?: {
    checkIn: Date;
    checkOut: Date;
  };
}
```

### Usage

```tsx
import { BookingModal } from '@/features/booking/components/BookingModal';

function HotelPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Book Now
      </button>
      
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hotel={selectedHotel}
        initialDates={{
          checkIn: new Date('2024-12-20'),
          checkOut: new Date('2024-12-25'),
        }}
      />
    </>
  );
}
```

### Features

- Multi-step booking process
- Real-time availability checking
- Price calculation
- Payment processing
- Instant booking support
- Accessibility compliant

---

## DateSelector

Component for selecting check-in and check-out dates.

### Props

```typescript
interface DateSelectorProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}
```

### Usage

```tsx
import { DateSelector } from '@/features/booking/components/DateSelector';

function BookingForm() {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  
  return (
    <DateSelector
      checkIn={checkIn}
      checkOut={checkOut}
      onCheckInChange={setCheckIn}
      onCheckOutChange={setCheckOut}
      minDate={new Date()}
      disabledDates={unavailableDates}
    />
  );
}
```

### Features

- Calendar view
- Date range selection
- Disabled dates support
- Min/max date constraints
- Keyboard navigation
- Mobile-friendly

---

## RoomSelector

Component for selecting room type and number of guests.

### Props

```typescript
interface RoomSelectorProps {
  hotelId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  selectedRoom: string | null;
  onGuestsChange: (guests: number) => void;
  onRoomSelect: (roomType: string) => void;
}
```

### Usage

```tsx
import { RoomSelector } from '@/features/booking/components/RoomSelector';

function RoomSelection() {
  const [guests, setGuests] = useState(2);
  const [room, setRoom] = useState<string | null>(null);
  
  return (
    <RoomSelector
      hotelId="hotel-123"
      checkIn={checkInDate}
      checkOut={checkOutDate}
      guests={guests}
      selectedRoom={room}
      onGuestsChange={setGuests}
      onRoomSelect={setRoom}
    />
  );
}
```

### Features

- Real-time availability
- Room type comparison
- Guest count selector
- Price per night display
- Amenities list

---

## GuestInfoForm

Form component for collecting guest information.

### Props

```typescript
interface GuestInfoFormProps {
  onSubmit: (data: GuestInfo) => void;
  initialData?: Partial<GuestInfo>;
  isLoading?: boolean;
}

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}
```

### Usage

```tsx
import { GuestInfoForm } from '@/features/booking/components/GuestInfoForm';

function GuestInformation() {
  const handleSubmit = (data: GuestInfo) => {
    console.log('Guest info:', data);
  };
  
  return (
    <GuestInfoForm
      onSubmit={handleSubmit}
      initialData={{
        email: user?.email,
      }}
    />
  );
}
```

### Features

- Form validation
- Auto-fill from user profile
- Phone number formatting
- Email validation
- Special requests field

---

## PaymentForm

Secure payment form component integrated with Stripe.

### Props

```typescript
interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntent: string) => void;
  onError: (error: Error) => void;
  saveCard?: boolean;
}
```

### Usage

```tsx
import { PaymentForm } from '@/features/booking/components/PaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');

function Payment() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        amount={825.00}
        onSuccess={(paymentIntent) => {
          console.log('Payment successful:', paymentIntent);
        }}
        onError={(error) => {
          console.error('Payment failed:', error);
        }}
        saveCard={true}
      />
    </Elements>
  );
}
```

### Features

- Stripe integration
- Card validation
- Save card option
- 3D Secure support
- Error handling
- PCI compliant

---

## PricingSummary

Component displaying booking price breakdown.

### Props

```typescript
interface PricingSummaryProps {
  basePrice: number;
  nights: number;
  taxes: number;
  fees: number;
  discount?: number;
  currency?: string;
}
```

### Usage

```tsx
import { PricingSummary } from '@/features/booking/components/PricingSummary';

function BookingSummary() {
  return (
    <PricingSummary
      basePrice={150}
      nights={5}
      taxes={75}
      fees={25}
      discount={50}
      currency="USD"
    />
  );
}
```

### Features

- Itemized breakdown
- Tax calculation
- Discount display
- Total calculation
- Currency formatting

---

## BookingCard

Card component for displaying booking in lists.

### Props

```typescript
interface BookingCardProps {
  booking: Booking;
  onView: (bookingId: string) => void;
  onModify?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
}
```

### Usage

```tsx
import { BookingCard } from '@/features/booking/components/BookingCard';

function BookingList() {
  return (
    <div>
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onView={(id) => navigate(`/bookings/${id}`)}
          onModify={(id) => setModifyingBooking(id)}
          onCancel={(id) => setCancellingBooking(id)}
        />
      ))}
    </div>
  );
}
```

### Features

- Booking status badge
- Hotel thumbnail
- Date display
- Quick actions
- Responsive design

---

## BookingDetails

Detailed view of a single booking.

### Props

```typescript
interface BookingDetailsProps {
  bookingId: string;
  showActions?: boolean;
}
```

### Usage

```tsx
import { BookingDetails } from '@/features/booking/components/BookingDetails';

function BookingPage() {
  const { bookingId } = useParams();
  
  return (
    <BookingDetails
      bookingId={bookingId}
      showActions={true}
    />
  );
}
```

### Features

- Full booking information
- QR code for check-in
- Download PDF
- Add to calendar
- Share booking
- Modification history

---

## ModifyBooking

Component for modifying existing bookings.

### Props

```typescript
interface ModifyBookingProps {
  booking: Booking;
  onSuccess: (updatedBooking: Booking) => void;
  onCancel: () => void;
}
```

### Usage

```tsx
import { ModifyBooking } from '@/features/booking/components/ModifyBooking';

function ModifyBookingPage() {
  return (
    <ModifyBooking
      booking={currentBooking}
      onSuccess={(updated) => {
        console.log('Booking modified:', updated);
        navigate('/bookings');
      }}
      onCancel={() => navigate('/bookings')}
    />
  );
}
```

### Features

- Date modification
- Guest count changes
- Room upgrade/downgrade
- Price difference calculation
- Availability checking

---

## CancelBooking

Component for cancelling bookings with refund calculation.

### Props

```typescript
interface CancelBookingProps {
  booking: Booking;
  onSuccess: (cancellation: CancellationResult) => void;
  onCancel: () => void;
}
```

### Usage

```tsx
import { CancelBooking } from '@/features/booking/components/CancelBooking';

function CancelBookingDialog() {
  return (
    <CancelBooking
      booking={bookingToCancel}
      onSuccess={(result) => {
        console.log('Refund amount:', result.refundAmount);
        navigate('/bookings');
      }}
      onCancel={() => setShowDialog(false)}
    />
  );
}
```

### Features

- Cancellation reason selection
- Refund calculation
- Policy display
- Confirmation dialog
- Refund timeline

---

## Hooks

### useAvailability

Hook for checking room availability.

```typescript
import { useAvailability } from '@/features/booking/hooks/useAvailability';

function AvailabilityChecker() {
  const { availability, isLoading, error } = useAvailability({
    hotelId: 'hotel-123',
    checkIn: new Date('2024-12-20'),
    checkOut: new Date('2024-12-25'),
    guests: 2,
  });
  
  if (isLoading) return <div>Checking availability...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Available rooms: {availability.rooms.length}</div>;
}
```

### useKeyboardNavigation

Hook for keyboard navigation support.

```typescript
import { useKeyboardNavigation } from '@/features/booking/hooks/useKeyboardNavigation';

function BookingModal() {
  const { focusNext, focusPrevious, focusFirst } = useKeyboardNavigation({
    containerRef: modalRef,
    onEscape: closeModal,
  });
  
  return (
    <div ref={modalRef}>
      {/* Modal content */}
    </div>
  );
}
```

---

## Stores

### useBookingStore

Zustand store for booking state management.

```typescript
import { useBookingStore } from '@/features/booking/stores/bookingStore';

function BookingComponent() {
  const {
    currentBooking,
    bookingHistory,
    startBooking,
    completeBooking,
    cancelBooking,
  } = useBookingStore();
  
  // Use store methods
}
```

---

## Styling

All components use Tailwind CSS and support:
- Dark mode
- Responsive design
- Custom themes
- Accessibility features

### Custom Styling

```tsx
<BookingModal
  className="custom-modal"
  // Component will merge custom classes
/>
```

---

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { BookingCard } from '@/features/booking/components/BookingCard';

test('renders booking card', () => {
  render(<BookingCard booking={mockBooking} onView={jest.fn()} />);
  expect(screen.getByText(mockBooking.hotelName)).toBeInTheDocument();
});
```

### Integration Tests

```typescript
import { renderWithProviders } from '@/test-utils';
import { BookingModal } from '@/features/booking/components/BookingModal';

test('completes booking flow', async () => {
  const { user } = renderWithProviders(
    <BookingModal isOpen={true} onClose={jest.fn()} hotel={mockHotel} />
  );
  
  // Test booking flow
});
```

---

## Best Practices

1. **Always wrap payment components in Stripe Elements provider**
2. **Use TypeScript for type safety**
3. **Handle loading and error states**
4. **Implement proper accessibility**
5. **Test with real user interactions**
6. **Follow responsive design patterns**

---

## Support

For component-specific questions:
- Check the source code in `src/features/booking/components/`
- Review tests in `src/features/booking/components/__tests__/`
- Contact: dev-support@vagabond.com
