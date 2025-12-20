/**
 * Error Handling Utilities
 * Provides error recovery strategies, user-facing messages, and error logging
 */

import type { BookingError, BookingErrorType } from '@/types/booking';
import { ERROR_MESSAGES } from '../constants';

// ============================================================================
// Custom Error Classes
// ============================================================================

export class BookingAPIError extends Error {
  public readonly type: BookingErrorType;
  public readonly details?: any;
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(
    type: BookingErrorType,
    message: string,
    details?: any,
    statusCode?: number,
    retryable = false
  ) {
    super(message);
    this.name = 'BookingAPIError';
    this.type = type;
    this.details = details;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

// ============================================================================
// Error Type Detection
// ============================================================================

/**
 * Determine error type from HTTP status code or error object
 */
export const determineErrorType = (error: any): BookingErrorType => {
  // Network errors
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  // HTTP status code based detection
  const statusCode = error.response?.status || error.statusCode;

  if (statusCode) {
    if (statusCode === 400) return 'VALIDATION_ERROR';
    if (statusCode === 402 || statusCode === 403) return 'PAYMENT_DECLINED';
    if (statusCode === 404) return 'HOTEL_UNAVAILABLE';
    if (statusCode === 409) return 'BOOKING_FAILED';
    if (statusCode === 429) return 'RATE_LIMIT_ERROR';
    if (statusCode >= 500) return 'NETWORK_ERROR';
  }

  // Check error type if it's already a BookingAPIError
  if (error instanceof BookingAPIError) {
    return error.type;
  }

  return 'UNKNOWN_ERROR';
};

/**
 * Check if an error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  if (error instanceof BookingAPIError) {
    return error.retryable;
  }

  const statusCode = error.response?.status || error.statusCode;

  // Retry on network errors and 5xx server errors
  if (!statusCode) return true; // Network error
  if (statusCode >= 500 && statusCode < 600) return true;
  if (statusCode === 408 || statusCode === 429) return true; // Timeout or rate limit

  return false;
};

// ============================================================================
// User-Facing Error Messages
// ============================================================================

/**
 * Get user-friendly error message for a given error type
 */
export const getUserErrorMessage = (errorType: BookingErrorType): string => {
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Create a BookingError object from any error
 */
export const createBookingError = (error: any): BookingError => {
  const type = determineErrorType(error);
  const message = getUserErrorMessage(type);

  return {
    type,
    message,
    details: error.details || error.response?.data || error.message,
  };
};

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: isRetryableError,
  onRetry: () => {},
};

/**
 * Calculate delay for exponential backoff with jitter
 */
const calculateBackoffDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number => {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (random variation) to prevent thundering herd
  const jitter = cappedDelay * 0.1 * Math.random();

  return Math.floor(cappedDelay + jitter);
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateBackoffDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      opts.onRetry(error, attempt + 1, delay);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// ============================================================================
// Fallback Provider Strategy
// ============================================================================

/**
 * Try primary function, fallback to secondary if it fails
 */
export const withFallback = async <T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  shouldFallback: (error: any) => boolean = () => true
): Promise<T> => {
  try {
    return await primaryFn();
  } catch (error) {
    if (shouldFallback(error)) {
      logError('Primary provider failed, using fallback', error);
      return await fallbackFn();
    }
    throw error;
  }
};

// ============================================================================
// Error Logging
// ============================================================================

export interface ErrorLogContext {
  component?: string;
  action?: string;
  userId?: string;
  hotelId?: number;
  bookingId?: string;
  [key: string]: any;
}

/**
 * Log error with context for debugging and monitoring
 */
export const logError = (message: string, error: any, context?: ErrorLogContext): void => {
  const errorInfo = {
    message,
    error: {
      name: error.name,
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('[Booking Error]', errorInfo);
  }

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with Sentry or similar service
    // Sentry.captureException(error, {
    //   tags: { component: context?.component },
    //   extra: context,
    // });
  }
};

/**
 * Log warning (non-critical issues)
 */
export const logWarning = (message: string, context?: ErrorLogContext): void => {
  const warningInfo = {
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.warn('[Booking Warning]', warningInfo);
  }
};

// ============================================================================
// Error Recovery Helpers
// ============================================================================

/**
 * Wrap an async function with error handling and logging
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: ErrorLogContext
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(`Error in ${context.action || 'operation'}`, error, context);
      throw error;
    }
  };
};

/**
 * Create a safe version of a function that returns null on error instead of throwing
 */
export const makeSafe = <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      logWarning('Safe function caught error', { error });
      return null;
    }
  };
};
