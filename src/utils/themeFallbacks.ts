/**
 * Theme Fallback and Error Handling System
 * Provides comprehensive fallbacks for unsupported browsers and error recovery
 */

import { type Theme, type ResolvedTheme } from '@/contexts/ThemeContext';

/**
 * Browser support detection results
 */
export interface BrowserSupport {
  cssCustomProperties: boolean;
  matchMedia: boolean;
  localStorage: boolean;
  classList: boolean;
  requestAnimationFrame: boolean;
}

/**
 * Fallback theme configuration
 */
interface FallbackThemeConfig {
  light: Record<string, string>;
  dark: Record<string, string>;
  'high-contrast': Record<string, string>;
}

/**
 * Comprehensive browser support detection
 */
export const detectBrowserSupport = (): BrowserSupport => {
  if (typeof window === 'undefined') {
    return {
      cssCustomProperties: false,
      matchMedia: false,
      localStorage: false,
      classList: false,
      requestAnimationFrame: false,
    };
  }

  const support: BrowserSupport = {
    cssCustomProperties: false,
    matchMedia: false,
    localStorage: false,
    classList: false,
    requestAnimationFrame: false,
  };

  // Test CSS Custom Properties
  try {
    const testElement = document.createElement('div');
    testElement.style.setProperty('--test-prop', 'test-value');
    support.cssCustomProperties =
      testElement.style.getPropertyValue('--test-prop') === 'test-value';
  } catch {
    support.cssCustomProperties = false;
  }

  // Test matchMedia
  try {
    support.matchMedia =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)') !== null;
  } catch {
    support.matchMedia = false;
  }

  // Test localStorage
  try {
    const testKey = '__theme_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    support.localStorage = true;
  } catch {
    support.localStorage = false;
  }

  // Test classList
  try {
    const testElement = document.createElement('div');
    testElement.classList.add('test');
    support.classList = testElement.classList.contains('test');
  } catch {
    support.classList = false;
  }

  // Test requestAnimationFrame
  try {
    support.requestAnimationFrame = typeof window.requestAnimationFrame === 'function';
  } catch {
    support.requestAnimationFrame = false;
  }

  return support;
};

/**
 * Fallback CSS properties for browsers without CSS custom property support
 */
const fallbackThemeConfig: FallbackThemeConfig = {
  light: {
    backgroundColor: '#fafafa',
    color: '#1f2937',
    borderColor: '#e5e7eb',
    primaryColor: '#6366f1',
    secondaryColor: '#f3f4f6',
    mutedColor: '#6b7280',
  },
  dark: {
    backgroundColor: '#111827',
    color: '#f9fafb',
    borderColor: '#374151',
    primaryColor: '#6366f1',
    secondaryColor: '#1f2937',
    mutedColor: '#9ca3af',
  },
  'high-contrast': {
    backgroundColor: '#ffffff',
    color: '#000000',
    borderColor: '#000000',
    primaryColor: '#000000',
    secondaryColor: '#f0f0f0',
    mutedColor: '#333333',
  },
};

/**
 * Apply fallback styles for browsers without CSS custom property support
 */
export const applyFallbackStyles = (theme: ResolvedTheme): void => {
  if (typeof window === 'undefined') return;

  const support = detectBrowserSupport();

  if (support.cssCustomProperties) {
    // Browser supports CSS custom properties, no fallback needed
    return;
  }

  const themeConfig = fallbackThemeConfig[theme];
  const elements = document.querySelectorAll('*');

  // Apply fallback styles directly to elements
  elements.forEach(element => {
    const htmlElement = element as HTMLElement;

    // Apply background colors
    if (htmlElement.style.backgroundColor || htmlElement.classList.contains('bg-background')) {
      htmlElement.style.backgroundColor = themeConfig.backgroundColor;
    }

    // Apply text colors
    if (htmlElement.style.color || htmlElement.classList.contains('text-foreground')) {
      htmlElement.style.color = themeConfig.color;
    }

    // Apply border colors
    if (htmlElement.style.borderColor || htmlElement.classList.contains('border')) {
      htmlElement.style.borderColor = themeConfig.borderColor;
    }
  });
};

/**
 * Fallback theme detection for browsers without matchMedia support
 */
export const getFallbackSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';

  const support = detectBrowserSupport();

  if (support.matchMedia) {
    // Browser supports matchMedia, use normal detection
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  // Fallback: check for common dark mode indicators
  const hour = new Date().getHours();
  const isDarkTime = hour < 6 || hour > 18;

  // Use time-based heuristic as fallback
  return isDarkTime ? 'dark' : 'light';
};

/**
 * Fallback localStorage implementation using cookies
 */
export class FallbackStorage {
  private static isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getItem(key: string): string | null {
    if (this.isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }

    // Fallback to cookies
    try {
      const name = key + '=';
      const decodedCookie = decodeURIComponent(document.cookie);
      const cookieArray = decodedCookie.split(';');

      for (let cookie of cookieArray) {
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
          return cookie.substring(name.length, cookie.length);
        }
      }
    } catch {
      // Cookies also not available
    }

