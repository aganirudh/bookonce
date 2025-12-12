/**
 * Theme Context
 * Provides theme state and switching functionality throughout the application
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Available theme options
 */
export type Theme = 'light' | 'dark' | 'system' | 'high-contrast';

/**
 * Resolved theme (actual theme being applied)
 */
export type ResolvedTheme = 'light' | 'dark' | 'high-contrast';

/**
 * Theme context interface
 */
interface ThemeContextType {
  /** Current theme setting (light, dark, system, or high-contrast) */
  theme: Theme;
  /** Actual theme being applied (light, dark, or high-contrast) */
  resolvedTheme: ResolvedTheme;
  /** System's preferred theme */
  systemTheme: ResolvedTheme;
  /** Function to change theme */
  setTheme: (theme: Theme) => void;
  /** Whether high contrast mode is preferred by system */
  systemPrefersHighContrast: boolean;
  /** Whether reduced motion is preferred by system */
  systemPrefersReducedMotion: boolean;
  /** Whether theme is currently switching (loading state) */
  isThemeSwitching: boolean;
  /** Preview a theme without applying it */
  previewTheme: (theme: Theme | null) => void;
  /** Currently previewed theme */
  previewedTheme: Theme | null;
  /** Whether browser supports required features */
  browserSupport: {
    cssCustomProperties: boolean;
    matchMedia: boolean;
    localStorage: boolean;
  };
}

/**
 * Theme preference storage
 */
interface ThemePreference {
  theme: Theme;
  timestamp: number;
}

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * localStorage key for theme preference
 */
const THEME_STORAGE_KEY = 'bookonce-theme-preference';

/**
 * Media query for system dark mode preference
 */
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/**
 * Detect system theme preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  
  try {
    // Check for high contrast preference first
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return 'high-contrast';
    }
    return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Detect system high contrast preference
 */
function getSystemHighContrastPreference(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.matchMedia('(prefers-contrast: high)').matches;
  } catch {
    return false;
  }
}

/**
 * Detect system reduced motion preference
 */
function getSystemReducedMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}



/**
 * Debounce function for performance optimization
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Load theme preference from localStorage
 */
function loadThemePreference(): Theme {
  if (typeof window === 'undefined') return 'system';
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (!stored) return 'system';
    
    const preference: ThemePreference = JSON.parse(stored);
    
    // Validate the stored theme
    if (['light', 'dark', 'system', 'high-contrast'].includes(preference.theme)) {
      return preference.theme;
    }
  } catch (error) {
    console.warn('Failed to load theme preference:', error);
  }
  
  return 'system';
}

/**
 * Save theme preference to localStorage
 */
function saveThemePreference(theme: Theme): void {
  if (typeof window === 'undefined') return;
  
  try {
    const preference: ThemePreference = {
      theme,
      timestamp: Date.now(),
    };
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.warn('Failed to save theme preference:', error);
  }
}

/**
 * Apply theme to document and portal elements
 */
