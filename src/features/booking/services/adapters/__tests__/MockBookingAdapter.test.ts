/**
 * Mock Booking Adapter Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockBookingAdapter } from '../MockBookingAdapter';
import type { BookingRequest, Hotel } from '@/types/booking';

describe('MockBookingAdapter', () => {
  let adapter: MockBookingAdapter;

  beforeEach(() => {
    adapter = new MockBookingAdapter();
    adapter.clearBookings();
  });

  describe('supportsHotel', () => {
    it('should support all hotels', () => {
      const hotel: Hotel = {
        id: 1,
        title: 'Test Hotel',
        location: 'Test City',
        price: 100,
        rating: 4.5,
        reviews: 100,
        image: '/test.jpg',
        amenities: [],
        tags: [],
        energy: 50,
        social: 50,
        budget: 50,
        coordinates: [0, 0],
      };

      expect(adapter.supportsHotel(hotel)).toBe(true);
    });
  });

  describe('checkAvailability', () => {
    it('should return availability with rooms', async () => {
      const result = await adapter.checkAvailability({
        hotelId: 1,
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
      });

      expect(result.hotelId).toBe(1);
      expect(result.available).toBe(true);
      expect(result.rooms).toBeInstanceOf(Array);
      expect(result.rooms.length).toBeGreaterThan(0);
      expect(result.cachedAt).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it('should return different room types', async () => {
      const result = await adapter.checkAvailability({
        hotelId: 1,
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
      });

      const roomNames = result.rooms.map(r => r.name);
      expect(roomNames).toContain('Standard Room');
      expect(roomNames).toContain('Deluxe Room');
      expect(roomNames).toContain('Suite');
    });

    it('should set instant booking on rooms based on hotel capability', async () => {
      const result = await adapter.checkAvailability({
        hotelId: 1,
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
      });

      // Mock adapter returns hotels with instantBooking: true
      result.rooms.forEach(room => {
        expect(room.instantBooking).toBe(true);
      });
    });
  });

  describe('getHotelDetails', () => {
    it('should return hotel details', async () => {
      const hotel = await adapter.getHotelDetails('123');

      expect(hotel.id).toBe(123);
      expect(hotel.providerId).toBe('mock-provider');
      expect(hotel.instantBooking).toBe(true);
      expect(hotel.cancellationPolicy).toBeDefined();
    });
  });

  describe('createReservation', () => {
    it('should create a booking', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      const booking = await adapter.createReservation(request);

      expect(booking.bookingId).toBeDefined();
      expect(booking.referenceNumber).toBeDefined();
      expect(booking.status).toBe('confirmed');
      expect(booking.guestInfo).toEqual(request.guestInfo);
      expect(booking.pricing.numberOfNights).toBe(4);
    });

    it('should confirm instant booking within 30 seconds', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      const startTime = Date.now();
      const booking = await adapter.createReservation(request);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Instant booking should complete within 30 seconds (we simulate 1-3 seconds)
      expect(duration).toBeLessThan(30000);
      expect(booking.hotel.instantBooking).toBe(true);
      expect(booking.roomDetails.instantBooking).toBe(true);
    });

    it('should set instant booking flag on room details based on hotel', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      const booking = await adapter.createReservation(request);

      // Mock adapter returns hotels with instantBooking: true
      expect(booking.hotel.instantBooking).toBe(true);
      expect(booking.roomDetails.instantBooking).toBe(true);
    });

    it('should calculate pricing correctly', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      const booking = await adapter.createReservation(request);
      const pricing = booking.pricing;

      expect(pricing.numberOfNights).toBe(4);
      expect(pricing.subtotal).toBe(pricing.baseRate * pricing.numberOfNights);
      expect(pricing.total).toBeGreaterThan(pricing.subtotal);
      expect(pricing.taxes.length).toBeGreaterThan(0);
      expect(pricing.fees.length).toBeGreaterThan(0);
    });

    it('should store booking', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      await adapter.createReservation(request);
      const bookings = adapter.getAllBookings();

      expect(bookings.length).toBe(1);
    });
  });

  describe('modifyReservation', () => {
    it('should modify existing booking', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      const booking = await adapter.createReservation(request);

      const modified = await adapter.modifyReservation(booking.bookingId, {
        checkInDate: '2024-06-02',
        checkOutDate: '2024-06-06',
      });

      expect(modified.checkInDate).toBe('2024-06-02');
      expect(modified.checkOutDate).toBe('2024-06-06');
      expect(modified.bookingId).toBe(booking.bookingId);
    });

    it('should throw error for non-existent booking', async () => {
      await expect(adapter.modifyReservation('non-existent', {})).rejects.toThrow('not found');
    });
  });

  describe('cancelReservation', () => {
    it('should cancel booking and calculate refund', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-12-01',
        checkOutDate: '2024-12-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      const booking = await adapter.createReservation(request);
      const cancellation = await adapter.cancelReservation(booking.bookingId);

      expect(cancellation.bookingId).toBe(booking.bookingId);
      expect(cancellation.refundAmount).toBeGreaterThanOrEqual(0);
      expect(cancellation.refundStatus).toBe('pending');
      expect(cancellation.cancelledAt).toBeDefined();
    });

    it('should update booking status to cancelled', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-12-01',
        checkOutDate: '2024-12-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      const booking = await adapter.createReservation(request);
      await adapter.cancelReservation(booking.bookingId);

      const bookings = adapter.getAllBookings();
      const cancelledBooking = bookings.find(b => b.bookingId === booking.bookingId);

      expect(cancelledBooking?.status).toBe('cancelled');
    });

    it('should throw error for non-existent booking', async () => {
      await expect(adapter.cancelReservation('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('clearBookings', () => {
    it('should clear all bookings', async () => {
      const request: BookingRequest = {
        hotelId: 1,
        roomId: 'room-1',
        checkInDate: '2024-06-01',
        checkOutDate: '2024-06-05',
        guestInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          country: 'US',
        },
        paymentMethodId: 'pm_test',
      };

      await adapter.createReservation(request);
      expect(adapter.getAllBookings().length).toBe(1);

      adapter.clearBookings();
      expect(adapter.getAllBookings().length).toBe(0);
    });
  });
});
