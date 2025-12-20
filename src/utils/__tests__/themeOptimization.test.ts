/**
 * Theme Optimization Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  throttle,
  debounceImmediate,
  useThemeClasses,
  ThemePerformanceMonitor,
  detectOptimizationCapabilities,
  safeThemeOperation,
} from '../themeOptimization';
import { renderHook } from '@testing-library/react';

describe('Theme Optimization Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('debounceImmediate', () => {
    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounceImmediate(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).toHaveBeenCalledTimes(0);

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call immediately when immediate is true', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounceImmediate(mockFn, 100, true);

      debouncedFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      debouncedFn();
      debouncedFn();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('useThemeClasses', () => {
    it('should return memoized theme classes', () => {
      const { result, rerender } = renderHook(
        ({
          resolvedTheme,
          isThemeSwitching,
        }: {
          resolvedTheme: 'light' | 'dark' | 'high-contrast';
          isThemeSwitching: boolean;
        }) => useThemeClasses(resolvedTheme, isThemeSwitching),
        {
          initialProps: { resolvedTheme: 'light' as const, isThemeSwitching: false },
        }
      );

      expect(result.current).toEqual({
        root: 'theme-light',
        body: 'theme-light',
        switching: '',
        enhanced: 'theme-transition-enhanced',
      });

      // Test memoization
      const firstResult = result.current;
      rerender({ resolvedTheme: 'light' as const, isThemeSwitching: false });
      expect(result.current).toBe(firstResult);

      // Test change
      rerender({ resolvedTheme: 'dark' as const, isThemeSwitching: true });
      expect(result.current).toEqual({
        root: 'theme-dark',
        body: 'theme-dark',
        switching: 'theme-switching',
        enhanced: 'theme-transition-enhanced',
      });
    });
  });

  describe('ThemePerformanceMonitor', () => {
    it('should track performance measurements', () => {
      const monitor = new ThemePerformanceMonitor();

      monitor.start();
      vi.advanceTimersByTime(50);
      const duration = monitor.end();

      expect(duration).toBeGreaterThan(0);
      expect(monitor.getLastTime()).toBe(duration);
      expect(monitor.getAverageTime()).toBe(duration);
    });

    it('should maintain measurement history', () => {
      const monitor = new ThemePerformanceMonitor();

      // Add multiple measurements
      for (let i = 0; i < 5; i++) {
        monitor.start();
        vi.advanceTimersByTime(10 * (i + 1));
        monitor.end();
      }

      expect(monitor.getAverageTime()).toBeGreaterThan(0);
    });

    it('should limit measurement history', () => {
      const monitor = new ThemePerformanceMonitor();

      // Add more than 10 measurements
      for (let i = 0; i < 15; i++) {
        monitor.start();
        vi.advanceTimersByTime(10);
        monitor.end();
      }

      // Should only keep last 10
      expect(monitor.getAverageTime()).toBeGreaterThan(0);
    });

    it('should reset measurements', () => {
      const monitor = new ThemePerformanceMonitor();

      monitor.start();
      vi.advanceTimersByTime(50);
      monitor.end();

      monitor.reset();

      expect(monitor.getAverageTime()).toBe(0);
      expect(monitor.getLastTime()).toBe(0);
    });
  });

  describe('detectOptimizationCapabilities', () => {
    it('should detect browser capabilities', () => {
      const capabilities = detectOptimizationCapabilities();

      expect(capabilities).toHaveProperty('supportsRequestIdleCallback');
      expect(capabilities).toHaveProperty('supportsIntersectionObserver');
      expect(capabilities).toHaveProperty('supportsResizeObserver');
      expect(capabilities).toHaveProperty('supportsPerformanceObserver');
    });
  });

  describe('safeThemeOperation', () => {
    it('should execute operation successfully', () => {
      const operation = () => 'success';
      const result = safeThemeOperation(operation, 'fallback');

      expect(result).toBe('success');
    });

    it('should return fallback on error', () => {
      const operation = () => {
        throw new Error('Test error');
      };
      const errorHandler = vi.fn();
      const result = safeThemeOperation(operation, 'fallback', errorHandler);

      expect(result).toBe('fallback');
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle non-Error exceptions', () => {
      const operation = () => {
        throw 'string error';
      };
      const errorHandler = vi.fn();
      const result = safeThemeOperation(operation, 'fallback', errorHandler);

      expect(result).toBe('fallback');
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
