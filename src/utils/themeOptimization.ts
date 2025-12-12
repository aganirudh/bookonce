/**
 * Theme Performance Optimization Utilities
 * Provides utilities to optimize theme switching performance and minimize re-renders
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

// Define ResolvedTheme type locally to avoid circular imports
type ResolvedTheme = 'light' | 'dark' | 'high-contrast';
type Theme = 'light' | 'dark' | 'system' | 'high-contrast';

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function with immediate option
 */
export function debounceImmediate<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func(...args);
    }, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Memoized theme class generator
 */
export const useThemeClasses = (resolvedTheme: ResolvedTheme, isThemeSwitching: boolean) => {
  return useMemo(() => ({
    root: `theme-${resolvedTheme}`,
    body: `theme-${resolvedTheme}`,
    switching: isThemeSwitching ? 'theme-switching' : '',
    enhanced: 'theme-transition-enhanced',
  }), [resolvedTheme, isThemeSwitching]);
};

/**
 * Optimized theme change handler
 */
export const useOptimizedThemeChange = (
  setTheme: (theme: Theme) => void,
  delay: number = 100
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const optimizedSetTheme = useCallback((theme: Theme) => {
    // Clear any pending theme changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce rapid theme changes
    timeoutRef.current = setTimeout(() => {
      setTheme(theme);
    }, delay);
  }, [setTheme, delay]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return optimizedSetTheme;
};

/**
 * CSS recalculation minimizer
 */
export const minimizeCSSRecalculation = () => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Temporarily disable CSS transitions to prevent layout thrashing
  const disableTransitions = () => {
    root.style.setProperty('--theme-transition-duration', '0ms');
  };
  
  const enableTransitions = () => {
    root.style.removeProperty('--theme-transition-duration');
  };
  
  return { disableTransitions, enableTransitions };
};

/**
 * Performance monitoring for theme changes
 */
export class ThemePerformanceMonitor {
  private startTime: number = 0;
  private measurements: number[] = [];
  
  start() {
    this.startTime = performance.now();
  }
  
  end() {
    if (this.startTime === 0) return;
    
    const duration = performance.now() - this.startTime;
    this.measurements.push(duration);
    this.startTime = 0;
    
    // Keep only last 10 measurements
    if (this.measurements.length > 10) {
      this.measurements.shift();
    }
    
    return duration;
  }
  
  getAverageTime(): number {
    if (this.measurements.length === 0) return 0;
    return this.measurements.reduce((sum, time) => sum + time, 0) / this.measurements.length;
  }
  
  getLastTime(): number {
    return this.measurements[this.measurements.length - 1] || 0;
  }
  
  reset() {
    this.measurements = [];
    this.startTime = 0;
  }
}

/**
 * Browser capability detection for optimization
 */
export const detectOptimizationCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      supportsRequestIdleCallback: false,
      supportsIntersectionObserver: false,
      supportsResizeObserver: false,
      supportsPerformanceObserver: false,
    };
  }
  
  return {
    supportsRequestIdleCallback: 'requestIdleCallback' in window,
    supportsIntersectionObserver: 'IntersectionObserver' in window,
    supportsResizeObserver: 'ResizeObserver' in window,
    supportsPerformanceObserver: 'PerformanceObserver' in window,
  };
};

/**
 * Optimized portal theme application
 */
export const optimizePortalTheming = (resolvedTheme: ResolvedTheme) => {
  if (typeof window === 'undefined') return;
  
  const capabilities = detectOptimizationCapabilities();
  
  const applyThemeToPortals = () => {
    const portals = document.querySelectorAll('[data-radix-portal], [data-portal]');
    
    // Use requestIdleCallback if available for better performance
    const applyTheme = () => {
      portals.forEach((portal) => {
        portal.classList.remove('light', 'dark', 'high-contrast');
        portal.classList.add(resolvedTheme);
      });
    };
    
    if (capabilities.supportsRequestIdleCallback) {
      requestIdleCallback(applyTheme);
    } else {
      requestAnimationFrame(applyTheme);
    }
  };
  
  // Use IntersectionObserver to only theme visible portals if supported
  if (capabilities.supportsIntersectionObserver) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const portal = entry.target;
          portal.classList.remove('light', 'dark', 'high-contrast');
          portal.classList.add(resolvedTheme);
        }
      });
    });
    
    document.querySelectorAll('[data-radix-portal], [data-portal]').forEach((portal) => {
      observer.observe(portal);
    });
    
    return () => observer.disconnect();
  } else {
    applyThemeToPortals();
  }
};

/**
 * Memory-efficient theme state management
 */
export const createThemeStateManager = () => {
  const stateCache = new Map<string, any>();
  
  const get = (key: string) => stateCache.get(key);
  
  const set = (key: string, value: any) => {
    stateCache.set(key, value);
    
    // Prevent memory leaks by limiting cache size
    if (stateCache.size > 50) {
      const firstKey = stateCache.keys().next().value;
      stateCache.delete(firstKey);
    }
  };
  
  const clear = () => stateCache.clear();
  
  return { get, set, clear };
};

/**
 * Error boundary for theme operations
 */
export const safeThemeOperation = <T>(
  operation: () => T,
  fallback: T,
  errorHandler?: (error: Error) => void
): T => {
  try {
    return operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (errorHandler) {
      errorHandler(err);
    } else {
      console.warn('Theme operation failed:', err.message);
    }
    
    return fallback;
  }
};