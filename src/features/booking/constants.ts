/**
 * Booking Feature Constants
 */

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  AVAILABILITY: 5 * 60 * 1000, // 5 minutes
  PRICING: 5 * 60 * 1000, // 5 minutes
  BOOKING_DETAILS: 60 * 60 * 1000, // 1 hour
  USER_BOOKINGS: 10 * 60 * 1000, // 10 minutes
} as const;

// Rate limits
export const RATE_LIMITS = {
  AVAILABILITY_CHECK: { requests: 20, window: 60 * 1000 }, // 20 per minute
  BOOKING_CREATION: { requests: 5, window: 10 * 60 * 1000 }, // 5 per 10 minutes
  BOOKING_MODIFICATION: { requests: 3, window: 60 * 60 * 1000 }, // 3 per hour
  BOOKING_CANCELLATION: { requests: 3, window: 60 * 60 * 1000 }, // 3 per hour
} as const;

// API timeouts in milliseconds
export const API_TIMEOUTS = {
  AVAILABILITY_CHECK: 3000, // 3 seconds
  PRICING_CALCULATION: 2000, // 2 seconds
  BOOKING_SUBMISSION: 5000, // 5 seconds
  CONFIRMATION_EMAIL: 120000, // 2 minutes
} as const;

// Debounce delays in milliseconds
export const DEBOUNCE_DELAYS = {
  AVAILABILITY_CHECK: 500, // 500ms
  SEARCH: 300, // 300ms
} as const;

// Error messages
export const ERROR_MESSAGES = {
  AVAILABILITY_CHECK_FAILED: "We're having trouble checking availability. Please try again.",
  BOOKING_FAILED: "We couldn't complete your booking. Your card has not been charged.",
  PAYMENT_DECLINED:
    'Your payment was declined. Please check your card details or try another card.',
  NETWORK_ERROR: 'Connection lost. Please check your internet and try again.',
  HOTEL_UNAVAILABLE: 'This hotel is no longer available for your dates. Here are similar options:',
  MODIFICATION_FAILED: "We couldn't modify your booking. Please contact support.",
  CANCELLATION_FAILED: "We couldn't cancel your booking. Please contact support immediately.",
  VALIDATION_ERROR: 'Please check your information and try again.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment before trying again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again or contact support.',
} as const;

// Booking steps
export const BOOKING_STEPS = {
  DATES: 'dates',
  ROOMS: 'rooms',
  GUEST_INFO: 'guest-info',
  PAYMENT: 'payment',
  PROCESSING: 'processing',
} as const;

// Booking status
export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const;

// Cancellation policy types
export const CANCELLATION_POLICY_TYPES = {
  FLEXIBLE: 'flexible',
  MODERATE: 'moderate',
  STRICT: 'strict',
  NON_REFUNDABLE: 'non-refundable',
} as const;

// Payment status
export const PAYMENT_STATUS = {
  REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  REQUIRES_ACTION: 'requires_action',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  CANCELED: 'canceled',
  FAILED: 'failed',
} as const;

// Refund status
export const REFUND_STATUS = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;

// Touch target minimum size (accessibility)
export const MIN_TOUCH_TARGET_SIZE = 44; // 44x44px

// Responsive breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  MOBILE: 320,
  TABLET: 768,
  DESKTOP: 1024,
} as const;
