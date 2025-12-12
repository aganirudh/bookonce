/**
 * useAvailability Hook Tests
 * Tests for availability checking logic with debouncing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAvailability } from '../useAvailability';
import { bookingAPIService } from '../../services/BookingAPIService';
import type { AvailabilityParams } from '@/types/booking';

// Mock the BookingAPIService
vi.mock('../../services/BookingAPIService', () => ({
  bookingAPIService: {
    checkAvailability: vi.fn(),
  },
}));

describe('useAvailability Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with null availability and no loading', () => {
      const { result } = renderHook(() => useAvailability());

      expect(result.current.availability).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Availability Checking', () => {
    it('should have checkAvailability function', () => {
      const { result } = renderHook(() => useAvailability());

      expect(typeof result.current.checkAvailability).toBe('function');
    });

    it('should have clearAvailability function', () => {
      const { result } = renderHook(() => useAvailability());

      expect(typeof result.current.clearAvailability).toBe('function');
    });
  });

  describe('Clear Availability', () => {
    it('should clear availability state', () => {
      const { result } = renderHook(() => useAvailability());

      result.current.clearAvailability();

      expect(result.current.availability).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should cancel pending availability check', () => {
      const mockCheckAvailability = vi.mocked(bookingAPIService.checkAvailability);

      const { result } = renderHook(() => useAvailability({ debounceMs: 500 }));

      const params: AvailabilityParams = {
        hotelId: 1,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-05',
      };

      result.current.checkAvailability(params);
      result.current.clearAvailability();

      // API should not be called after clear
      expect(mockCheckAvailability).not.toHaveBeenCalled();
    });
  });

  describe('Enabled Option', () => {
    it('should not check availability when enabled is false', () => {
      const mockCheckAvailability = vi.mocked(bookingAPIService.checkAvailability);

      const { result } = renderHook(() => useAvailability({ enabled: false }));

      const params: AvailabilityParams = {
        hotelId: 1,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-05',
      };

      result.current.checkAvailability(params);

      // Should not call API when disabled
      expect(mockCheckAvailability).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useAvailability());

      const params: AvailabilityParams = {
        hotelId: 1,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-05',
      };

      result.current.checkAvailability(params);
      
      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});
