/**
 * Cache Store Unit Tests
 * Tests for cache TTL and invalidation logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useCacheStore,
  getAvailabilityCacheKey,
  getPricingCacheKey,
  getCacheStats,
} from '../cacheStore';
import type { AvailabilityResponse, PricingDetails } from '@/types/booking';
import { CACHE_TTL } from '../../constants';

// Mock data
const mockAvailability: AvailabilityResponse = {
  hotelId: 1,
  checkInDate: '2024-01-01',
  checkOutDate: '2024-01-05',
  available: true,
  rooms: [],
  cachedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + CACHE_TTL.AVAILABILITY).toISOString(),
};

const mockPricing: PricingDetails = {
  baseRate: 100,
  numberOfNights: 4,
  subtotal: 400,
  taxes: [],
  fees: [],
  total: 400,
  currency: 'USD',
};

describe('Cache Store', () => {
  beforeEach(() => {
    // Reset cache before each test
    const store = useCacheStore.getState();
    store.invalidateAll();
    vi.clearAllTimers();
  });

  describe('cache key generators', () => {
    it('should generate availability cache key', () => {
      const key = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');
      expect(key).toBe('availability:1:2024-01-01:2024-01-05');
    });

    it('should generate pricing cache key', () => {
      const key = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');
      expect(key).toBe('pricing:1:room-1:2024-01-01:2024-01-05');
    });
  });

  describe('availability cache', () => {
    it('should set and get availability data', () => {
      const { setAvailability, getAvailability } = useCacheStore.getState();
      const key = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');

      setAvailability(key, mockAvailability);
      const cached = getAvailability(key);

      expect(cached).toEqual(mockAvailability);
    });

    it('should return null for non-existent key', () => {
      const { getAvailability } = useCacheStore.getState();
      const key = getAvailabilityCacheKey(999, '2024-01-01', '2024-01-05');

      const cached = getAvailability(key);

      expect(cached).toBeNull();
    });

    it('should return null for expired data', () => {
      const { setAvailability, getAvailability } = useCacheStore.getState();
      const key = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');

      // Set with very short TTL (1ms)
      setAvailability(key, mockAvailability, 1);

      // Wait for expiration
      vi.useFakeTimers();
      vi.advanceTimersByTime(2);

      const cached = getAvailability(key);

      expect(cached).toBeNull();
      vi.useRealTimers();
    });

    it('should use default TTL when not specified', () => {
      const { setAvailability } = useCacheStore.getState();
      const key = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');

      setAvailability(key, mockAvailability);

      const state = useCacheStore.getState();
      const cached = state.availabilityCache.get(key);

      expect(cached).toBeDefined();
      expect(cached!.expiresAt - cached!.cachedAt).toBe(CACHE_TTL.AVAILABILITY);
    });
  });

  describe('pricing cache', () => {
    it('should set and get pricing data', () => {
      const { setPricing, getPricing } = useCacheStore.getState();
      const key = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');

      setPricing(key, mockPricing);
      const cached = getPricing(key);

      expect(cached).toEqual(mockPricing);
    });

    it('should return null for non-existent key', () => {
      const { getPricing } = useCacheStore.getState();
      const key = getPricingCacheKey(999, 'room-999', '2024-01-01', '2024-01-05');

      const cached = getPricing(key);

      expect(cached).toBeNull();
    });

    it('should return null for expired data', () => {
      const { setPricing, getPricing } = useCacheStore.getState();
      const key = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');

      // Set with very short TTL (1ms)
      setPricing(key, mockPricing, 1);

      // Wait for expiration
      vi.useFakeTimers();
      vi.advanceTimersByTime(2);

      const cached = getPricing(key);

      expect(cached).toBeNull();
      vi.useRealTimers();
    });

    it('should use default TTL when not specified', () => {
      const { setPricing } = useCacheStore.getState();
      const key = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');

      setPricing(key, mockPricing);

      const state = useCacheStore.getState();
      const cached = state.pricingCache.get(key);

      expect(cached).toBeDefined();
      expect(cached!.expiresAt - cached!.cachedAt).toBe(CACHE_TTL.PRICING);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate specific cache entry', () => {
      const { setAvailability, setPricing, invalidate, getAvailability, getPricing } =
        useCacheStore.getState();
      const availKey = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');
      const priceKey = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');

      setAvailability(availKey, mockAvailability);
      setPricing(priceKey, mockPricing);

      invalidate(availKey);

      expect(getAvailability(availKey)).toBeNull();
      expect(getPricing(priceKey)).toEqual(mockPricing);
    });

    it('should invalidate all availability cache', () => {
      const { setAvailability, invalidateAvailability, getAvailability } = useCacheStore.getState();
      const key1 = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');
      const key2 = getAvailabilityCacheKey(2, '2024-02-01', '2024-02-05');

      setAvailability(key1, mockAvailability);
      setAvailability(key2, { ...mockAvailability, hotelId: 2 });

      invalidateAvailability();

      expect(getAvailability(key1)).toBeNull();
      expect(getAvailability(key2)).toBeNull();
    });

    it('should invalidate all pricing cache', () => {
      const { setPricing, invalidatePricing, getPricing } = useCacheStore.getState();
      const key1 = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');
      const key2 = getPricingCacheKey(2, 'room-2', '2024-02-01', '2024-02-05');

      setPricing(key1, mockPricing);
      setPricing(key2, mockPricing);

      invalidatePricing();

      expect(getPricing(key1)).toBeNull();
      expect(getPricing(key2)).toBeNull();
    });

    it('should invalidate all caches', () => {
      const { setAvailability, setPricing, invalidateAll, getAvailability, getPricing } =
        useCacheStore.getState();
      const availKey = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');
      const priceKey = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');

      setAvailability(availKey, mockAvailability);
      setPricing(priceKey, mockPricing);

      invalidateAll();

      expect(getAvailability(availKey)).toBeNull();
      expect(getPricing(priceKey)).toBeNull();
    });
  });

  describe('cleanExpired', () => {
    it('should remove expired entries from both caches', () => {
      const { setAvailability, setPricing, cleanExpired } = useCacheStore.getState();
      const availKey1 = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');
      const availKey2 = getAvailabilityCacheKey(2, '2024-02-01', '2024-02-05');
      const priceKey1 = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');
      const priceKey2 = getPricingCacheKey(2, 'room-2', '2024-02-01', '2024-02-05');

      // Set some with short TTL (expired) and some with long TTL (valid)
      setAvailability(availKey1, mockAvailability, 1); // Will expire
      setAvailability(availKey2, { ...mockAvailability, hotelId: 2 }, 10000); // Won't expire
      setPricing(priceKey1, mockPricing, 1); // Will expire
      setPricing(priceKey2, mockPricing, 10000); // Won't expire

      // Wait for expiration
      vi.useFakeTimers();
      vi.advanceTimersByTime(2);

      cleanExpired();

      const state = useCacheStore.getState();
      expect(state.availabilityCache.has(availKey1)).toBe(false);
      expect(state.availabilityCache.has(availKey2)).toBe(true);
      expect(state.pricingCache.has(priceKey1)).toBe(false);
      expect(state.pricingCache.has(priceKey2)).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const { setAvailability, setPricing } = useCacheStore.getState();
      const availKey1 = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');
      const availKey2 = getAvailabilityCacheKey(2, '2024-02-01', '2024-02-05');
      const priceKey = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');

      setAvailability(availKey1, mockAvailability);
      setAvailability(availKey2, { ...mockAvailability, hotelId: 2 });
      setPricing(priceKey, mockPricing);

      const stats = getCacheStats();

      expect(stats.availability.total).toBe(2);
      expect(stats.pricing.total).toBe(1);
    });

    it('should count expired entries', () => {
      const { setAvailability, setPricing } = useCacheStore.getState();
      const availKey = getAvailabilityCacheKey(1, '2024-01-01', '2024-01-05');
      const priceKey = getPricingCacheKey(1, 'room-1', '2024-01-01', '2024-01-05');

      // Set with short TTL
      setAvailability(availKey, mockAvailability, 1);
      setPricing(priceKey, mockPricing, 1);

      // Wait for expiration
      vi.useFakeTimers();
      vi.advanceTimersByTime(2);

      const stats = getCacheStats();

      expect(stats.availability.expired).toBe(1);
      expect(stats.pricing.expired).toBe(1);

      vi.useRealTimers();
    });
  });
});
