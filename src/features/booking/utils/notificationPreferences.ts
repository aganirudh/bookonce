/**
 * Notification Preferences Utilities
 * Helper functions for managing user notification preferences
 */

import type { NotificationPreferences, NotificationType } from '@/types/booking';

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: {
    enabled: true,
    types: [
      'booking_confirmation',
      'booking_modification',
      'booking_cancellation',
      'check_in_reminder',
      'booking_status_change',
      'hotel_cancellation',
    ],
  },
  push: {
    enabled: false,
    types: ['booking_status_change', 'check_in_reminder', 'hotel_cancellation'],
  },
};

/**
 * Get user notification preferences from storage
 */
export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem('notificationPreferences');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load notification preferences:', error);
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Save user notification preferences to storage
 */
export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  try {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save notification preferences:', error);
    throw error;
  }
}

/**
 * Check if a specific notification type is enabled for email
 */
export function isEmailNotificationEnabled(type: NotificationType): boolean {
  const preferences = getNotificationPreferences();
  return preferences.email.enabled && preferences.email.types.includes(type);
}

/**
 * Check if a specific notification type is enabled for push
 */
export function isPushNotificationEnabled(type: NotificationType): boolean {
  const preferences = getNotificationPreferences();
  return preferences.push.enabled && preferences.push.types.includes(type);
}

/**
 * Check if any notification is enabled for a specific type
 */
export function isNotificationEnabled(type: NotificationType): boolean {
  return isEmailNotificationEnabled(type) || isPushNotificationEnabled(type);
}
