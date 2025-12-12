/**
 * Theme Fallbacks and Error Handling Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectBrowserSupport,
  FallbackStorage,
  getFallbackSystemTheme,
  ThemeErrorRecovery,
  safeThemeOperation,
  initializeThemeFallbacks,
} from '../themeFallbacks';

// Mock DOM APIs
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const mockMatchMedia = vi.fn();

describe('Theme Fallbacks and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset global mocks
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    });

    // Reset error recovery
    ThemeErrorRecovery.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectBrowserSupport', () => {
    it('should detect CSS custom properties support', () => {
      const support = detectBrowserSupport();
      expect(support).toHaveProperty('cssCustomProperties');
      expect(support).toHaveProperty('matchMedia');
      expect(support).toHaveProperty('localStorage');
      expect(support).toHaveProperty('classList');
      expect(support).toHaveProperty('requestAnimationFrame');
    });

    it('should handle missing APIs gracefully', () => {
      // Mock missing APIs
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const support = detectBrowserSupport();
      expect(support.localStorage).toBe(false);
    });
  });

  describe('FallbackStorage', () => {
    it('should use localStorage when available', () => {
      mockLocalStorage.getItem.mockReturnValue('test-value');
      mockLocalStorage.setItem.mockImplementation(() => {});
      mockLocalStorage.removeItem.mockImplementation(() => {});

      const value = FallbackStorage.getItem('test-key');
      expect(value).toBe('test-value');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');

      FallbackStorage.setItem('test-key', 'new-value');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'new-value');

      FallbackStorage.removeItem('test-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should fallback to cookies when localStorage unavailable', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Mock document.cookie
      Object.defineProperty(document, 'cookie', {
        value: 'test-key=test-value; other=value',
        writable: true,
      });

      const value = FallbackStorage.getItem('test-key');
      expect(value).toBe('test-value');
    });

    it('should handle cookie fallback errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      // Mock document.cookie to throw
      Object.defineProperty(document, 'cookie', {
        get: () => {
          throw new Error('Cookies not available');
        },
        configurable: true,
      });

      const value = FallbackStorage.getItem('test-key');
      expect(value).toBeNull();
    });
  });

  describe('getFallbackSystemTheme', () => {
    it('should use matchMedia when available', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
      });

      const theme = getFallbackSystemTheme();
      expect(theme).toBe('dark');
    });

    it('should use time-based fallback when matchMedia unavailable', () => {
      mockMatchMedia.mockImplementation(() => {
        throw new Error('matchMedia not available');
      });

      // Mock time to be during dark hours (e.g., 10 PM)
      const mockDate = new Date();
      mockDate.setHours(22);
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const theme = getFallbackSystemTheme();
      expect(theme).toBe('dark');
    });

    it('should return light theme during day hours', () => {
      mockMatchMedia.mockImplementation(() => {
        throw new Error('matchMedia not available');
      });

      // Mock time to be during light hours (e.g., 2 PM)
      const mockDate = new Date();
      mockDate.setHours(14);
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const theme = getFallbackSystemTheme();
      expect(theme).toBe('light');
    });
  });

  describe('ThemeErrorRecovery', () => {
    it('should handle errors and execute fallback', () => {
      const fallback = vi.fn();
      const error = new Error('Test error');

      ThemeErrorRecovery.handleError(error, 'test-operation', fallback);

      expect(fallback).toHaveBeenCalled();
    });

    it('should disable theme switching after too many errors', () => {
      const error = new Error('Test error');

      // Trigger multiple errors
      for (let i = 0; i < 6; i++) {
        ThemeErrorRecovery.handleError(error, 'test-operation');
      }

      expect(ThemeErrorRecovery.isThemeSwitchingDisabled()).toBe(true);
    });

    it('should reset error count after cooldown', () => {
      vi.useFakeTimers();

      const error = new Error('Test error');
      ThemeErrorRecovery.handleError(error, 'test-operation');

      // Advance time past cooldown
      vi.advanceTimersByTime(6000);

      ThemeErrorRecovery.handleError(error, 'test-operation');
      expect(ThemeErrorRecovery.isThemeSwitchingDisabled()).toBe(false);

      vi.useRealTimers();
    });

    it('should reset state manually', () => {
      const error = new Error('Test error');

      // Trigger multiple errors
      for (let i = 0; i < 6; i++) {
        ThemeErrorRecovery.handleError(error, 'test-operation');
      }

      expect(ThemeErrorRecovery.isThemeSwitchingDisabled()).toBe(true);

      ThemeErrorRecovery.reset();
      expect(ThemeErrorRecovery.isThemeSwitchingDisabled()).toBe(false);
    });
  });

  describe('safeThemeOperation', () => {
    it('should execute operation successfully', () => {
      const operation = () => 'success';
      const result = safeThemeOperation(operation, 'test-operation', 'fallback');

      expect(result).toBe('success');
    });

    it('should return fallback on error', () => {
      const operation = () => {
        throw new Error('Test error');
      };
      const fallbackOperation = vi.fn();
      const result = safeThemeOperation(operation, 'test-operation', 'fallback', fallbackOperation);

      expect(result).toBe('fallback');
      expect(fallbackOperation).toHaveBeenCalled();
    });

    it('should skip operation when theme switching is disabled', () => {
      // Disable theme switching
      for (let i = 0; i < 6; i++) {
        ThemeErrorRecovery.handleError(new Error('Test error'), 'test-operation');
      }

      const operation = vi.fn(() => 'success');
      const result = safeThemeOperation(operation, 'test-operation', 'fallback');

      expect(operation).not.toHaveBeenCalled();
      expect(result).toBe('fallback');
    });
  });

  describe('initializeThemeFallbacks', () => {
    it('should initialize without errors', () => {
      expect(() => initializeThemeFallbacks()).not.toThrow();
    });

    it('should log browser support status', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      initializeThemeFallbacks();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Theme system browser support:',
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });
});