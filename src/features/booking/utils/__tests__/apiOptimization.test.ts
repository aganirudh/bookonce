/**
 * API Optimization Tests
 * Tests for mobile network optimizations including compression, prefetching, and payload reduction
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  compressRequestPayload,
  reduceResponsePayload,
  optimizeAvailabilityResponse,
  optimizeHotelData,
  PrefetchManager,
  isSlowNetwork,
  getOptimalImageQuality,
  debounce,
  throttle,
} from '../apiOptimization';
import type { AvailabilityResponse, Hotel } from '@/types/booking';

describe('API Optimization Utilities', () => {
  describe('compressRequestPayload', () => {
    it('should keep only specified fields', () => {
      const payload = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
      };

      const compressed = compressRequestPayload(payload, ['field1', 'field3']);

      expect(compressed).toEqual({
        field1: 'value1',
        field3: 'value3',
      });
      expect(compressed.field2).toBeUndefined();
    });

    it('should return full payload if no fields specified', () => {
      const payload = {
        field1: 'value1',
        field2: 'value2',
      };

      const compressed = compressRequestPayload(payload);

      expect(compressed).toEqual(payload);
    });

    it('should handle empty payload', () => {
      const compressed = compressRequestPayload({}, ['field1']);

      expect(compressed).toEqual({});
    });
  });

  describe('reduceResponsePayload', () => {
    it('should remove images when requested', () => {
      const response = {
        id: 1,
        name: 'Test',
        image: '/test.jpg',
        images: ['/test1.jpg', '/test2.jpg'],
      };

      const reduced = reduceResponsePayload(response, { removeImages: true });

      expect(reduced.image).toBeUndefined();
      expect(reduced.images).toBeUndefined();
      expect(reduced.id).toBe(1);
      expect(reduced.name).toBe('Test');
    });

    it('should remove descriptions when requested', () => {
      const response = {
        id: 1,
        name: 'Test',
        description: 'A long description',
      };

      const reduced = reduceResponsePayload(response, { removeDescriptions: true });

      expect(reduced.description).toBeUndefined();
      expect(reduced.id).toBe(1);
      expect(reduced.name).toBe('Test');
    });

    it('should limit array sizes', () => {
      const response = {
        items: [1, 2, 3, 4, 5],
        tags: ['a', 'b', 'c', 'd'],
      };

      const reduced = reduceResponsePayload(response, { limitArrays: 2 });

      expect(reduced.items).toEqual([1, 2]);
      expect(reduced.tags).toEqual(['a', 'b']);
    });

    it('should handle null response', () => {
      const reduced = reduceResponsePayload(null as any);

      expect(reduced).toBeNull();
    });
  });

  describe('optimizeAvailabilityResponse', () => {
    const mockResponse: AvailabilityResponse = {
      hotelId: 1,
      checkInDate: '2024-01-01',
      checkOutDate: '2024-01-05',
      available: true,
      rooms: [
        {
          id: 'room-1',
          name: 'Standard Room',
          description: 'A room',
          capacity: 2,
          bedType: 'Queen',
          size: 30,
          images: ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg'],
          amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Safe', 'Phone'],
          basePrice: 200,
          available: 5,
          instantBooking: true,
        },
      ],
      alternativeDates: [
        { checkInDate: '2024-01-02', checkOutDate: '2024-01-06' },
        { checkInDate: '2024-01-03', checkOutDate: '2024-01-07' },
        { checkInDate: '2024-01-04', checkOutDate: '2024-01-08' },
        { checkInDate: '2024-01-05', checkOutDate: '2024-01-09' },
      ],
      cachedAt: '2024-01-01T00:00:00Z',
      expiresAt: '2024-01-01T00:05:00Z',
    };

    it('should optimize for mobile by limiting images and amenities', () => {
      const optimized = optimizeAvailabilityResponse(mockResponse, true);

      expect(optimized.rooms[0].images).toHaveLength(2);
      expect(optimized.rooms[0].amenities).toHaveLength(5);
      expect(optimized.alternativeDates).toHaveLength(3);
    });

    it('should not optimize for desktop', () => {
      const optimized = optimizeAvailabilityResponse(mockResponse, false);

      expect(optimized.rooms[0].images).toHaveLength(4);
      expect(optimized.rooms[0].amenities).toHaveLength(6);
      expect(optimized.alternativeDates).toHaveLength(4);
    });
  });

  describe('optimizeHotelData', () => {
    const mockHotel: Hotel = {
      id: 1,
      title: 'Test Hotel',
      location: 'Test Location',
      price: 200,
      rating: 4.5,
      reviews: 100,
      image: '/test.jpg',
      amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar'],
      tags: ['Luxury', 'Beach', 'Family', 'Romantic'],
      energy: 50,
      social: 50,
      budget: 50,
      coordinates: [0, 0],
      instantBooking: true,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      providerId: 'test',
      providerHotelId: '1',
      cancellationPolicy: {
        type: 'flexible',
        description: 'Free cancellation',
        rules: [{ daysBeforeCheckIn: 1, refundPercentage: 100 }],
      },
    };

    it('should limit amenities and tags on mobile', () => {
      const optimized = optimizeHotelData(mockHotel, true);

      expect(optimized.amenities).toHaveLength(5);
      expect(optimized.tags).toHaveLength(3);
    });

    it('should not optimize for desktop', () => {
      const optimized = optimizeHotelData(mockHotel, false);

      expect(optimized.amenities).toHaveLength(6);
      expect(optimized.tags).toHaveLength(4);
    });
  });

  describe('PrefetchManager', () => {
    let prefetchManager: PrefetchManager;

    beforeEach(() => {
      prefetchManager = new PrefetchManager();
    });

    afterEach(() => {
      prefetchManager.clear();
    });

    it('should prefetch data', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });

      await prefetchManager.prefetch('test-key', fetchFn);

      expect(fetchFn).toHaveBeenCalled();
      const cached = prefetchManager.getPrefetched('test-key');
      expect(cached).toEqual({ data: 'test' });
    });

    it('should not prefetch if already prefetching', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });

      // Start first prefetch
      const promise1 = prefetchManager.prefetch('test-key', fetchFn);

      // Try to prefetch again immediately
      const promise2 = prefetchManager.prefetch('test-key', fetchFn);

      await Promise.all([promise1, promise2]);

      // Should only call once
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should return cached data within TTL', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });

      await prefetchManager.prefetch('test-key', fetchFn);

      const cached1 = prefetchManager.getPrefetched('test-key');
      const cached2 = prefetchManager.getPrefetched('test-key');

      expect(cached1).toEqual(cached2);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should return null for expired cache', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });

      await prefetchManager.prefetch('test-key', fetchFn);

      // Manually expire the cache
      prefetchManager.clearExpired();

      // Should still be valid (not expired yet)
      const cached = prefetchManager.getPrefetched('test-key');
      expect(cached).toEqual({ data: 'test' });
    });

    it('should clear all cache', async () => {
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' });

      await prefetchManager.prefetch('key1', fetchFn);
      await prefetchManager.prefetch('key2', fetchFn);

      prefetchManager.clear();

      expect(prefetchManager.getPrefetched('key1')).toBeNull();
      expect(prefetchManager.getPrefetched('key2')).toBeNull();
    });
  });

  describe('Network Detection', () => {
    it('should detect slow network', () => {
      // Mock slow network
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '2g',
          saveData: false,
        },
      });

      expect(isSlowNetwork()).toBe(true);
    });

    it('should detect save data mode', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          saveData: true,
        },
      });

      expect(isSlowNetwork()).toBe(true);
    });

    it('should return false for fast network', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          saveData: false,
        },
      });

      expect(isSlowNetwork()).toBe(false);
    });
  });

  describe('Image Quality', () => {
    it('should return low quality for slow network', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '2g',
        },
      });

      expect(getOptimalImageQuality()).toBe('low');
    });

    it('should return medium quality for 3g', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '3g',
        },
      });

      expect(getOptimalImageQuality()).toBe('medium');
    });

    it('should return high quality for fast network', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
        },
      });

      expect(getOptimalImageQuality()).toBe('high');
    });
  });

  describe('Debounce', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should call with latest arguments', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('first');
      debounced('second');
      debounced('third');

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('third');
      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('Throttle', () => {
    it('should throttle function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttled();

      expect(fn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should call immediately on first invocation', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