function applyTheme(resolvedTheme: ResolvedTheme, systemPrefersReducedMotion: boolean): void {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Add theme-switching class to disable transitions temporarily (unless reduced motion is preferred)
  if (!systemPrefersReducedMotion) {
    root.classList.add('theme-switching');
  }
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark', 'high-contrast');
  
  // Apply new theme class
  root.classList.add(resolvedTheme);
  
  // Apply theme classes to body as well for portal elements
  document.body.classList.remove('light', 'dark', 'high-contrast');
  document.body.classList.add(resolvedTheme);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    let backgroundColor: string;
    switch (resolvedTheme) {
      case 'dark':
        backgroundColor = 'hsl(215, 25%, 8%)';
        break;
      case 'high-contrast':
        backgroundColor = 'hsl(0, 0%, 100%)';
        break;
      default:
        backgroundColor = 'hsl(0, 0%, 98%)';
    }
    metaThemeColor.setAttribute('content', backgroundColor);
  }
  
  // Apply theme to any existing portal containers
  const portalContainers = document.querySelectorAll('[data-radix-portal], [data-portal]');
  portalContainers.forEach((container) => {
    container.classList.remove('light', 'dark', 'high-contrast');
    container.classList.add(resolvedTheme);
  });
  
  // Add accessibility attributes
  root.setAttribute('data-theme', resolvedTheme);
  root.setAttribute('data-high-contrast', resolvedTheme === 'high-contrast' ? 'true' : 'false');
  root.setAttribute('data-reduced-motion', systemPrefersReducedMotion ? 'true' : 'false');
  
  // Remove theme-switching class after a brief delay to re-enable transitions
  if (!systemPrefersReducedMotion) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('theme-switching');
        document.body.classList.remove('theme-switching');
      });
    });
  }
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const [systemPrefersHighContrast, setSystemPrefersHighContrast] = useState<boolean>(() => getSystemHighContrastPreference());
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState<boolean>(() => getSystemReducedMotionPreference());

  
  /**
   * Calculate resolved theme based on current theme and system preference
   */
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme === 'high-contrast' ? 'high-contrast' : theme;
  
  /**
   * Initialize theme from localStorage and system preference
   */
  useEffect(() => {
    const savedTheme = loadThemePreference();
    setThemeState(savedTheme);
  }, []);
  
  /**
   * Listen for system theme and accessibility preference changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const darkModeQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY);
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleSystemThemeChange = () => {
      const newSystemTheme = getSystemTheme();
      setSystemTheme(newSystemTheme);
    };
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setSystemPrefersHighContrast(e.matches);
      // If user prefers high contrast and is on system theme, switch to high contrast
      if (e.matches && theme === 'system') {
        setSystemTheme('high-contrast');
      } else if (!e.matches && systemTheme === 'high-contrast') {
        // Switch back to regular system theme
        setSystemTheme(darkModeQuery.matches ? 'dark' : 'light');
      }
    };
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setSystemPrefersReducedMotion(e.matches);
    };
    
    // Set initial values
    setSystemTheme(getSystemTheme());
    setSystemPrefersHighContrast(getSystemHighContrastPreference());
    setSystemPrefersReducedMotion(getSystemReducedMotionPreference());
    
    // Listen for changes
    const addListeners = (query: MediaQueryList, handler: (e: MediaQueryListEvent) => void) => {
      if (query.addEventListener) {
        query.addEventListener('change', handler);
      } else {
        // Fallback for older browsers
        query.addListener(handler);
      }
    };
    
    const removeListeners = (query: MediaQueryList, handler: (e: MediaQueryListEvent) => void) => {
      if (query.removeEventListener) {
        query.removeEventListener('change', handler);
      } else {
        // Fallback for older browsers
        query.removeListener(handler);
      }
    };
    
    addListeners(darkModeQuery, handleSystemThemeChange);
    addListeners(highContrastQuery, handleHighContrastChange);
    addListeners(reducedMotionQuery, handleReducedMotionChange);
    
    return () => {
      removeListeners(darkModeQuery, handleSystemThemeChange);
      removeListeners(highContrastQuery, handleHighContrastChange);
      removeListeners(reducedMotionQuery, handleReducedMotionChange);
    };
  }, [theme, systemTheme]);
  
  /**
   * Apply theme to document when resolved theme changes
   */
  useEffect(() => {
    applyTheme(resolvedTheme, systemPrefersReducedMotion);
  }, [resolvedTheme, systemPrefersReducedMotion]);
  
  /**
   * Watch for dynamically created portal elements and apply theme classes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if the added element is a portal container
            if (
              element.hasAttribute('data-radix-portal') ||
              element.hasAttribute('data-portal') ||
              element.querySelector('[data-radix-portal], [data-portal]')
            ) {
              // Apply theme class to the portal container
              element.classList.remove('light', 'dark', 'high-contrast');
              element.classList.add(resolvedTheme);
              
              // Also apply to any nested portal containers
              const nestedPortals = element.querySelectorAll('[data-radix-portal], [data-portal]');
              nestedPortals.forEach((portal) => {
                portal.classList.remove('light', 'dark', 'high-contrast');
                portal.classList.add(resolvedTheme);
              });
            }
          }
        });
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    return () => {
      observer.disconnect();
    };
  }, [resolvedTheme]);
  
  /**
   * Set theme and save to localStorage
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveThemePreference(newTheme);
  };
  
  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    systemPrefersHighContrast,
    systemPrefersReducedMotion,
    isThemeSwitching: false,
    previewTheme: () => {},
    previewedTheme: null,
    browserSupport: {
      cssCustomProperties: true,
      matchMedia: true,
      localStorage: true,
    },
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Get current theme preference from localStorage
 */
export function getStoredThemePreference(): Theme {
  return loadThemePreference();
}

/**
 * Clear theme preference from localStorage
 */
export function clearThemePreference(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear theme preference:', error);
  }
}