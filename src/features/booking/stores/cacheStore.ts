/**
 * Cache Store - Zustand state management for caching availability and pricing data
 * Implements TTL (time-to-live) logic and cache invalidation
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AvailabilityResponse, PricingDetails, CachedData } from '@/types/booking';
import { CACHE_TTL } from '../constants';

// ============================================================================
// Cache Key Generators
// ============================================================================

/**
 * Generate cache key for availability data
 */
export const getAvailabilityCacheKey = (
  hotelId: number,
  checkInDate: string,
  checkOutDate: string
): string => {
  return `availability:${hotelId}:${checkInDate}:${checkOutDate}`;
};

/**
 * Generate cache key for pricing data
 */
export const getPricingCacheKey = (
  hotelId: number,
  roomId: string,
  checkInDate: string,
  checkOutDate: string
): string => {
  return `pricing:${hotelId}:${roomId}:${checkInDate}:${checkOutDate}`;
};

// ============================================================================
// Store State Interface
// ============================================================================

interface CacheState {
  // State - Using Maps for efficient lookups
  availabilityCache: Map<string, CachedData<AvailabilityResponse>>;
  pricingCache: Map<string, CachedData<PricingDetails>>;

  // Actions
  setAvailability: (key: string, data: AvailabilityResponse, ttl?: number) => void;
  getAvailability: (key: string) => AvailabilityResponse | null;
  setPricing: (key: string, data: PricingDetails, ttl?: number) => void;
  getPricing: (key: string) => PricingDetails | null;
  invalidate: (key: string) => void;
  invalidateAll: () => void;
  invalidateAvailability: () => void;
  invalidatePricing: () => void;
  cleanExpired: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if cached data is expired
 */
const isExpired = <T>(cachedData: CachedData<T>): boolean => {
  return Date.now() > cachedData.expiresAt;
};

/**
 * Create cached data object with TTL
 */
const createCachedData = <T>(data: T, ttl: number): CachedData<T> => {
  const now = Date.now();
  return {
    data,
    cachedAt: now,
    expiresAt: now + ttl,
  };
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useCacheStore = create<CacheState>()(
  devtools(
    (set, get) => ({
      // Initial state
      availabilityCache: new Map(),
      pricingCache: new Map(),

      // Set availability data in cache
      setAvailability: (key: string, data: AvailabilityResponse, ttl = CACHE_TTL.AVAILABILITY) => {
        const { availabilityCache } = get();
        const newCache = new Map(availabilityCache);
        newCache.set(key, createCachedData(data, ttl));
        
        set(
          { availabilityCache: newCache },
          false,
          'setAvailability'
        );
      },

      // Get availability data from cache
      getAvailability: (key: string): AvailabilityResponse | null => {
        const { availabilityCache } = get();
        const cached = availabilityCache.get(key);

        if (!cached) {
          return null;
        }

        // Check if expired
        if (isExpired(cached)) {
          // Remove expired entry
          const newCache = new Map(availabilityCache);
          newCache.delete(key);
          set({ availabilityCache: newCache }, false, 'getAvailability:expired');
          return null;
        }

        return cached.data;
      },

      // Set pricing data in cache
      setPricing: (key: string, data: PricingDetails, ttl = CACHE_TTL.PRICING) => {
        const { pricingCache } = get();
        const newCache = new Map(pricingCache);
        newCache.set(key, createCachedData(data, ttl));
        
        set(
          { pricingCache: newCache },
          false,
          'setPricing'
        );
      },

      // Get pricing data from cache
      getPricing: (key: string): PricingDetails | null => {
        const { pricingCache } = get();
        const cached = pricingCache.get(key);

        if (!cached) {
          return null;
        }

        // Check if expired
        if (isExpired(cached)) {
          // Remove expired entry
          const newCache = new Map(pricingCache);
          newCache.delete(key);
          set({ pricingCache: newCache }, false, 'getPricing:expired');
          return null;
        }

        return cached.data;
      },

      // Invalidate specific cache entry (works for both availability and pricing)
      invalidate: (key: string) => {
        const { availabilityCache, pricingCache } = get();
        
        const newAvailabilityCache = new Map(availabilityCache);
        const newPricingCache = new Map(pricingCache);
        
        newAvailabilityCache.delete(key);
        newPricingCache.delete(key);
        
        set(
          {
            availabilityCache: newAvailabilityCache,
            pricingCache: newPricingCache,
          },
          false,
          'invalidate'
        );
      },

      // Invalidate all cache entries
      invalidateAll: () => {
        set(
          {
            availabilityCache: new Map(),
            pricingCache: new Map(),
          },
          false,
          'invalidateAll'
        );
      },

      // Invalidate all availability cache entries
      invalidateAvailability: () => {
        set(
          { availabilityCache: new Map() },
          false,
          'invalidateAvailability'
        );
      },

      // Invalidate all pricing cache entries
      invalidatePricing: () => {
        set(
          { pricingCache: new Map() },
          false,
          'invalidatePricing'
        );
      },

      // Clean up expired entries from both caches
      cleanExpired: () => {
        const { availabilityCache, pricingCache } = get();
        
        const newAvailabilityCache = new Map(availabilityCache);
        const newPricingCache = new Map(pricingCache);
        
        // Clean availability cache
        for (const [key, value] of newAvailabilityCache.entries()) {
          if (isExpired(value)) {
            newAvailabilityCache.delete(key);
          }
        }
        
        // Clean pricing cache
        for (const [key, value] of newPricingCache.entries()) {
          if (isExpired(value)) {
            newPricingCache.delete(key);
          }
        }
        
        set(
          {
            availabilityCache: newAvailabilityCache,
            pricingCache: newPricingCache,
          },
          false,
          'cleanExpired'
        );
      },
    }),
    {
      name: 'cache-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectAvailabilityCache = (state: CacheState) => state.availabilityCache;
export const selectPricingCache = (state: CacheState) => state.pricingCache;

// ============================================================================
// Cache Statistics (for debugging/monitoring)
// ============================================================================

export const getCacheStats = () => {
  const state = useCacheStore.getState();
  
  return {
    availability: {
      total: state.availabilityCache.size,
      expired: Array.from(state.availabilityCache.values()).filter(isExpired).length,
    },
    pricing: {
      total: state.pricingCache.size,
      expired: Array.from(state.pricingCache.values()).filter(isExpired).length,
    },
  };
};
