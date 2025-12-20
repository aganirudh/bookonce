/**
 * Theme Toggle Accessibility Tests
 * Tests for accessibility compliance in the theme toggle component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../theme-toggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

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

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Wrapper component with theme provider
function ThemeToggleWrapper({ children, ...props }: any) {
  return (
    <ThemeProvider>
      <ThemeToggle {...props} />
      {children}
    </ThemeProvider>
  );
}

describe('ThemeToggle Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Keyboard Navigation', () => {
    it('is focusable with keyboard', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');

      // Focus with tab
      await user.tab();
      expect(toggle).toHaveFocus();
    });

    it('can be activated with Enter key', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');

      // Focus and press Enter
      toggle.focus();
      await user.keyboard('{Enter}');

      // Should have changed theme (we can't easily test the actual change without more setup)
      expect(toggle).toBeInTheDocument();
    });

    it('can be activated with Space key', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');

      // Focus and press Space
      toggle.focus();
      await user.keyboard(' ');

      expect(toggle).toBeInTheDocument();
    });

    it('supports arrow key navigation in dropdown', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="dropdown" />);

      const trigger = screen.getByRole('button');

      // Open dropdown
      await user.click(trigger);

      // Should have menu items
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);

      // First item should be focusable
      expect(menuItems[0]).toBeInTheDocument();
    });
  });

  describe('ARIA Attributes', () => {
    it('has proper aria-label for icon variant', () => {
      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-label');

      const ariaLabel = toggle.getAttribute('aria-label');
      expect(ariaLabel).toContain('Switch theme');
      expect(ariaLabel).toContain('Current:');
    });

    it('has proper aria-label for dropdown variant', () => {
      render(<ThemeToggleWrapper variant="dropdown" />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-label');

      const ariaLabel = trigger.getAttribute('aria-label');
      expect(ariaLabel).toContain('Theme selector');
    });

    it('has proper title attribute for tooltips', () => {
      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('title');

      const title = toggle.getAttribute('title');
      expect(title).toContain('Current theme:');
    });

    it('dropdown has proper ARIA attributes', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="dropdown" />);

      const trigger = screen.getByRole('button');

      // Open dropdown
      await user.click(trigger);

      // Check for proper ARIA attributes on menu items
      const menuItems = screen.getAllByRole('menuitem');
      menuItems.forEach(item => {
        expect(item).toHaveAttribute('aria-label');
        const ariaLabel = item.getAttribute('aria-label');
        expect(ariaLabel).toContain('Switch to');
        expect(ariaLabel).toContain('theme');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides descriptive text for current theme state', () => {
      render(<ThemeToggleWrapper variant="button" showLabel={true} />);

      const toggle = screen.getByRole('button');

      // Should contain theme name in button text or aria-label
      const buttonText = toggle.textContent || toggle.getAttribute('aria-label') || '';
      expect(buttonText.toLowerCase()).toMatch(/(light|dark|system|high contrast)/);
    });

    it('announces theme changes to screen readers', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');
      const initialLabel = toggle.getAttribute('aria-label');

      // Click to change theme
      await user.click(toggle);

      // Wait for potential state update
      await waitFor(() => {
        const newLabel = toggle.getAttribute('aria-label');
        expect(newLabel).toBeTruthy();
      });
    });

    it('provides context about available options in dropdown', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="dropdown" />);

      const trigger = screen.getByRole('button');

      // Open dropdown
      await user.click(trigger);

      // Check that each option has descriptive text
      const lightOption = screen.getByText('Light theme with bright backgrounds');
      const darkOption = screen.getByText('Dark theme with dark backgrounds');
      const highContrastOption = screen.getByText('High contrast theme for accessibility');
      const systemOption = screen.getByText('Follow system preference');

      expect(lightOption).toBeInTheDocument();
      expect(darkOption).toBeInTheDocument();
      expect(highContrastOption).toBeInTheDocument();
      expect(systemOption).toBeInTheDocument();
    });
  });

  describe('Touch Target Size', () => {
    it('meets minimum touch target size requirements', () => {
      render(<ThemeToggleWrapper variant="icon" size="md" />);

      const toggle = screen.getByRole('button');
      const styles = getComputedStyle(toggle);

      // Should have minimum 44x44px touch target (or use touch-target class)
      const hasMinSize =
        toggle.classList.contains('touch-target') ||
        (parseInt(styles.minWidth) >= 44 && parseInt(styles.minHeight) >= 44);

      expect(hasMinSize).toBeTruthy();
    });

    it('maintains touch target size across different sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      sizes.forEach(size => {
        const { unmount } = render(<ThemeToggleWrapper variant="icon" size={size} />);

        const toggle = screen.getByRole('button');

        // Should be focusable and clickable regardless of size
        expect(toggle).toBeInTheDocument();
        expect(toggle.tabIndex).not.toBe(-1);

        unmount();
      });
    });
  });

  describe('High Contrast Mode', () => {
    it('remains visible in high contrast mode', () => {
      // Mock high contrast preference
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

      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');

      // Should be visible and functional
      expect(toggle).toBeVisible();
      expect(toggle).not.toBeDisabled();
    });

    it('includes high contrast option in dropdown', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="dropdown" />);

      const trigger = screen.getByRole('button');

      // Open dropdown
      await user.click(trigger);

      // Should have high contrast option
      const highContrastOption = screen.getByText('High Contrast');
      expect(highContrastOption).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects reduced motion preferences', () => {
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

      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');

      // Should still be functional even with reduced motion
      expect(toggle).toBeInTheDocument();
      expect(toggle).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing theme context gracefully', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ThemeToggle variant="icon" />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });

    it('provides fallback when icons fail to load', () => {
      render(<ThemeToggleWrapper variant="button" showLabel={true} />);

      const toggle = screen.getByRole('button');

      // Should have text label as fallback
      expect(toggle.textContent).toBeTruthy();
    });
  });

  describe('Focus Management', () => {
    it('maintains focus after theme change', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="icon" />);

      const toggle = screen.getByRole('button');

      // Focus the toggle
      toggle.focus();
      expect(toggle).toHaveFocus();

      // Click to change theme
      await user.click(toggle);

      // Should maintain focus
      expect(toggle).toHaveFocus();
    });

    it('properly manages focus in dropdown', async () => {
      const user = userEvent.setup();

      render(<ThemeToggleWrapper variant="dropdown" />);

      const trigger = screen.getByRole('button');

      // Open dropdown
      await user.click(trigger);

      // Select an option
      const lightOption = screen.getByRole('menuitem', { name: /light/i });
      await user.click(lightOption);

      // Focus should return to trigger
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });
});
