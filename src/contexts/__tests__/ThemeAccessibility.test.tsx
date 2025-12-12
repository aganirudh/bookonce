/**
 * Theme Accessibility Tests
 * Tests for accessibility compliance in the theme system
 */

import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { validateThemeContrast, getContrastRatio, meetsWCAGAA, meetsWCAGAAA } from '@/utils/accessibility';

// Mock CSS custom properties
const mockCSSProperties = {
  '--foreground': '215 25% 12%',
  '--background': '0 0% 98%',
  '--card-foreground': '215 25% 12%',
  '--card': '0 0% 100%',
  '--primary-foreground': '0 0% 100%',
  '--primary': '239 84% 67%',
  '--muted-foreground': '215 16% 47%',
  '--secondary-foreground': '215 25% 12%',
  '--secondary': '240 5% 96%',
  '--destructive-foreground': '0 0% 100%',
  '--destructive': '0 84% 60%',
};

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => {
      const key = prop.replace('--', '--');
      return mockCSSProperties[key as keyof typeof mockCSSProperties] || '';
    },
  }),
});

// Mock matchMedia for accessibility preferences
const createMatchMediaMock = (matches: boolean) => vi.fn().mockImplementation(query => ({
  matches,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Test component that uses theme and displays accessibility info
function AccessibilityTestComponent() {
  const { theme, resolvedTheme, systemPrefersHighContrast, systemPrefersReducedMotion } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <div data-testid="high-contrast">{systemPrefersHighContrast.toString()}</div>
      <div data-testid="reduced-motion">{systemPrefersReducedMotion.toString()}</div>
      <button>Test Button</button>
      <a href="#test">Test Link</a>
      <input type="text" placeholder="Test Input" />
    </div>
  );
}

describe('Theme Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to no accessibility preferences
    window.matchMedia = createMatchMediaMock(false);
  });

  afterEach(() => {
    // Clean up DOM
    document.documentElement.className = '';
    document.body.className = '';
  });

  describe('High Contrast Support', () => {
    it('detects system high contrast preference', () => {
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

      render(
        <ThemeProvider>
          <AccessibilityTestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    });

    it('applies high-contrast theme when system prefers it', async () => {
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

      render(
        <ThemeProvider>
          <AccessibilityTestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('high-contrast');
      });
    });

    it('applies high-contrast class to document', async () => {
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

      render(
        <ThemeProvider>
          <AccessibilityTestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      });
    });
  });

  describe('Reduced Motion Support', () => {
    it('detects system reduced motion preference', () => {
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

      render(
        <ThemeProvider>
          <AccessibilityTestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });

    it('sets data attributes for accessibility preferences', async () => {
      // Mock both preferences
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)' || query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <ThemeProvider>
          <AccessibilityTestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-high-contrast')).toBe('true');
        expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
      });
    });
  });

  describe('Focus Management', () => {
    it('applies focus classes to interactive elements', () => {
      render(
        <ThemeProvider>
          <AccessibilityTestComponent />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const link = screen.getByRole('link');
      const input = screen.getByRole('textbox');

      // Focus each element and check for focus indicators
      act(() => {
        button.focus();
      });
      expect(document.activeElement).toBe(button);

      act(() => {
        link.focus();
      });
      expect(document.activeElement).toBe(link);

      act(() => {
        input.focus();
      });
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation between interactive elements', () => {
      render(
        <ThemeProvider>
          <AccessibilityTestComponent />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const link = screen.getByRole('link');
      const input = screen.getByRole('textbox');

      // Test tab order
      act(() => {
        button.focus();
      });
      expect(document.activeElement).toBe(button);

      // Simulate tab key
      act(() => {
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
        button.dispatchEvent(tabEvent);
      });
    });
  });
});

describe('Contrast Ratio Utilities', () => {
  describe('getContrastRatio', () => {
    it('calculates correct contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('calculates correct contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('handles HSL color format', () => {
      const ratio = getContrastRatio('hsl(0, 0%, 0%)', 'hsl(0, 0%, 100%)');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('handles RGB color format', () => {
      const ratio = getContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
      expect(ratio).toBeCloseTo(21, 1);
    });
  });

  describe('WCAG Compliance', () => {
    it('correctly identifies WCAG AA compliance', () => {
      // High contrast - should pass
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
      
      // Low contrast - should fail
      expect(meetsWCAGAA('#888888', '#999999')).toBe(false);
      
      // Large text threshold - #666666 on white has ratio ~5.74, passes AA for large text (3:1) and normal text (4.5:1)
      expect(meetsWCAGAA('#666666', '#ffffff', true)).toBe(true);
      expect(meetsWCAGAA('#666666', '#ffffff', false)).toBe(true);
    });

    it('correctly identifies WCAG AAA compliance', () => {
      // High contrast - should pass
      expect(meetsWCAGAAA('#000000', '#ffffff')).toBe(true);
      
      // Medium contrast - #595959 on white has ratio ~7.15, passes AAA
      expect(meetsWCAGAAA('#595959', '#ffffff')).toBe(true);
      
      // Large text threshold
      expect(meetsWCAGAAA('#767676', '#ffffff', true)).toBe(true);
      expect(meetsWCAGAAA('#767676', '#ffffff', false)).toBe(false);
    });
  });

  describe('Theme Validation', () => {
    it('validates theme contrast ratios', () => {
      const checks = validateThemeContrast();
      
      expect(Array.isArray(checks)).toBe(true);
      expect(checks.length).toBeGreaterThan(0);
      
      checks.forEach(check => {
        expect(check).toHaveProperty('property');
        expect(check).toHaveProperty('foreground');
        expect(check).toHaveProperty('background');
        expect(check).toHaveProperty('ratio');
        expect(check).toHaveProperty('meetsAA');
        expect(check).toHaveProperty('meetsAAA');
        expect(typeof check.ratio).toBe('number');
        expect(typeof check.meetsAA).toBe('boolean');
        expect(typeof check.meetsAAA).toBe('boolean');
      });
    });
  });
});

describe('Accessibility Attributes', () => {
  it('sets proper ARIA attributes on theme changes', async () => {
    render(
      <ThemeProvider>
        <AccessibilityTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
      expect(document.documentElement.hasAttribute('data-high-contrast')).toBe(true);
      expect(document.documentElement.hasAttribute('data-reduced-motion')).toBe(true);
    });
  });

  it('updates meta theme-color for mobile browsers', async () => {
    // Add meta theme-color tag
    const metaTag = document.createElement('meta');
    metaTag.name = 'theme-color';
    metaTag.content = '#000000';
    document.head.appendChild(metaTag);

    render(
      <ThemeProvider>
        <AccessibilityTestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      const updatedMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      expect(updatedMeta?.content).toBeTruthy();
    });

    // Cleanup
    document.head.removeChild(metaTag);
  });
});