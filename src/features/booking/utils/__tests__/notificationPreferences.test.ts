/**
 * Notification Preferences Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  isEmailNotificationEnabled,
  isPushNotificationEnabled,
  isNotificationEnabled,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../notificationPreferences';
import type { NotificationPreferences } from '@/types/booking';

describe('notificationPreferences', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getNotificationPreferences', () => {
    it('should return default preferences when nothing is stored', () => {
      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });

    it('should return stored preferences when available', () => {
      const customPreferences: NotificationPreferences = {
        email: {
          enabled: false,
          types: ['booking_confirmation'],
        },
        push: {
          enabled: true,
          types: ['check_in_reminder'],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(customPreferences));

      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(customPreferences);
    });

    it('should return default preferences when stored data is invalid', () => {
      localStorage.setItem('notificationPreferences', 'invalid json');

      const preferences = getNotificationPreferences();
      expect(preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    });
  });

  describe('saveNotificationPreferences', () => {
    it('should save preferences to localStorage', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: true,
          types: ['booking_confirmation', 'check_in_reminder'],
        },
        push: {
          enabled: false,
          types: [],
        },
      };

      saveNotificationPreferences(preferences);

      const stored = localStorage.getItem('notificationPreferences');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(preferences);
    });

    it('should throw error when localStorage fails', () => {
      const preferences: NotificationPreferences = {
        email: { enabled: true, types: [] },
        push: { enabled: false, types: [] },
      };

      // Mock localStorage.setItem to throw
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => saveNotificationPreferences(preferences)).toThrow();

      // Restore
      setItemSpy.mockRestore();
    });
  });

  describe('isEmailNotificationEnabled', () => {
    it('should return true when email notifications are enabled for type', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: true,
          types: ['booking_confirmation', 'check_in_reminder'],
        },
        push: {
          enabled: false,
          types: [],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isEmailNotificationEnabled('booking_confirmation')).toBe(true);
      expect(isEmailNotificationEnabled('check_in_reminder')).toBe(true);
    });

    it('should return false when email notifications are disabled', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: false,
          types: ['booking_confirmation'],
        },
        push: {
          enabled: false,
          types: [],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isEmailNotificationEnabled('booking_confirmation')).toBe(false);
    });

    it('should return false when type is not in enabled types', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: true,
          types: ['booking_confirmation'],
        },
        push: {
          enabled: false,
          types: [],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isEmailNotificationEnabled('check_in_reminder')).toBe(false);
    });
  });

  describe('isPushNotificationEnabled', () => {
    it('should return true when push notifications are enabled for type', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: false,
          types: [],
        },
        push: {
          enabled: true,
          types: ['booking_status_change', 'hotel_cancellation'],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isPushNotificationEnabled('booking_status_change')).toBe(true);
      expect(isPushNotificationEnabled('hotel_cancellation')).toBe(true);
    });

    it('should return false when push notifications are disabled', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: false,
          types: [],
        },
        push: {
          enabled: false,
          types: ['booking_status_change'],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isPushNotificationEnabled('booking_status_change')).toBe(false);
    });

    it('should return false when type is not in enabled types', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: false,
          types: [],
        },
        push: {
          enabled: true,
          types: ['booking_status_change'],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isPushNotificationEnabled('hotel_cancellation')).toBe(false);
    });
  });

  describe('isNotificationEnabled', () => {
    it('should return true when email notification is enabled', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: true,
          types: ['booking_confirmation'],
        },
        push: {
          enabled: false,
          types: [],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isNotificationEnabled('booking_confirmation')).toBe(true);
    });

    it('should return true when push notification is enabled', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: false,
          types: [],
        },
        push: {
          enabled: true,
          types: ['check_in_reminder'],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isNotificationEnabled('check_in_reminder')).toBe(true);
    });

    it('should return true when both email and push are enabled', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: true,
          types: ['booking_confirmation'],
        },
        push: {
          enabled: true,
          types: ['booking_confirmation'],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isNotificationEnabled('booking_confirmation')).toBe(true);
    });

    it('should return false when neither email nor push is enabled', () => {
      const preferences: NotificationPreferences = {
        email: {
          enabled: false,
          types: [],
        },
        push: {
          enabled: false,
          types: [],
        },
      };

      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      expect(isNotificationEnabled('booking_confirmation')).toBe(false);
    });
  });

  describe('DEFAULT_NOTIFICATION_PREFERENCES', () => {
    it('should have email enabled by default', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.email.enabled).toBe(true);
    });

    it('should have all email notification types enabled by default', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.email.types).toContain('booking_confirmation');
      expect(DEFAULT_NOTIFICATION_PREFERENCES.email.types).toContain('booking_modification');
      expect(DEFAULT_NOTIFICATION_PREFERENCES.email.types).toContain('booking_cancellation');
      expect(DEFAULT_NOTIFICATION_PREFERENCES.email.types).toContain('check_in_reminder');
      expect(DEFAULT_NOTIFICATION_PREFERENCES.email.types).toContain('booking_status_change');
      expect(DEFAULT_NOTIFICATION_PREFERENCES.email.types).toContain('hotel_cancellation');
    });

    it('should have push disabled by default', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.push.enabled).toBe(false);
    });

    it('should have critical push notification types in default list', () => {
      expect(DEFAULT_NOTIFICATION_PREFERENCES.push.types).toContain('booking_status_change');
      expect(DEFAULT_NOTIFICATION_PREFERENCES.push.types).toContain('check_in_reminder');
      expect(DEFAULT_NOTIFICATION_PREFERENCES.push.types).toContain('hotel_cancellation');
    });
  });
});
