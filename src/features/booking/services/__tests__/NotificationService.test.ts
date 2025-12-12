/**
 * NotificationService Tests
 * Tests for email and push notification functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService } from '../NotificationService';
import type { BookingConfirmation, Hotel } from '@/types/booking';
import * as notificationPreferences from '../../utils/notificationPreferences';

// Mock notification preferences
vi.mock('../../utils/notificationPreferences', () => ({
  isEmailNotificationEnabled: vi.fn(),
  isPushNotificationEnabled: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('NotificationService', () => {
  let service: NotificationService;
  let mockBooking: BookingConfirmation;

  beforeEach(() => {
    service = new NotificationService('/api/notifications');
    
    // Reset mocks
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
    });

    // Default: all notifications enabled
    vi.mocked(notificationPreferences.isEmailNotificationEnabled).mockReturnValue(true);
    vi.mocked(notificationPreferences.isPushNotificationEnabled).mockReturnValue(true);

    // Mock booking data
    mockBooking = {
      bookingId: 'booking-123',
      referenceNumber: 'REF-ABC123',
      hotel: {
        id: 1,
        title: 'Test Hotel',
        location: 'Test City',
        price: 200,
        rating: 4.5,
        reviews: 100,
        image: '/test.jpg',
        amenities: ['WiFi'],
        tags: ['beach'],
        energy: 5,
        social: 5,
        budget: 5,
        coordinates: [0, 0],
        checkInTime: '3:00 PM',
        checkOutTime: '11:00 AM',
      },
      checkInDate: '2024-12-20',
      checkOutDate: '2024-12-25',
      guestInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        country: 'US',
      },
      roomDetails: {
        id: 'room-1',
        name: 'Deluxe Room',
        description: 'A comfortable room',
        capacity: 2,
        bedType: 'King',
        size: 30,
        images: [],
        amenities: [],
        basePrice: 200,
        available: 5,
        instantBooking: true,
      },
      pricing: {
        baseRate: 200,
        numberOfNights: 5,
        subtotal: 1000,
        taxes: [{ name: 'VAT', amount: 100 }],
        fees: [{ name: 'Service Fee', amount: 50, description: 'Service' }],
        total: 1150,
        currency: 'USD',
      },
      status: 'confirmed',
      confirmationSentAt: '2024-12-01T10:00:00Z',
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation email when enabled', async () => {
      await service.sendBookingConfirmation(mockBooking, 'test@example.com');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/email',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.to).toBe('test@example.com');
      expect(body.subject).toContain('Booking Confirmed');
      expect(body.subject).toContain('Test Hotel');
    });

    it('should not send email when notifications are disabled', async () => {
      vi.mocked(notificationPreferences.isEmailNotificationEnabled).mockReturnValue(false);
      vi.mocked(notificationPreferences.isPushNotificationEnabled).mockReturnValue(false);

      await service.sendBookingConfirmation(mockBooking, 'test@example.com');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should send push notification when enabled', async () => {
      await service.sendBookingConfirmation(mockBooking, 'test@example.com');

      // Should call fetch twice: once for email, once for push
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      const pushCall = (global.fetch as any).mock.calls[1];
      expect(pushCall[0]).toBe('/api/notifications/push');
      
      const pushBody = JSON.parse(pushCall[1].body);
      expect(pushBody.title).toBe('Booking Confirmed');
      expect(pushBody.body).toContain('Test Hotel');
    });

    it('should throw error when email sending fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(
        service.sendBookingConfirmation(mockBooking, 'test@example.com')
      ).rejects.toThrow('Failed to send confirmation email');
    });
  });

  describe('sendModificationConfirmation', () => {
    it('should send modification confirmation email when enabled', async () => {
      await service.sendModificationConfirmation(mockBooking, 'test@example.com');

      expect(global.fetch).toHaveBeenCalled();
      
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.subject).toContain('Booking Modified');
    });

    it('should not send email when notifications are disabled', async () => {
      vi.mocked(notificationPreferences.isEmailNotificationEnabled).mockReturnValue(false);
      vi.mocked(notificationPreferences.isPushNotificationEnabled).mockReturnValue(false);

      await service.sendModificationConfirmation(mockBooking, 'test@example.com');

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendCancellationConfirmation', () => {
    it('should send cancellation confirmation email with refund amount', async () => {
      const refundAmount = 1000;
      
      await service.sendCancellationConfirmation(mockBooking, refundAmount, 'test@example.com');

      expect(global.fetch).toHaveBeenCalled();
      
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.subject).toContain('Booking Cancelled');
      expect(body.html).toContain(refundAmount.toFixed(2));
    });

    it('should not send email when notifications are disabled', async () => {
      vi.mocked(notificationPreferences.isEmailNotificationEnabled).mockReturnValue(false);
      vi.mocked(notificationPreferences.isPushNotificationEnabled).mockReturnValue(false);

      await service.sendCancellationConfirmation(mockBooking, 1000, 'test@example.com');

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendCheckInReminder', () => {
    it('should send check-in reminder email when enabled', async () => {
      await service.sendCheckInReminder(mockBooking, 'test@example.com');

      expect(global.fetch).toHaveBeenCalled();
      
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.subject).toContain('Check-in Reminder');
      expect(body.subject).toContain('Tomorrow');
    });

    it('should not send email when notifications are disabled', async () => {
      vi.mocked(notificationPreferences.isEmailNotificationEnabled).mockReturnValue(false);
      vi.mocked(notificationPreferences.isPushNotificationEnabled).mockReturnValue(false);

      await service.sendCheckInReminder(mockBooking, 'test@example.com');

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendBookingStatusChange', () => {
    it('should send status change notification when enabled', async () => {
      await service.sendBookingStatusChange(
        mockBooking,
        'pending',
        'confirmed',
        'test@example.com'
      );

      expect(global.fetch).toHaveBeenCalled();
      
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.subject).toContain('Booking Status Update');
      expect(body.html).toContain('pending');
      expect(body.html).toContain('confirmed');
    });

    it('should not send notification when disabled', async () => {
      vi.mocked(notificationPreferences.isEmailNotificationEnabled).mockReturnValue(false);
      vi.mocked(notificationPreferences.isPushNotificationEnabled).mockReturnValue(false);

      await service.sendBookingStatusChange(
        mockBooking,
        'pending',
        'confirmed',
        'test@example.com'
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendHotelCancellation', () => {
    it('should send hotel cancellation notification with alternatives', async () => {
      const alternativeHotels: Hotel[] = [
        {
          id: 2,
          title: 'Alternative Hotel',
          location: 'Test City',
          price: 180,
          rating: 4.3,
          reviews: 80,
          image: '/alt.jpg',
          amenities: ['WiFi'],
          tags: ['beach'],
          energy: 5,
          social: 5,
          budget: 5,
          coordinates: [0, 0],
        },
      ];

      await service.sendHotelCancellation(
        mockBooking,
        'Overbooking',
        alternativeHotels,
        'test@example.com'
      );

      expect(global.fetch).toHaveBeenCalled();
      
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.subject).toContain('URGENT');
      expect(body.subject).toContain('Hotel Cancellation');
      expect(body.html).toContain('Overbooking');
      expect(body.html).toContain('Alternative Hotel');
    });

    it('should send notification without alternatives', async () => {
      await service.sendHotelCancellation(
        mockBooking,
        'Maintenance',
        [],
        'test@example.com'
      );

      expect(global.fetch).toHaveBeenCalled();
      
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.html).toContain('Maintenance');
    });

    it('should not send notification when disabled', async () => {
      vi.mocked(notificationPreferences.isEmailNotificationEnabled).mockReturnValue(false);
      vi.mocked(notificationPreferences.isPushNotificationEnabled).mockReturnValue(false);

      await service.sendHotelCancellation(
        mockBooking,
        'Maintenance',
        [],
        'test@example.com'
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendPushNotification', () => {
    it('should send push notification', async () => {
      await service.sendPushNotification(
        'user-123',
        'Test Title',
        'Test Body',
        { key: 'value' }
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/notifications/push',
        expect.objectContaining({
          method: 'POST',
        })
      );

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.userId).toBe('user-123');
      expect(body.title).toBe('Test Title');
      expect(body.body).toBe('Test Body');
      expect(body.data).toEqual({ key: 'value' });
    });

    it('should not throw error when push notification fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(
        service.sendPushNotification('user-123', 'Title', 'Body')
      ).resolves.not.toThrow();
    });
  });
});
