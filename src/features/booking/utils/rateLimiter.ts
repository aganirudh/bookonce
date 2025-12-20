/**
 * Rate Limiter Utility
 * Implements rate limiting for booking endpoints to prevent abuse
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string; // e.g., 'availability', 'booking'
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
  firstRequestAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

/**
 * Rate Limiter class
 * Manages rate limiting for different types of requests
 */
export class RateLimiter {
  private limitMap: Map<string, RateLimitEntry>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.limitMap = new Map();
    this.config = config;
  }

  /**
   * Check if a request is allowed under rate limit
   * @param userId - User identifier (or IP address for guests)
   * @returns RateLimitResult with allowed status and metadata
   */
  check(userId: string): RateLimitResult {
    const now = Date.now();
    const key = `${this.config.identifier}:${userId}`;
    const entry = this.limitMap.get(key);

    // No previous requests - allow and create entry
    if (!entry) {
      this.limitMap.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
        firstRequestAt: now,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: now + this.config.windowMs,
      };
    }

    // Window has expired - reset and allow
    if (now >= entry.resetAt) {
      this.limitMap.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
        firstRequestAt: now,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: now + this.config.windowMs,
      };
    }

    // Within window - check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter,
      };
    }

    // Within window and under limit - increment and allow
    entry.count += 1;

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Get rate limit headers for API responses
   * @param result - Rate limit result from check()
   * @returns Headers object
   */
  getHeaders(result: RateLimitResult): RateLimitHeaders {
    const headers: RateLimitHeaders = {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    };

    if (result.retryAfter !== undefined) {
      headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
  }

  /**
   * Reset rate limit for a specific user (useful for testing)
   * @param userId - User identifier
   */
  reset(userId: string): void {
    const key = `${this.config.identifier}:${userId}`;
    this.limitMap.delete(key);
  }

  /**
   * Clear all rate limit entries (useful for testing)
   */
  clear(): void {
    this.limitMap.clear();
  }

  /**
   * Get current count for a user
   * @param userId - User identifier
   * @returns Current request count or 0 if no entry
   */
  getCount(userId: string): number {
    const key = `${this.config.identifier}:${userId}`;
    const entry = this.limitMap.get(key);

    if (!entry) {
      return 0;
    }

    // Check if window expired
    if (Date.now() >= entry.resetAt) {
      return 0;
    }

    return entry.count;
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  public readonly retryAfter: number;
  public readonly resetAt: number;

  constructor(message: string, retryAfter: number, resetAt: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.resetAt = resetAt;
  }
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * Rate limiter for availability checks
 * 20 requests per minute
 */
export const availabilityRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  identifier: 'availability',
});

/**
 * Rate limiter for booking creation
 * 5 requests per 10 minutes
 */
export const bookingRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
  identifier: 'booking',
});

/**
 * Rate limiter for booking modifications
 * 3 requests per hour
 */
export const modificationRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  identifier: 'modification',
});

/**
 * Rate limiter for booking cancellations
 * 3 requests per hour
 */
export const cancellationRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  identifier: 'cancellation',
});

/**
 * Helper function to enforce rate limit
 * @param limiter - Rate limiter instance
 * @param userId - User identifier
 * @throws RateLimitError if limit exceeded
 */
export function enforceRateLimit(limiter: RateLimiter, userId: string): void {
  const result = limiter.check(userId);

  if (!result.allowed) {
    const retryMinutes = Math.ceil(result.retryAfter! / 60);
    throw new RateLimitError(
      `Rate limit exceeded. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? 's' : ''}.`,
      result.retryAfter!,
      result.resetAt
    );
  }
}
