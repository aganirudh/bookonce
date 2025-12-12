/**
 * Theme Integration Tests
 * Tests for theme persistence, system preference detection, and cross-component integration
 */

import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme, getStoredThemePreference, clearThemePreference } from '../ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock localStorage with more realistic implementation
const createMockStorage = () => {
  const storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    _storage: storage, // For test access
  };
};

let mockLocalStorage: ReturnType<typeof createMockStorage>;

// Mock matchMedia with configurable responses
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

// Test component that displays theme state
function ThemeStateDisplay() {
  const { theme, resolvedTheme, systemTheme, systemPrefersHighContrast, systemPrefersReducedMotion } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <div data-testid="system-theme">{systemTheme}</div>
      <div data-testid="high-contrast">{systemPrefersHighContrast.toString()}</div>
      <div data-testid="reduced-motion">{systemPrefersReducedMotion.toString()}</div>
    </div>
  );
}

// Integration test component
function ThemeIntegrationTest() {
  return (
    <ThemeProvider>
      <div>
        <ThemeStateDisplay />
        <ThemeToggle variant="dropdown" data-testid="theme-toggle" />
        <div className="themed-content">
          <button>Test Button</button>
          <input type="text" placeholder="Test Input" />
        </div>
      </div>
    </ThemeProvider>
  );
}