    return null;
  }

  static setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
      return;
    }

    // Fallback to cookies
    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1); // 1 year expiry
      document.cookie = `${key}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
    } catch {
      console.warn('Unable to store theme preference: localStorage and cookies unavailable');
    }
  }

  static removeItem(key: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(key);
      return;
    }

    // Fallback: expire the cookie
    try {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch {
      // Unable to remove cookie
    }
  }
}

/**
 * Fallback theme application for browsers without classList support
 */
export const applyFallbackThemeClass = (element: Element, theme: ResolvedTheme): void => {
  const support = detectBrowserSupport();

  if (support.classList) {
    // Browser supports classList, use normal method
    element.classList.remove('light', 'dark', 'high-contrast');
    element.classList.add(theme);
    return;
  }

  // Fallback: manipulate className directly
  try {
    const htmlElement = element as HTMLElement;
    let className = htmlElement.className || '';

    // Remove existing theme classes
    className = className.replace(/\b(light|dark|high-contrast)\b/g, '').trim();

    // Add new theme class
    className = className ? `${className} ${theme}` : theme;

    htmlElement.className = className;
  } catch (error) {
    console.warn('Failed to apply theme class:', error);
  }
};

/**
 * Fallback animation frame for browsers without requestAnimationFrame
 */
export const fallbackRequestAnimationFrame = (callback: () => void): void => {
  const support = detectBrowserSupport();

  if (support.requestAnimationFrame) {
    requestAnimationFrame(callback);
  } else {
    // Fallback to setTimeout
    setTimeout(callback, 16); // ~60fps
  }
};

/**
 * Error recovery system for theme operations
 */
export class ThemeErrorRecovery {
  private static errorCount = 0;
  private static maxErrors = 5;
  private static lastErrorTime = 0;
  private static errorCooldown = 5000; // 5 seconds

  static handleError(error: Error, operation: string, fallback?: () => void): void {
    const now = Date.now();

    // Reset error count if enough time has passed
    if (now - this.lastErrorTime > this.errorCooldown) {
      this.errorCount = 0;
    }

    this.errorCount++;
    this.lastErrorTime = now;

    console.warn(`Theme operation '${operation}' failed:`, error.message);

    // If too many errors, disable theme switching temporarily
    if (this.errorCount >= this.maxErrors) {
      console.error('Too many theme errors, disabling theme switching temporarily');
      this.disableThemeSwitching();
      return;
    }

    // Execute fallback if provided
    if (fallback) {
      try {
        fallback();
      } catch (fallbackError) {
        console.error('Fallback operation also failed:', fallbackError);
      }
    }
  }

  private static disableThemeSwitching(): void {
    // Add a temporary class to indicate theme switching is disabled
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme-disabled', 'true');

      // Re-enable after cooldown period
      setTimeout(() => {
        document.documentElement.removeAttribute('data-theme-disabled');
        this.errorCount = 0;
      }, this.errorCooldown * 2);
    }
  }

  static isThemeSwitchingDisabled(): boolean {
    if (typeof document === 'undefined') return false;
    return document.documentElement.hasAttribute('data-theme-disabled');
  }

  static reset(): void {
    this.errorCount = 0;
    this.lastErrorTime = 0;
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme-disabled');
    }
  }
}

/**
 * Graceful degradation for unsupported browsers
 */
export const initializeThemeFallbacks = (): void => {
  const support = detectBrowserSupport();

  // Log browser support status
  console.log('Theme system browser support:', support);

  // Apply necessary polyfills or fallbacks
  if (!support.cssCustomProperties) {
    console.warn('CSS Custom Properties not supported, using fallback styles');
    // Apply initial fallback theme
    applyFallbackStyles('light');
  }

  if (!support.matchMedia) {
    console.warn('matchMedia not supported, using fallback system theme detection');
  }

  if (!support.localStorage) {
    console.warn('localStorage not supported, using cookie fallback for theme persistence');
  }

  if (!support.classList) {
    console.warn('classList not supported, using className manipulation fallback');
  }

  if (!support.requestAnimationFrame) {
    console.warn('requestAnimationFrame not supported, using setTimeout fallback');
  }
};

/**
 * Safe theme operation wrapper with comprehensive error handling
 */
export const safeThemeOperation = <T>(
  operation: () => T,
  operationName: string,
  fallback: T,
  fallbackOperation?: () => void
): T => {
  if (ThemeErrorRecovery.isThemeSwitchingDisabled()) {
    console.warn(
      `Theme operation '${operationName}' skipped: theme switching temporarily disabled`
    );
    return fallback;
  }

  try {
    return operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    ThemeErrorRecovery.handleError(err, operationName, fallbackOperation);
    return fallback;
  }
};
