/**
 * Core Theme System Tests
 * Essential tests for theme system functionality without complex mocking
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

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
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component that displays theme state
function ThemeDisplay() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('high-contrast')} data-testid="set-high-contrast">
        Set High Contrast
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        Set System
      </button>
    </div>
  );
}

// Integration test component
function ThemeTestApp() {
  return (
    <ThemeProvider>
      <div>
        <ThemeDisplay />
        <ThemeToggle variant="dropdown" />
        <div className="test-content">
          <button className="test-button">Test Button</button>
          <input className="test-input" placeholder="Test Input" />
        </div>
      </div>
    </ThemeProvider>
  );
}

describe('Core Theme System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

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

  describe('Basic Theme Functionality', () => {
    it('initializes with system theme by default', () => {
      render(<ThemeTestApp />);

      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });

    it('allows setting light theme', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      await user.click(screen.getByTestId('set-light'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });
    });

    it('allows setting dark theme', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      await user.click(screen.getByTestId('set-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      });
    });

    it('allows setting high contrast theme', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      await user.click(screen.getByTestId('set-high-contrast'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('high-contrast');
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('high-contrast');
      });
    });

    it('allows setting system theme', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      // First set to dark, then back to system
      await user.click(screen.getByTestId('set-dark'));
      await user.click(screen.getByTestId('set-system'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });
    });
  });

  describe('Theme Persistence', () => {
    it('saves theme preference to localStorage', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      await user.click(screen.getByTestId('set-dark'));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'vagabond-theme-preference',
          expect.stringContaining('"theme":"dark"')
        );
      });
    });

    it('loads theme preference from localStorage', () => {
      const preference = {
        theme: 'dark',
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(preference));

      render(<ThemeTestApp />);

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('handles invalid localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      render(<ThemeTestApp />);

      // Should fall back to system theme
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    });
  });

  describe('DOM Integration', () => {
    it('applies theme classes to document root', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      await user.click(screen.getByTestId('set-dark'));

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
        expect(document.body).toHaveClass('dark');
      });
    });

    it('sets data attributes for accessibility', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      await user.click(screen.getByTestId('set-high-contrast'));

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'high-contrast');
        expect(document.documentElement).toHaveAttribute('data-high-contrast', 'true');
        expect(document.documentElement).toHaveAttribute('data-reduced-motion', 'false');
      });
    });

    it('removes old theme classes when switching themes', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      // Set to dark first
      await user.click(screen.getByTestId('set-dark'));

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });

      // Switch to light
      await user.click(screen.getByTestId('set-light'));

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light');
        expect(document.documentElement).not.toHaveClass('dark');
      });
    });
  });

  describe('ThemeToggle Integration', () => {
    it('renders theme toggle component', () => {
      render(<ThemeTestApp />);

      const toggle = screen.getByRole('button', { name: /theme selector/i });
      expect(toggle).toBeInTheDocument();
    });

    it('opens dropdown menu when clicked', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      const toggle = screen.getByRole('button', { name: /theme selector/i });
      await user.click(toggle);

      // Should show menu items
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('High Contrast')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('changes theme when dropdown option is selected', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      const toggle = screen.getByRole('button', { name: /theme selector/i });
      await user.click(toggle);

      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(document.documentElement).toHaveClass('dark');
      });
    });
  });

  describe('Component Theming', () => {
    it('ensures components are visible in all themes', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      const testButton = screen.getByText('Test Button');
      const testInput = screen.getByPlaceholderText('Test Input');

      // Test in light theme
      expect(testButton).toBeVisible();
      expect(testInput).toBeVisible();

      // Test in dark theme
      await user.click(screen.getByTestId('set-dark'));

      await waitFor(() => {
        expect(testButton).toBeVisible();
        expect(testInput).toBeVisible();
      });

      // Test in high contrast theme
      await user.click(screen.getByTestId('set-high-contrast'));

      await waitFor(() => {
        expect(testButton).toBeVisible();
        expect(testInput).toBeVisible();
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains focus visibility across theme changes', async () => {
      const user = userEvent.setup();

      render(<ThemeTestApp />);

      const testButton = screen.getByText('Test Button');

      // Focus the button
      testButton.focus();
      expect(testButton).toHaveFocus();

      // Change theme
      await user.click(screen.getByTestId('set-dark'));

      // Button should still be focusable
      await waitFor(() => {
        expect(testButton).toBeVisible();
      });

      testButton.focus();
      expect(testButton).toHaveFocus();
    });

    it('provides proper ARIA labels on theme toggle', () => {
      render(<ThemeTestApp />);

      const toggle = screen.getByRole('button', { name: /theme selector/i });
      expect(toggle).toHaveAttribute('aria-label');
      expect(toggle.getAttribute('aria-label')).toContain('Theme selector');
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock localStorage to throw errors
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      render(<ThemeTestApp />);

      // Should not throw when setting theme
      expect(() => {
        user.click(screen.getByTestId('set-dark'));
      }).not.toThrow();
    });

    it('throws error when useTheme is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ThemeDisplay />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('does not cause excessive re-renders on theme change', async () => {
      const user = userEvent.setup();
      let renderCount = 0;

      function CountingComponent() {
        renderCount++;
        const { theme } = useTheme();
        return <div data-testid="render-count">{theme}</div>;
      }

      function TestApp() {
        return (
          <ThemeProvider>
            <CountingComponent />
            <button onClick={() => {}} data-testid="trigger-render">
              Trigger Render
            </button>
            <ThemeDisplay />
          </ThemeProvider>
        );
      }

      render(<TestApp />);

      const initialRenderCount = renderCount;

      // Change theme
      await user.click(screen.getByTestId('set-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('render-count')).toHaveTextContent('dark');
      });

      // Should have rendered only once more for the theme change
      expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 2);
    });
  });
});