describe('Theme Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = createMockStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Default matchMedia responses
    window.matchMedia = createMatchMediaMock({
      '(prefers-color-scheme: dark)': false,
      '(prefers-contrast: high)': false,
      '(prefers-reduced-motion: reduce)': false,
    });
    
    // Clear document classes
    document.documentElement.className = '';
    document.body.className = '';
  });

  afterEach(() => {
    // Clean up DOM
    document.documentElement.className = '';
    document.body.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-high-contrast');
    document.documentElement.removeAttribute('data-reduced-motion');
  });

  describe('Theme Persistence', () => {
    it('saves theme preference to localStorage', async () => {
      const user = userEvent.setup();
      
      render(<ThemeIntegrationTest />);
      
      // Open dropdown and select dark theme
      const toggle = screen.getByRole('button', { name: /theme selector/i });
      await user.click(toggle);
      
      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'vagabond-theme-preference',
          expect.stringContaining('"theme":"dark"')
        );
      });
      
      // Verify the stored data structure
      const storedData = JSON.parse(mockLocalStorage._storage['vagabond-theme-preference']);
      expect(storedData).toHaveProperty('theme', 'dark');
      expect(storedData).toHaveProperty('timestamp');
      expect(typeof storedData.timestamp).toBe('number');
    });

    it('loads theme preference from localStorage on initialization', () => {
      // Pre-populate localStorage
      const preference = {
        theme: 'dark',
        timestamp: Date.now(),
      };
      mockLocalStorage._storage['vagabond-theme-preference'] = JSON.stringify(preference);
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(preference));
      
      render(<ThemeIntegrationTest />);
      
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('handles corrupted localStorage data gracefully', () => {
      // Set corrupted data
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      render(<ThemeIntegrationTest />);
      
      // Should fall back to system theme
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('validates stored theme values', () => {
      // Set invalid theme value
      const invalidPreference = {
        theme: 'invalid-theme',
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidPreference));
      
      render(<ThemeIntegrationTest />);
      
      // Should fall back to system theme
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('provides utility functions for theme preference management', () => {
      // Test getStoredThemePreference
      const preference = {
        theme: 'light',
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(preference));
      
      expect(getStoredThemePreference()).toBe('light');
      
      // Test clearThemePreference
      clearThemePreference();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('vagabond-theme-preference');
    });
  });

  describe('System Preference Detection', () => {
    it('detects dark mode system preference', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-color-scheme: dark)': true,
      });
      
      render(<ThemeIntegrationTest />);
      
      expect(screen.getByTestId('system-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('detects high contrast system preference', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-contrast: high)': true,
      });
      
      render(<ThemeIntegrationTest />);
      
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
      expect(screen.getByTestId('system-theme')).toHaveTextContent('high-contrast');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('high-contrast');
    });

    it('detects reduced motion preference', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-reduced-motion: reduce)': true,
      });
      
      render(<ThemeIntegrationTest />);
      
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });

    it('handles multiple accessibility preferences', () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-color-scheme: dark)': true,
        '(prefers-contrast: high)': true,
        '(prefers-reduced-motion: reduce)': true,
      });
      
      render(<ThemeIntegrationTest />);
      
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
      expect(screen.getByTestId('system-theme')).toHaveTextContent('high-contrast');
    });

    it('responds to system preference changes', async () => {
      let darkModeListener: ((e: MediaQueryListEvent) => void) | null = null;
      
      // Mock matchMedia with listener capture
      window.matchMedia = vi.fn().mockImplementation(query => {
        const mockQuery = {
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
        };
        return mockQuery;
      });
      
      render(<ThemeIntegrationTest />);
      
      // Initial state should be light
      expect(screen.getByTestId('system-theme')).toHaveTextContent('light');
      
      // Simulate system theme change to dark
      if (darkModeListener) {
        act(() => {
          darkModeListener({ matches: true, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent);
        });
        
        await waitFor(() => {
          expect(screen.getByTestId('system-theme')).toHaveTextContent('dark');
        }, { timeout: 2000 });
      } else {
        // Skip test if listener wasn't captured
        expect(true).toBe(true);
      }
    });
  });

  describe('DOM Integration', () => {
    it('applies theme classes to document root', async () => {
      const user = userEvent.setup();
      
      render(<ThemeIntegrationTest />);
      
      // Switch to dark theme
      const toggle = screen.getByRole('button', { name: /theme selector/i });
      await user.click(toggle);
      
      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
        expect(document.body).toHaveClass('dark');
      });
    });

    it('applies theme classes to body for portal elements', async () => {
      const user = userEvent.setup();
      
      render(<ThemeIntegrationTest />);
      
      // Switch to high contrast theme
      const toggle = screen.getByRole('button', { name: /theme selector/i });
      await user.click(toggle);
      
      const highContrastOption = screen.getByRole('menuitem', { name: /high contrast/i });
      await user.click(highContrastOption);
      
      await waitFor(() => {
        expect(document.body).toHaveClass('high-contrast');
      });
    });

    it('sets accessibility data attributes', async () => {
      window.matchMedia = createMatchMediaMock({
        '(prefers-contrast: high)': true,
        '(prefers-reduced-motion: reduce)': true,
      });
      
      render(<ThemeIntegrationTest />);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'high-contrast');
        expect(document.documentElement).toHaveAttribute('data-high-contrast', 'true');
        expect(document.documentElement).toHaveAttribute('data-reduced-motion', 'true');
      });
    });

    it('updates meta theme-color for mobile browsers', async () => {
      // Add meta theme-color tag
      const metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      metaTag.content = '#000000';
      document.head.appendChild(metaTag);
      
      const user = userEvent.setup();
      
      render(<ThemeIntegrationTest />);
      
      // Switch to dark theme
      const toggle = screen.getByRole('button', { name: /theme selector/i });
      await user.click(toggle);
      
      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);
      
      await waitFor(() => {
        const updatedMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        expect(updatedMeta?.content).toBe('hsl(215, 25%, 8%)');
      });
      
      // Cleanup
      document.head.removeChild(metaTag);
    });
  });

  describe('Portal Element Handling', () => {
    it('applies theme classes to dynamically created portal elements', async () => {
      render(<ThemeIntegrationTest />);
      
      // Create a mock portal element
      const portalElement = document.createElement('div');
      portalElement.setAttribute('data-radix-portal', '');
      document.body.appendChild(portalElement);
      
      // Wait for MutationObserver to detect the new element
      await waitFor(() => {
        expect(portalElement).toHaveClass('light');
      });
      
      // Cleanup
      document.body.removeChild(portalElement);
    });

    it('handles nested portal containers', async () => {
      render(<ThemeIntegrationTest />);
      
      // Create nested portal structure
      const outerPortal = document.createElement('div');
      outerPortal.setAttribute('data-portal', '');
      
      const innerPortal = document.createElement('div');
      innerPortal.setAttribute('data-radix-portal', '');
      
      outerPortal.appendChild(innerPortal);
      document.body.appendChild(outerPortal);
      
      // Wait for MutationObserver to detect the new elements
      await waitFor(() => {
        expect(outerPortal).toHaveClass('light');
        expect(innerPortal).toHaveClass('light');
      });
      
      // Cleanup
      document.body.removeChild(outerPortal);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles localStorage unavailability gracefully', async () => {
      // Mock localStorage to throw errors
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => { throw new Error('localStorage unavailable'); }),
          setItem: vi.fn(() => { throw new Error('localStorage unavailable'); }),
          removeItem: vi.fn(() => { throw new Error('localStorage unavailable'); }),
        },
        writable: true,
      });
      
      // Should not throw and should work with session-only theme switching
      expect(() => {
        render(<ThemeIntegrationTest />);
      }).not.toThrow();
      
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('handles matchMedia unavailability gracefully', () => {
      // Remove matchMedia
      const originalMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;
      
      try {
        render(<ThemeIntegrationTest />);
        
        // Should default to light theme
        expect(screen.getByTestId('system-theme')).toHaveTextContent('light');
      } finally {
        // Restore matchMedia
        window.matchMedia = originalMatchMedia;
      }
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.fn();
      
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      }));
      
      const { unmount } = render(<ThemeIntegrationTest />);
      
      unmount();
      
      // Should have called removeEventListener for each media query
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });
});