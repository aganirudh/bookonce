/**
 * Error Handling Utilities Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BookingAPIError,
  determineErrorType,
  isRetryableError,
  getUserErrorMessage,
  createBookingError,
  retryWithBackoff,
  withFallback,
} from '../errorHandling';

describe('Error Handling Utilities', () => {
  describe('BookingAPIError', () => {
    it('should create error with all properties', () => {
      const error = new BookingAPIError(
        'BOOKING_FAILED',
        'Test error',
        { detail: 'test' },
        400,
        true
      );

      expect(error.type).toBe('BOOKING_FAILED');
      expect(error.message).toBe('Test error');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(true);
    });
  });

  describe('determineErrorType', () => {
    it('should detect network errors', () => {
      const error = new Error('Network request failed');
      expect(determineErrorType(error)).toBe('NETWORK_ERROR');
    });

    it('should detect validation errors from status code', () => {
      const error = { response: { status: 400 } };
      expect(determineErrorType(error)).toBe('VALIDATION_ERROR');
    });

    it('should detect payment errors from status code', () => {
      const error = { response: { status: 402 } };
      expect(determineErrorType(error)).toBe('PAYMENT_DECLINED');
    });

    it('should detect hotel unavailable from status code', () => {
      const error = { response: { status: 404 } };
      expect(determineErrorType(error)).toBe('HOTEL_UNAVAILABLE');
    });

    it('should detect booking failed from status code', () => {
      const error = { response: { status: 409 } };
      expect(determineErrorType(error)).toBe('BOOKING_FAILED');
    });

    it('should detect server errors', () => {
      const error = { response: { status: 500 } };
      expect(determineErrorType(error)).toBe('NETWORK_ERROR');
    });

    it('should return UNKNOWN_ERROR for unrecognized errors', () => {
      const error = { response: { status: 418 } };
      expect(determineErrorType(error)).toBe('UNKNOWN_ERROR');
    });

    it('should preserve BookingAPIError type', () => {
      const error = new BookingAPIError('PAYMENT_DECLINED', 'Payment failed');
      expect(determineErrorType(error)).toBe('PAYMENT_DECLINED');
    });
  });

  describe('isRetryableError', () => {
    it('should mark BookingAPIError as retryable if flag is set', () => {
      const error = new BookingAPIError('NETWORK_ERROR', 'Network failed', {}, 500, true);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not retry BookingAPIError if flag is false', () => {
      const error = new BookingAPIError('VALIDATION_ERROR', 'Invalid', {}, 400, false);
      expect(isRetryableError(error)).toBe(false);
    });

    it('should retry on 5xx errors', () => {
      const error = { response: { status: 500 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should retry on timeout errors', () => {
      const error = { response: { status: 408 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should retry on rate limit errors', () => {
      const error = { response: { status: 429 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not retry on 4xx client errors', () => {
      const error = { response: { status: 400 } };
      expect(isRetryableError(error)).toBe(false);
    });

    it('should retry on network errors without status code', () => {
      const error = new Error('Network failed');
      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe('getUserErrorMessage', () => {
    it('should return correct message for each error type', () => {
      expect(getUserErrorMessage('AVAILABILITY_CHECK_FAILED')).toContain('trouble checking availability');
      expect(getUserErrorMessage('BOOKING_FAILED')).toContain("couldn't complete your booking");
      expect(getUserErrorMessage('PAYMENT_DECLINED')).toContain('payment was declined');
      expect(getUserErrorMessage('NETWORK_ERROR')).toContain('Connection lost');
    });

    it('should return unknown error message for unrecognized type', () => {
      expect(getUserErrorMessage('UNKNOWN_ERROR')).toContain('Something went wrong');
    });
  });

  describe('createBookingError', () => {
    it('should create BookingError from any error', () => {
      const error = { response: { status: 400, data: { message: 'Invalid' } } };
      const bookingError = createBookingError(error);

      expect(bookingError.type).toBe('VALIDATION_ERROR');
      expect(bookingError.message).toBeDefined();
      expect(bookingError.details).toBeDefined();
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const promise = retryWithBackoff(fn);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(fn, { maxRetries: 3 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      const promise = retryWithBackoff(fn, { maxRetries: 2 });
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const error = new BookingAPIError('VALIDATION_ERROR', 'Invalid', {}, 400, false);
      const fn = vi.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(fn);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Invalid');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      const onRetry = vi.fn();

      const promise = retryWithBackoff(fn, { maxRetries: 2, onRetry });
      await vi.runAllTimersAsync();
      await promise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1,
        expect.any(Number)
      );
    });
  });

  describe('withFallback', () => {
    it('should use primary function when it succeeds', async () => {
      const primary = vi.fn().mockResolvedValue('primary');
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await withFallback(primary, fallback);

      expect(result).toBe('primary');
      expect(primary).toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should use fallback when primary fails', async () => {
      const primary = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await withFallback(primary, fallback);

      expect(result).toBe('fallback');
      expect(primary).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
    });

    it('should respect shouldFallback condition', async () => {
      const primary = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback = vi.fn().mockResolvedValue('fallback');
      const shouldFallback = vi.fn().mockReturnValue(false);

      await expect(
        withFallback(primary, fallback, shouldFallback)
      ).rejects.toThrow('Primary failed');

      expect(fallback).not.toHaveBeenCalled();
    });
  });
});
