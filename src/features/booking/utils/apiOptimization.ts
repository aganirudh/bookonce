/**
 * API Optimization Utilities
 * Provides request compression, payload reduction, and prefetching for mobile networks
 */

import type { AvailabilityResponse, PricingDetails, Hotel } from '@/types/booking';

/**
 * Compress request payload by removing unnecessary fields
 */
export function compressRequestPayload<T extends Record<string, any>>(
  payload: T,
  fieldsToKeep?: string[]
): Partial<T> {
  if (!fieldsToKeep) {
    return payload;
  }

  const compressed: Partial<T> = {};
  fieldsToKeep.forEach((field) => {
    if (field in payload) {
      compressed[field as keyof T] = payload[field];
    }
  });

  return compressed;
}

/**
 * Reduce response payload size by removing unnecessary data
 */
export function reduceResponsePayload<T>(
  response: T,
  options?: {
    removeImages?: boolean;
    removeDescriptions?: boolean;
    limitArrays?: number;
  }
): T {
  if (!response || typeof response !== 'object') {
    return response;
  }

  const reduced = { ...response } as any;

  // Remove images if requested
  if (options?.removeImages) {
    if ('image' in reduced) delete reduced.image;
    if ('images' in reduced) delete reduced.images;
  }

  // Remove descriptions if requested
  if (options?.removeDescriptions) {
    if ('description' in reduced) delete reduced.description;
  }

  // Limit array sizes
  if (options?.limitArrays) {
    Object.keys(reduced).forEach((key) => {
      if (Array.isArray(reduced[key]) && reduced[key].length > options.limitArrays!) {
        reduced[key] = reduced[key].slice(0, options.limitArrays);
      }
    });
  }

  return reduced as T;
}

/**
 * Optimize availability response for mobile
 */
export function optimizeAvailabilityResponse(
  response: AvailabilityResponse,
  isMobile: boolean
): AvailabilityResponse {
  if (!isMobile) {
    return response;
  }

  return {
    ...response,
    rooms: response.rooms.map((room) => ({
      ...room,
      // Limit images to first 2 on mobile
      images: room.images.slice(0, 2),
      // Keep only essential amenities
      amenities: room.amenities.slice(0, 5),
    })),
    // Limit alternative dates
    alternativeDates: response.alternativeDates?.slice(0, 3),
  };
}

/**
 * Optimize hotel data for mobile
 */
export function optimizeHotelData(hotel: Hotel, isMobile: boolean): Hotel {
  if (!isMobile) {
    return hotel;
  }

  return {
    ...hotel,
    // Limit amenities
    amenities: hotel.amenities.slice(0, 5),
    // Limit tags
    tags: hotel.tags.slice(0, 3),
  };
}

/**
 * Prefetch likely next step data
 */
export class PrefetchManager {
  private prefetchQueue: Map<string, Promise<any>> = new Map();
  private prefetchCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Prefetch data for a given key
   */
  async prefetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    force = false
  ): Promise<void> {
    // Check if already prefetching
    if (this.prefetchQueue.has(key) && !force) {
      return;
    }

    // Check cache
    const cached = this.prefetchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL && !force) {
      return;
    }

    // Start prefetch
    const promise = fetchFn()
      .then((data) => {
        this.prefetchCache.set(key, { data, timestamp: Date.now() });
        this.prefetchQueue.delete(key);
        return data;
      })
      .catch((error) => {
        console.error(`Prefetch failed for ${key}:`, error);
        this.prefetchQueue.delete(key);
        throw error;
      });

    this.prefetchQueue.set(key, promise);
  }

  /**
   * Get prefetched data
   */
  getPrefetched<T>(key: string): T | null {
    const cached = this.prefetchCache.get(key);
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.prefetchCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Clear prefetch cache
   */
  clear(): void {
    this.prefetchQueue.clear();
    this.prefetchCache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.prefetchCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.prefetchCache.delete(key);
      }
    }
  }
}

// Singleton instance
export const prefetchManager = new PrefetchManager();

/**
 * Detect if user is on a slow network
 */
export function isSlowNetwork(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      // Check effective type
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return true;
      }
      // Check if save data is enabled
      if (connection.saveData) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get optimal image quality based on network
 */
export function getOptimalImageQuality(): 'low' | 'medium' | 'high' {
  if (isSlowNetwork()) {
    return 'low';
  }

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection?.effectiveType === '3g') {
      return 'medium';
    }
  }

  return 'high';
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
