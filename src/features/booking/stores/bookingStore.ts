/**
 * Booking Store - Zustand state management for booking flow
 * Manages booking state, actions, and optimistic updates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Hotel,
  RoomOption,
  GuestInfo,
  BookingConfirmation,
  AvailabilityResponse,
  PricingDetails,
  BookingStep,
} from '@/types/booking';

// ============================================================================
// Store State Interface
// ============================================================================

interface CurrentBooking {
  hotel: Hotel;
  step: BookingStep;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  selectedRoom: RoomOption | null;
  guestInfo: Partial<GuestInfo>;
  availability: AvailabilityResponse | null;
  pricing: PricingDetails | null;
}

interface BookingState {
  // State
  currentBooking: CurrentBooking | null;
  bookingHistory: BookingConfirmation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  startBooking: (hotel: Hotel) => void;
  updateBookingStep: (step: BookingStep) => void;
  setDates: (checkIn: Date, checkOut: Date) => void;
  selectRoom: (room: RoomOption) => void;
  setGuestInfo: (info: Partial<GuestInfo>) => void;
  setAvailability: (availability: AvailabilityResponse) => void;
  setPricing: (pricing: PricingDetails) => void;
  submitBooking: (paymentMethodId: string) => Promise<void>;
  addToHistory: (booking: BookingConfirmation) => void;
  setBookingHistory: (bookings: BookingConfirmation[]) => void;
  updateBookingInHistory: (bookingId: string, updates: Partial<BookingConfirmation>) => void;
  cancelCurrentBooking: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  currentBooking: null,
  bookingHistory: [],
  isLoading: false,
  error: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useBookingStore = create<BookingState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Start a new booking flow
      startBooking: (hotel: Hotel) => {
        set(
          {
            currentBooking: {
              hotel,
              step: 'dates',
              checkInDate: null,
              checkOutDate: null,
              selectedRoom: null,
              guestInfo: {},
              availability: null,
              pricing: null,
            },
            error: null,
          },
          false,
          'startBooking'
        );
      },

      // Update the current step in booking flow
      updateBookingStep: (step: BookingStep) => {
        const { currentBooking } = get();
        if (!currentBooking) return;

        set(
          {
            currentBooking: {
              ...currentBooking,
              step,
            },
          },
          false,
          'updateBookingStep'
        );
      },

      // Set check-in and check-out dates
      setDates: (checkIn: Date, checkOut: Date) => {
        const { currentBooking } = get();
        if (!currentBooking) return;

        set(
          {
            currentBooking: {
              ...currentBooking,
              checkInDate: checkIn,
              checkOutDate: checkOut,
              // Clear room selection and pricing when dates change
              selectedRoom: null,
              pricing: null,
            },
          },
          false,
          'setDates'
        );
      },

      // Select a room option
      selectRoom: (room: RoomOption) => {
        const { currentBooking } = get();
        if (!currentBooking) return;

        set(
          {
            currentBooking: {
              ...currentBooking,
              selectedRoom: room,
            },
          },
          false,
          'selectRoom'
        );
      },

      // Update guest information
      setGuestInfo: (info: Partial<GuestInfo>) => {
        const { currentBooking } = get();
        if (!currentBooking) return;

        set(
          {
            currentBooking: {
              ...currentBooking,
              guestInfo: {
                ...currentBooking.guestInfo,
                ...info,
              },
            },
          },
          false,
          'setGuestInfo'
        );
      },

      // Set availability data
      setAvailability: (availability: AvailabilityResponse) => {
        const { currentBooking } = get();
        if (!currentBooking) return;

        set(
          {
            currentBooking: {
              ...currentBooking,
              availability,
            },
          },
          false,
          'setAvailability'
        );
      },

      // Set pricing data
      setPricing: (pricing: PricingDetails) => {
        const { currentBooking } = get();
        if (!currentBooking) return;

        set(
          {
            currentBooking: {
              ...currentBooking,
              pricing,
            },
          },
          false,
          'setPricing'
        );
      },

      // Submit booking (placeholder - actual implementation in API service)
      submitBooking: async (paymentMethodId: string) => {
        const { currentBooking } = get();
        if (!currentBooking) {
          throw new Error('No active booking');
        }

        // Validate required fields
        if (!currentBooking.checkInDate || !currentBooking.checkOutDate) {
          throw new Error('Check-in and check-out dates are required');
        }
        if (!currentBooking.selectedRoom) {
          throw new Error('Room selection is required');
        }
        if (!currentBooking.guestInfo.firstName || !currentBooking.guestInfo.email) {
          throw new Error('Guest information is incomplete');
        }

        // Set loading state
        set({ isLoading: true, error: null }, false, 'submitBooking:start');

        try {
          // This will be implemented in the API service layer (Task 3)
          // For now, we just update the step to processing
          set(
            {
              currentBooking: {
                ...currentBooking,
                step: 'processing',
              },
            },
            false,
            'submitBooking:processing'
          );

          // Actual API call will happen here
          // const booking = await bookingAPI.createBooking(...)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Booking submission failed';
          set(
            {
              isLoading: false,
              error: errorMessage,
            },
            false,
            'submitBooking:error'
          );
          throw error;
        } finally {
          set({ isLoading: false }, false, 'submitBooking:complete');
        }
      },

      // Add booking to history (optimistic update)
      addToHistory: (booking: BookingConfirmation) => {
        const { bookingHistory } = get();
        set(
          {
            bookingHistory: [booking, ...bookingHistory],
          },
          false,
          'addToHistory'
        );
      },

      // Set booking history
      setBookingHistory: (bookings: BookingConfirmation[]) => {
        set(
          {
            bookingHistory: bookings,
          },
          false,
          'setBookingHistory'
        );
      },

      // Update a specific booking in history
      updateBookingInHistory: (bookingId: string, updates: Partial<BookingConfirmation>) => {
        const { bookingHistory } = get();
        const updatedHistory = bookingHistory.map(booking =>
          booking.bookingId === bookingId ? { ...booking, ...updates } : booking
        );
        set(
          {
            bookingHistory: updatedHistory,
          },
          false,
          'updateBookingInHistory'
        );
      },

      // Cancel current booking and reset state
      cancelCurrentBooking: () => {
        set(
          {
            currentBooking: null,
            error: null,
          },
          false,
          'cancelCurrentBooking'
        );
      },

      // Set loading state
      setLoading: (isLoading: boolean) => {
        set({ isLoading }, false, 'setLoading');
      },

      // Set error message
      setError: (error: string | null) => {
        set({ error }, false, 'setError');
      },

      // Clear error message
      clearError: () => {
        set({ error: null }, false, 'clearError');
      },
    }),
    {
      name: 'booking-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectCurrentBooking = (state: BookingState) => state.currentBooking;
export const selectBookingHistory = (state: BookingState) => state.bookingHistory;
export const selectIsLoading = (state: BookingState) => state.isLoading;
export const selectError = (state: BookingState) => state.error;
export const selectCurrentStep = (state: BookingState) => state.currentBooking?.step;
export const selectSelectedRoom = (state: BookingState) => state.currentBooking?.selectedRoom;
export const selectGuestInfo = (state: BookingState) => state.currentBooking?.guestInfo;
export const selectPricing = (state: BookingState) => state.currentBooking?.pricing;
