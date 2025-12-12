/**
 * useTheme Hook Tests
 * Unit tests for the useTheme hook functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTheme, ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
const createMatchMediaMock = (responses: Record<string, boolean>) => 
  vi.fn().mockImplementation(query => ({
    matches: responses[query] || false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

// Wrapper component for hook testing
function ThemeWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('useTheme Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Default matchMedia responses
    window.matchMedia = createMatchMediaMock({
      '(prefers-color-scheme: dark)': false,
      '(prefers-contrast: high)': false,
      '(prefers-reduced-motion: reduce)': false,
    });
  });

  describe('Hook Return Values', () => {
    it('returns correct initial values', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light');
      expect(result.current.systemTheme).toBe('light');
      expect(result.current.systemPrefersHighContrast).toBe(false);
      expect(result.current.systemPrefersReducedMotion).toBe(false);
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('returns correct values with dark system preference', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-color-scheme: dark)': true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current.systemTheme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('returns correct values with high contrast preference', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-contrast: high)': true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current.systemPrefersHighContrast).toBe(true);
      expect(result.current.systemTheme).toBe('high-contrast');
      expect(result.current.resolvedTheme).toBe('high-contrast');
    });

    it('returns correct values with reduced motion preference', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-reduced-motion: reduce)': true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current.systemPrefersReducedMotion).toBe(true);
    });
  });

  describe('Theme Setting Functionality', () => {
    it('allows setting light theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      act(() => {
        result.current.setTheme('light');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
        expect(result.current.resolvedTheme).toBe('light');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'vagabond-theme-preference',
        expect.stringContaining('"theme":"light"')
      );
    });

    it('allows setting dark theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
        expect(result.current.resolvedTheme).toBe('dark');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'vagabond-theme-preference',
        expect.stringContaining('"theme":"dark"')
      );
    });

    it('allows setting high contrast theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      act(() => {
        result.current.setTheme('high-contrast');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('high-contrast');
        expect(result.current.resolvedTheme).toBe('high-contrast');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'vagabond-theme-preference',
        expect.stringContaining('"theme":"high-contrast"')
      );
    });

    it('allows setting system theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      // First set to a specific theme
      act(() => {
        result.current.setTheme('dark');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      // Then set back to system
      act(() => {
        result.current.setTheme('system');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
        expect(result.current.resolvedTheme).toBe(result.current.systemTheme);
      });
    });
  });

  describe('Resolved Theme Logic', () => {
    it('resolves system theme to light when system prefers light', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-color-scheme: dark)': false,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.systemTheme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('resolves system theme to dark when system prefers dark', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-color-scheme: dark)': true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.systemTheme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('resolves system theme to high-contrast when system prefers high contrast', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-contrast: high)': true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.systemTheme).toBe('high-contrast');
      expect(result.current.resolvedTheme).toBe('high-contrast');
    });

    it('resolves explicit theme regardless of system preference', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-color-scheme: dark)': true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.systemTheme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('light');
    });
  });

  describe('Persistence Integration', () => {
    it('loads saved theme preference on initialization', () => {
      const preference = {
        theme: 'dark',
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(preference));

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('saves theme preference when changed', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'vagabond-theme-preference',
          expect.stringContaining('"theme":"dark"')
        );
      });

      // Verify the saved data structure
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);
      
      expect(parsedData).toHaveProperty('theme', 'dark');
      expect(parsedData).toHaveProperty('timestamp');
      expect(typeof parsedData.timestamp).toBe('number');
    });

    it('handles localStorage errors gracefully', async () => {
      // Mock localStorage to throw errors
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      // Should not throw when setting theme
      expect(() => {
        act(() => {
          result.current.setTheme('dark');
        });
      }).not.toThrow();

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });
    });
  });

  describe('System Preference Changes', () => {
    it('updates system theme when media query changes', async () => {
      let darkModeListener: ((e: MediaQueryListEvent) => void) | null = null;
      
      // Mock matchMedia with listener capture
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, listener) => {
          if (query === '(prefers-color-scheme: dark)' && event === 'change') {
            darkModeListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      // Initial state should be light
      expect(result.current.systemTheme).toBe('light');

      // Simulate system theme change to dark
      if (darkModeListener) {
        act(() => {
          darkModeListener({ matches: true } as MediaQueryListEvent);
        });

        await waitFor(() => {
          expect(result.current.systemTheme).toBe('dark');
        });
      }
    });

    it('updates resolved theme when on system preference and system changes', async () => {
      let darkModeListener: ((e: MediaQueryListEvent) => void) | null = null;
      
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, listener) => {
          if (query === '(prefers-color-scheme: dark)' && event === 'change') {
            darkModeListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      // Should be on system theme by default
      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light');

      // Simulate system change to dark
      if (darkModeListener) {
        act(() => {
          darkModeListener({ matches: true } as MediaQueryListEvent);
        });

        await waitFor(() => {
          expect(result.current.resolvedTheme).toBe('dark');
        });
      }
    });

    it('does not update resolved theme when on explicit theme and system changes', async () => {
      let darkModeListener: ((e: MediaQueryListEvent) => void) | null = null;
      
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, listener) => {
          if (query === '(prefers-color-scheme: dark)' && event === 'change') {
            darkModeListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      // Set explicit light theme
      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.resolvedTheme).toBe('light');

      // Simulate system change to dark
      if (darkModeListener) {
        act(() => {
          darkModeListener({ matches: true } as MediaQueryListEvent);
        });

        await waitFor(() => {
          // Resolved theme should remain light (explicit preference)
          expect(result.current.resolvedTheme).toBe('light');
          // But system theme should update
          expect(result.current.systemTheme).toBe('dark');
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });

    it('handles matchMedia unavailability gracefully', () => {
      // Remove matchMedia
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeWrapper,
      });

      // Should default to light theme
      expect(result.current.systemTheme).toBe('light');
      expect(result.current.systemPrefersHighContrast).toBe(false);
      expect(result.current.systemPrefersReducedMotion).toBe(false);
    });
  });
});