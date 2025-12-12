/**
 * Booking Store Unit Tests
 * Tests for booking state management actions and state updates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBookingStore } from '../bookingStore';
import type { Hotel, RoomOption, GuestInfo } from '@/types/booking';

// Mock hotel data
const mockHotel: Hotel = {
  id: 1,
  title: 'Test Hotel',
  location: 'Test City',
  price: 100,
  rating: 4.5,
  reviews: 100,
  image: '/test.jpg',
  amenities: ['WiFi', 'Pool'],
  tags: ['Beach', 'Luxury'],
  energy: 7,
  social: 8,
  budget: 6,
  coordinates: [0, 0],
  instantBooking: true,
  checkInTime: '15:00',
  checkOutTime: '11:00',
};

// Mock room data
const mockRoom: RoomOption = {
  id: 'room-1',
  name: 'Deluxe Room',
  description: 'A comfortable room',
  capacity: 2,
  bedType: 'King',
  size: 30,
  images: ['/room.jpg'],
  amenities: ['WiFi', 'TV'],
  basePrice: 100,
  available: 5,
  instantBooking: true,
};

// Mock guest info
const mockGuestInfo: Partial<GuestInfo> = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  country: 'US',
};

describe('Booking Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useBookingStore.getState();
    store.cancelCurrentBooking();
  });

  describe('startBooking', () => {
    it('should initialize a new booking with hotel', () => {
      const { startBooking, currentBooking } = useBookingStore.getState();
      
      startBooking(mockHotel);
      
      const state = useBookingStore.getState();
      expect(state.currentBooking).not.toBeNull();
      expect(state.currentBooking?.hotel).toEqual(mockHotel);
      expect(state.currentBooking?.step).toBe('dates');
      expect(state.error).toBeNull();
    });

    it('should reset previous booking when starting new one', () => {
      const { startBooking, setDates } = useBookingStore.getState();
      
      // Start first booking and set dates
      startBooking(mockHotel);
      setDates(new Date('2024-01-01'), new Date('2024-01-05'));
      
      // Start new booking
      startBooking({ ...mockHotel, id: 2 });
      
      const state = useBookingStore.getState();
      expect(state.currentBooking?.hotel.id).toBe(2);
      expect(state.currentBooking?.checkInDate).toBeNull();
    });
  });

  describe('updateBookingStep', () => {
    it('should update the current step', () => {
      const { startBooking, updateBookingStep } = useBookingStore.getState();
      
      startBooking(mockHotel);
      updateBookingStep('rooms');
      
      const state = useBookingStore.getState();
      expect(state.currentBooking?.step).toBe('rooms');
    });

    it('should not update step if no current booking', () => {
      const { updateBookingStep } = useBookingStore.getState();
      
      updateBookingStep('rooms');
      
      const state = useBookingStore.getState();
      expect(state.currentBooking).toBeNull();
    });
  });

  describe('setDates', () => {
    it('should set check-in and check-out dates', () => {
      const { startBooking, setDates } = useBookingStore.getState();
      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-05');
      
      startBooking(mockHotel);
      setDates(checkIn, checkOut);
      
      const state = useBookingStore.getState();
      expect(state.currentBooking?.checkInDate).toEqual(checkIn);
      expect(state.currentBooking?.checkOutDate).toEqual(checkOut);
    });

    it('should clear room selection and pricing when dates change', () => {
      const { startBooking, setDates, selectRoom } = useBookingStore.getState();
      
      startBooking(mockHotel);
      setDates(new Date('2024-01-01'), new Date('2024-01-05'));
      selectRoom(mockRoom);
      
      // Change dates
      setDates(new Date('2024-02-01'), new Date('2024-02-05'));
      
      const state = useBookingStore.getState();
      expect(state.currentBooking?.selectedRoom).toBeNull();
      expect(state.currentBooking?.pricing).toBeNull();
    });
  });

  describe('selectRoom', () => {
    it('should select a room', () => {
      const { startBooking, selectRoom } = useBookingStore.getState();
      
      startBooking(mockHotel);
      selectRoom(mockRoom);
      
      const state = useBookingStore.getState();
      expect(state.currentBooking?.selectedRoom).toEqual(mockRoom);
    });

    it('should replace previously selected room', () => {
      const { startBooking, selectRoom } = useBookingStore.getState();
      const anotherRoom = { ...mockRoom, id: 'room-2', name: 'Suite' };
      
      startBooking(mockHotel);
      selectRoom(mockRoom);
      selectRoom(anotherRoom);
      
      const state = useBookingStore.getState();
      expect(state.currentBooking?.selectedRoom?.id).toBe('room-2');
    });
  });

  describe('setGuestInfo', () => {
    it('should set guest information', () => {
      const { startBooking, setGuestInfo } = useBookingStore.getState();
      
      startBooking(mockHotel);
      setGuestInfo(mockGuestInfo);
      
      const state = useBookingStore.getState();
      expect(state.currentBooking?.guestInfo).toEqual(mockGuestInfo);
    });

    it('should merge guest information updates', () => {
      const { startBooking, setGuestInfo } = useBookingStore.getState();
      
      startBooking(mockHotel);
      setGuestInfo({ firstName: 'John' });
      setGuestInfo({ lastName: 'Doe' });
      
      const state = useBookingStore.getState();
      expect(state.currentBooking?.guestInfo.firstName).toBe('John');
      expect(state.currentBooking?.guestInfo.lastName).toBe('Doe');
    });
  });

  describe('cancelCurrentBooking', () => {
    it('should clear current booking', () => {
      const { startBooking, setDates, cancelCurrentBooking } = useBookingStore.getState();
      
      startBooking(mockHotel);
      setDates(new Date('2024-01-01'), new Date('2024-01-05'));
      cancelCurrentBooking();
      
      const state = useBookingStore.getState();
      expect(state.currentBooking).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error message', () => {
      const { setError } = useBookingStore.getState();
      
      setError('Test error');
      
      const state = useBookingStore.getState();
      expect(state.error).toBe('Test error');
    });

    it('should clear error message', () => {
      const { setError, clearError } = useBookingStore.getState();
      
      setError('Test error');
      clearError();
      
      const state = useBookingStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should set loading state', () => {
      const { setLoading } = useBookingStore.getState();
      
      setLoading(true);
      expect(useBookingStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useBookingStore.getState().isLoading).toBe(false);
    });
  });

  describe('addToHistory', () => {
    it('should add booking to history', () => {
      const { addToHistory } = useBookingStore.getState();
      const mockBooking = {
        bookingId: 'booking-1',
        referenceNumber: 'REF123',
        hotel: mockHotel,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-05',
        guestInfo: mockGuestInfo as GuestInfo,
        roomDetails: mockRoom,
        pricing: {
          baseRate: 100,
          numberOfNights: 4,
          subtotal: 400,
          taxes: [],
          fees: [],
          total: 400,
          currency: 'USD',
        },
        status: 'confirmed' as const,
        confirmationSentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addToHistory(mockBooking);
      
      const state = useBookingStore.getState();
      expect(state.bookingHistory).toHaveLength(1);
      expect(state.bookingHistory[0]).toEqual(mockBooking);
    });

    it('should add new bookings to the beginning of history', () => {
      const { addToHistory } = useBookingStore.getState();
      const booking1 = {
        bookingId: 'booking-1',
        referenceNumber: 'REF123',
        hotel: mockHotel,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-05',
        guestInfo: mockGuestInfo as GuestInfo,
        roomDetails: mockRoom,
        pricing: {
          baseRate: 100,
          numberOfNights: 4,
          subtotal: 400,
          taxes: [],
          fees: [],
          total: 400,
          currency: 'USD',
        },
        status: 'confirmed' as const,
        confirmationSentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const booking2 = { ...booking1, bookingId: 'booking-2' };
      
      addToHistory(booking1);
      addToHistory(booking2);
      
      const state = useBookingStore.getState();
      expect(state.bookingHistory[0].bookingId).toBe('booking-2');
      expect(state.bookingHistory[1].bookingId).toBe('booking-1');
    });
  });
});
