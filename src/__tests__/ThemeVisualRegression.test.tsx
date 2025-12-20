/**
 * Theme Visual Regression Tests
 * Tests for visual consistency across themes and components
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

// Test component that displays various UI elements
function ComponentShowcase() {
  const { theme, resolvedTheme } = useTheme();

  return (
    <div className="p-6 space-y-6" data-testid="showcase">
      <div data-testid="theme-info">
        <span data-testid="current-theme">{theme}</span>
        <span data-testid="resolved-theme">{resolvedTheme}</span>
      </div>

      <Card data-testid="test-card">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a test card to verify theming consistency.</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button variant="default" data-testid="button-default">
          Default Button
        </Button>
        <Button variant="secondary" data-testid="button-secondary">
          Secondary Button
        </Button>
        <Button variant="outline" data-testid="button-outline">
          Outline Button
        </Button>
        <Button variant="ghost" data-testid="button-ghost">
          Ghost Button
        </Button>
        <Button variant="destructive" data-testid="button-destructive">
          Destructive Button
        </Button>
      </div>

      <div className="space-y-4">
        <Input placeholder="Test input field" data-testid="test-input" />
        <Input type="password" placeholder="Password field" data-testid="password-input" />
        <Input disabled placeholder="Disabled input" data-testid="disabled-input" />
      </div>

      <div className="space-y-2">
        <Badge variant="default" data-testid="badge-default">
          Default
        </Badge>
        <Badge variant="secondary" data-testid="badge-secondary">
          Secondary
        </Badge>
        <Badge variant="destructive" data-testid="badge-destructive">
          Destructive
        </Badge>
        <Badge variant="outline" data-testid="badge-outline">
          Outline
        </Badge>
      </div>

      <div data-testid="theme-toggle">
        <ThemeToggle variant="dropdown" />
      </div>
    </div>
  );
}

// Test wrapper with theme provider
function ThemedShowcase() {
  return (
    <ThemeProvider>
      <ComponentShowcase />
    </ThemeProvider>
  );
}

describe('Theme Visual Regression Tests', () => {
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

  describe('Theme Application Consistency', () => {
    it('applies light theme classes consistently', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      // Switch to light theme explicitly
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const lightOption = screen.getByRole('menuitem', { name: /light/i });
      await user.click(lightOption);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light');
        expect(document.body).toHaveClass('light');
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      });

      // Verify theme info display
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });

    it('applies dark theme classes consistently', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      // Switch to dark theme
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
        expect(document.body).toHaveClass('dark');
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      });

      // Verify theme info display
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('applies high contrast theme classes consistently', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      // Switch to high contrast theme
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const highContrastOption = screen.getByRole('menuitem', { name: /high contrast/i });
      await user.click(highContrastOption);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('high-contrast');
        expect(document.body).toHaveClass('high-contrast');
        expect(document.documentElement).toHaveAttribute('data-theme', 'high-contrast');
      });

      // Verify theme info display
      expect(screen.getByTestId('current-theme')).toHaveTextContent('high-contrast');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('high-contrast');
    });
  });

  describe('Component Theming Consistency', () => {
    it('ensures all button variants are properly themed', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      // Test in light theme
      const buttons = [
        screen.getByTestId('button-default'),
        screen.getByTestId('button-secondary'),
        screen.getByTestId('button-outline'),
        screen.getByTestId('button-ghost'),
        screen.getByTestId('button-destructive'),
      ];

      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).toBeVisible();
        expect(button).not.toBeDisabled();
      });

      // Switch to dark theme and verify buttons are still visible
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);

      await waitFor(() => {
        buttons.forEach(button => {
          expect(button).toBeVisible();
        });
      });
    });

    it('ensures input fields are properly themed', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      const inputs = [
        screen.getByTestId('test-input'),
        screen.getByTestId('password-input'),
        screen.getByTestId('disabled-input'),
      ];

      inputs.forEach(input => {
        expect(input).toBeInTheDocument();
        expect(input).toBeVisible();
      });

      // Verify disabled state
      expect(screen.getByTestId('disabled-input')).toBeDisabled();

      // Switch to high contrast and verify inputs are still visible
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const highContrastOption = screen.getByRole('menuitem', { name: /high contrast/i });
      await user.click(highContrastOption);

      await waitFor(() => {
        inputs.forEach(input => {
          expect(input).toBeVisible();
        });
      });
    });

    it('ensures card components are properly themed', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
      expect(card).toBeVisible();

      // Switch themes and verify card remains visible
      const themes = ['dark', 'high-contrast', 'light'];

      for (const themeName of themes) {
        const themeToggle = screen.getByTestId('theme-toggle');
        await user.click(themeToggle);

        const themeOption = screen.getByRole('menuitem', {
          name: new RegExp(themeName.replace('-', ' '), 'i'),
        });
        await user.click(themeOption);

        await waitFor(() => {
          expect(card).toBeVisible();
        });
      }
    });

    it('ensures badge components are properly themed', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      const badges = [
        screen.getByTestId('badge-default'),
        screen.getByTestId('badge-secondary'),
        screen.getByTestId('badge-destructive'),
        screen.getByTestId('badge-outline'),
      ];

      badges.forEach(badge => {
        expect(badge).toBeInTheDocument();
        expect(badge).toBeVisible();
      });

      // Switch to dark theme and verify badges are still visible
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);

      await waitFor(() => {
        badges.forEach(badge => {
          expect(badge).toBeVisible();
        });
      });
    });
  });

  describe('Interactive State Consistency', () => {
    it('maintains focus visibility across themes', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      const button = screen.getByTestId('button-default');

      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Switch themes while maintaining focus
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);

      // Button should still be focusable and visible
      await waitFor(() => {
        expect(button).toBeVisible();
      });

      // Re-focus to test focus visibility in new theme
      button.focus();
      expect(button).toHaveFocus();
    });

    it('maintains hover states across themes', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      const button = screen.getByTestId('button-default');

      // Hover over button
      await user.hover(button);

      // Switch themes
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);

      await waitFor(() => {
        expect(button).toBeVisible();
      });

      // Button should still be hoverable
      await user.hover(button);
      expect(button).toBeVisible();
    });

    it('maintains disabled state visibility across themes', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      const disabledInput = screen.getByTestId('disabled-input');
      expect(disabledInput).toBeDisabled();

      // Switch to high contrast theme
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const highContrastOption = screen.getByRole('menuitem', { name: /high contrast/i });
      await user.click(highContrastOption);

      await waitFor(() => {
        expect(disabledInput).toBeVisible();
        expect(disabledInput).toBeDisabled();
      });
    });
  });

  describe('Theme Transition Consistency', () => {
    it('handles rapid theme switching without visual glitches', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      const themeToggle = screen.getByTestId('theme-toggle');

      // Rapidly switch between themes
      const themes = ['light', 'dark', 'high-contrast', 'system'];

      for (const themeName of themes) {
        await user.click(themeToggle);

        const themeOption = screen.getByRole('menuitem', {
          name: new RegExp(themeName.replace('-', ' '), 'i'),
        });
        await user.click(themeOption);

        // Verify all components remain visible after each switch
        await waitFor(() => {
          expect(screen.getByTestId('test-card')).toBeVisible();
          expect(screen.getByTestId('button-default')).toBeVisible();
          expect(screen.getByTestId('test-input')).toBeVisible();
        });
      }
    });

    it('maintains component structure during theme transitions', async () => {
      const user = userEvent.setup();

      render(<ThemedShowcase />);

      // Count initial elements
      const initialButtons = screen.getAllByRole('button');
      const initialInputs = screen.getAllByRole('textbox');

      // Switch theme
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);

      await waitFor(() => {
        // Verify same number of elements exist
        const newButtons = screen.getAllByRole('button');
        const newInputs = screen.getAllByRole('textbox');

        expect(newButtons.length).toBe(initialButtons.length);
        expect(newInputs.length).toBe(initialInputs.length);
      });
    });
  });

  describe('Accessibility Visual Consistency', () => {
    it('maintains proper contrast in high contrast mode', async () => {
      // Mock high contrast system preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<ThemedShowcase />);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('high-contrast');
        expect(document.documentElement).toHaveAttribute('data-high-contrast', 'true');
      });

      // Verify all interactive elements are visible
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('textbox'),
      ];

      interactiveElements.forEach(element => {
        expect(element).toBeVisible();
      });
    });

    it('respects reduced motion preferences in theme transitions', async () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const user = userEvent.setup();

      render(<ThemedShowcase />);

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-reduced-motion', 'true');
      });

      // Theme switching should still work
      const themeToggle = screen.getByTestId('theme-toggle');
      await user.click(themeToggle);

      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);

      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });
    });
  });
});
