/**
 * Rate Limiter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RateLimiter,
  RateLimitError,
  enforceRateLimit,
  availabilityRateLimiter,
  bookingRateLimiter,
} from '../rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 60000, // 1 minute
      identifier: 'test',
    });
  });

  describe('check', () => {
    it('should allow requests under the limit', () => {
      const userId = 'user1';

      for (let i = 0; i < 5; i++) {
        const result = limiter.check(userId);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests over the limit', () => {
      const userId = 'user1';

      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        limiter.check(userId);
      }

      // 6th request should be blocked
      const result = limiter.check(userId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', () => {
      const userId = 'user1';
      vi.useFakeTimers();

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        limiter.check(userId);
      }

      // Should be blocked
      let result = limiter.check(userId);
      expect(result.allowed).toBe(false);

      // Fast forward past window
      vi.advanceTimersByTime(61000);

      // Should be allowed again
      result = limiter.check(userId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      vi.useRealTimers();
    });

    it('should track different users separately', () => {
      const user1 = 'user1';
      const user2 = 'user2';

      // User 1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        limiter.check(user1);
      }

      // User 1 should be blocked
      let result = limiter.check(user1);
      expect(result.allowed).toBe(false);

      // User 2 should still be allowed
      result = limiter.check(user2);
      expect(result.allowed).toBe(true);
    });
  });

  describe('getHeaders', () => {
    it('should return correct rate limit headers', () => {
      const result = limiter.check('user1');
      const headers = limiter.getHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('5');
      expect(headers['X-RateLimit-Remaining']).toBe('4');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include Retry-After when blocked', () => {
      const userId = 'user1';

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        limiter.check(userId);
      }

      const result = limiter.check(userId);
      const headers = limiter.getHeaders(result);

      expect(headers['Retry-After']).toBeDefined();
      expect(parseInt(headers['Retry-After']!)).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for a user', () => {
      const userId = 'user1';

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        limiter.check(userId);
      }

      // Should be blocked
      let result = limiter.check(userId);
      expect(result.allowed).toBe(false);

      // Reset
      limiter.reset(userId);

      // Should be allowed again
      result = limiter.check(userId);
      expect(result.allowed).toBe(true);
    });
  });

  describe('getCount', () => {
    it('should return current request count', () => {
      const userId = 'user1';

      expect(limiter.getCount(userId)).toBe(0);

      limiter.check(userId);
      expect(limiter.getCount(userId)).toBe(1);

      limiter.check(userId);
      limiter.check(userId);
      expect(limiter.getCount(userId)).toBe(3);
    });
  });
});

describe('enforceRateLimit', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 60000,
      identifier: 'test',
    });
  });

  it('should not throw when under limit', () => {
    expect(() => enforceRateLimit(limiter, 'user1')).not.toThrow();
    expect(() => enforceRateLimit(limiter, 'user1')).not.toThrow();
    expect(() => enforceRateLimit(limiter, 'user1')).not.toThrow();
  });

  it('should throw RateLimitError when over limit', () => {
    // Exhaust limit
    enforceRateLimit(limiter, 'user1');
    enforceRateLimit(limiter, 'user1');
    enforceRateLimit(limiter, 'user1');

    // Should throw
    expect(() => enforceRateLimit(limiter, 'user1')).toThrow(RateLimitError);
  });

  it('should include retry information in error', () => {
    // Exhaust limit
    enforceRateLimit(limiter, 'user1');
    enforceRateLimit(limiter, 'user1');
    enforceRateLimit(limiter, 'user1');

    try {
      enforceRateLimit(limiter, 'user1');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        expect(error.retryAfter).toBeGreaterThan(0);
        expect(error.resetAt).toBeGreaterThan(Date.now());
      }
    }
  });
});

describe('Pre-configured rate limiters', () => {
  it('should have correct configuration for availability limiter', () => {
    const userId = 'user1';

    // Should allow 20 requests
    for (let i = 0; i < 20; i++) {
      const result = availabilityRateLimiter.check(userId);
      expect(result.allowed).toBe(true);
    }

    // 21st should be blocked
    const result = availabilityRateLimiter.check(userId);
    expect(result.allowed).toBe(false);

    // Clean up
    availabilityRateLimiter.reset(userId);
  });

  it('should have correct configuration for booking limiter', () => {
    const userId = 'user2';

    // Should allow 5 requests
    for (let i = 0; i < 5; i++) {
      const result = bookingRateLimiter.check(userId);
      expect(result.allowed).toBe(true);
    }

    // 6th should be blocked
    const result = bookingRateLimiter.check(userId);
    expect(result.allowed).toBe(false);

    // Clean up
    bookingRateLimiter.reset(userId);
  });
});
