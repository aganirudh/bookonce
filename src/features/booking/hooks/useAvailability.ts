/**
 * useAvailability Hook
 * Custom hook for checking hotel availability with debouncing and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { bookingAPIService } from '../services/BookingAPIService';
import { addDays, format } from 'date-fns';
import type { AvailabilityResponse, AvailabilityParams } from '@/types/booking';

interface UseAvailabilityOptions {
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAvailabilityReturn {
  availability: AvailabilityResponse | null;
  isLoading: boolean;
  error: string | null;
  checkAvailability: (params: AvailabilityParams) => Promise<void>;
  clearAvailability: () => void;
}

/**
 * Hook for checking hotel availability with debouncing and caching
 * Automatically debounces requests and uses cached results when available
 */
export function useAvailability(
  options: UseAvailabilityOptions = {}
): UseAvailabilityReturn {
  const { debounceMs = 500, enabled = true } = options;

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkAvailability = useCallback(
    async (params: AvailabilityParams) => {
      if (!enabled) return;

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Set loading state immediately
      setIsLoading(true);
      setError(null);

      // Debounce the actual API call
      debounceTimerRef.current = setTimeout(async () => {
        try {
          abortControllerRef.current = new AbortController();

          const result = await bookingAPIService.checkAvailability(params);
          
          setAvailability(result);
          setError(null);

          // Prefetch likely next dates (next day, next week)
          const checkIn = new Date(params.checkInDate);
          const checkOut = new Date(params.checkOutDate);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

          // Prefetch next day
          const nextCheckIn = addDays(checkIn, 1);
          const nextCheckOut = addDays(nextCheckIn, nights);
          bookingAPIService.prefetchAvailability(
            params.hotelId,
            format(nextCheckIn, 'yyyy-MM-dd'),
            format(nextCheckOut, 'yyyy-MM-dd')
          ).catch(() => {
            // Ignore prefetch errors
          });

          // Prefetch next week
          const weekCheckIn = addDays(checkIn, 7);
          const weekCheckOut = addDays(weekCheckIn, nights);
          bookingAPIService.prefetchAvailability(
            params.hotelId,
            format(weekCheckIn, 'yyyy-MM-dd'),
            format(weekCheckOut, 'yyyy-MM-dd')
          ).catch(() => {
            // Ignore prefetch errors
          });
        } catch (err) {
          if (err instanceof Error) {
            // Don't set error if request was aborted
            if (err.name !== 'AbortError') {
              setError(err.message || 'Failed to check availability');
              setAvailability(null);
            }
          } else {
            setError('An unexpected error occurred');
            setAvailability(null);
          }
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [enabled, debounceMs]
  );

  const clearAvailability = useCallback(() => {
    setAvailability(null);
    setError(null);
    setIsLoading(false);

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    availability,
    isLoading,
    error,
    checkAvailability,
    clearAvailability,
  };
}
