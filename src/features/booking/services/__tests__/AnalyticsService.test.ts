/**
 * Analytics Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { analyticsService } from '../AnalyticsService';

describe('AnalyticsService', () => {
  beforeEach(() => {
    analyticsService.clearEvents();
    analyticsService.setEnabled(true);
  });

  describe('Booking Funnel Tracking', () => {
    it('should track booking started event', () => {
      analyticsService.trackBookingStarted({
        hotelId: 1,
        source: 'hotel_card',
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Booking Started');
      expect(events[0].data).toEqual({
        hotelId: 1,
        source: 'hotel_card',
      });
    });

    it('should track dates selected event', () => {
      analyticsService.trackDatesSelected({
        checkIn: '2024-12-20',
        checkOut: '2024-12-25',
        nights: 5,
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Dates Selected');
      expect(events[0].data).toEqual({
        checkIn: '2024-12-20',
        checkOut: '2024-12-25',
        nights: 5,
      });
    });

    it('should track room selected event', () => {
      analyticsService.trackRoomSelected({
        roomId: 'deluxe-suite',
        price: 250,
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Room Selected');
      expect(events[0].data).toEqual({
        roomId: 'deluxe-suite',
        price: 250,
      });
    });

    it('should track guest info completed event', () => {
      analyticsService.trackGuestInfoCompleted({
        hasAccount: true,
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Guest Info Completed');
      expect(events[0].data).toEqual({
        hasAccount: true,
      });
    });

    it('should track payment submitted event', () => {
      analyticsService.trackPaymentSubmitted({
        paymentMethod: 'card',
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Payment Submitted');
      expect(events[0].data).toEqual({
        paymentMethod: 'card',
      });
    });

    it('should track booking completed event', () => {
      analyticsService.trackBookingCompleted({
        bookingId: 'BK123456',
        totalPrice: 1250,
        currency: 'USD',
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Booking Completed');
      expect(events[0].data).toEqual({
        bookingId: 'BK123456',
        totalPrice: 1250,
        currency: 'USD',
      });
    });

    it('should track complete booking funnel', () => {
      // Simulate complete booking flow
      analyticsService.trackBookingStarted({ hotelId: 1, source: 'hotel_card' });
      analyticsService.trackDatesSelected({
        checkIn: '2024-12-20',
        checkOut: '2024-12-25',
        nights: 5,
      });
      analyticsService.trackRoomSelected({ roomId: 'deluxe-suite', price: 250 });
      analyticsService.trackGuestInfoCompleted({ hasAccount: false });
      analyticsService.trackPaymentSubmitted({ paymentMethod: 'card' });
      analyticsService.trackBookingCompleted({
        bookingId: 'BK123456',
        totalPrice: 1250,
        currency: 'USD',
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(6);
      expect(events.map(e => e.event)).toEqual([
        'Booking Started',
        'Dates Selected',
        'Room Selected',
        'Guest Info Completed',
        'Payment Submitted',
        'Booking Completed',
      ]);
    });
  });

  describe('Error Tracking', () => {
    it('should track booking error event', () => {
      analyticsService.trackBookingError({
        step: 'payment',
        errorType: 'payment_failed',
        errorMessage: 'Card declined',
        component: 'BookingModal',
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Booking Error');
      expect(events[0].data).toEqual({
        step: 'payment',
        errorType: 'payment_failed',
        errorMessage: 'Card declined',
        component: 'BookingModal',
      });
    });

    it('should track multiple error events', () => {
      analyticsService.trackBookingError({
        step: 'dates',
        errorType: 'availability_check_failed',
        errorMessage: 'API timeout',
        component: 'DateSelector',
      });

      analyticsService.trackBookingError({
        step: 'payment',
        errorType: 'payment_failed',
        errorMessage: 'Card declined',
        component: 'PaymentForm',
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].data.step).toBe('dates');
      expect(events[1].data.step).toBe('payment');
    });
  });

  describe('Performance Tracking', () => {
    it('should track API response time', () => {
      analyticsService.trackApiResponseTime('/api/availability', 1500);

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Performance: API Response Time');
      expect(events[0].data).toEqual({
        endpoint: '/api/availability',
        duration: 1500,
      });
    });

    it('should track cache hit rate', () => {
      analyticsService.trackCacheHitRate('availability', 75.5);

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Performance: Cache Hit Rate');
      expect(events[0].data).toEqual({
        operation: 'availability',
        cacheHitRate: 75.5,
      });
    });

    it('should track booking completion time', () => {
      analyticsService.trackBookingCompletionTime(8500);

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Performance: Booking Completion Time');
      expect(events[0].data).toEqual({
        bookingCompletionTime: 8500,
      });
    });

    it('should track payment success', () => {
      analyticsService.trackPaymentSuccess(true);

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Performance: Payment Success');
      expect(events[0].data).toEqual({
        success: true,
      });
    });
  });

  describe('Service Configuration', () => {
    it('should not track events when disabled', () => {
      analyticsService.setEnabled(false);
      analyticsService.trackBookingStarted({ hotelId: 1, source: 'hotel_card' });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(0);
    });

    it('should resume tracking when re-enabled', () => {
      analyticsService.setEnabled(false);
      analyticsService.trackBookingStarted({ hotelId: 1, source: 'hotel_card' });

      analyticsService.setEnabled(true);
      analyticsService.trackDatesSelected({
        checkIn: '2024-12-20',
        checkOut: '2024-12-25',
        nights: 5,
      });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Dates Selected');
    });

    it('should include timestamp with each event', () => {
      const beforeTime = Date.now();
      analyticsService.trackBookingStarted({ hotelId: 1, source: 'hotel_card' });
      const afterTime = Date.now();

      const events = analyticsService.getEvents();
      expect(events[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(events[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should clear all events', () => {
      analyticsService.trackBookingStarted({ hotelId: 1, source: 'hotel_card' });
      analyticsService.trackDatesSelected({
        checkIn: '2024-12-20',
        checkOut: '2024-12-25',
        nights: 5,
      });

      expect(analyticsService.getEvents()).toHaveLength(2);

      analyticsService.clearEvents();
      expect(analyticsService.getEvents()).toHaveLength(0);
    });
  });

  describe('Generic Event Tracking', () => {
    it('should track custom events', () => {
      analyticsService.track('Custom Event', { customData: 'test' });

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Custom Event');
      expect(events[0].data).toEqual({ customData: 'test' });
    });

    it('should track events without data', () => {
      analyticsService.track('Simple Event');

      const events = analyticsService.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('Simple Event');
      expect(events[0].data).toEqual({});
    });
  });
});
