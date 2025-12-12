/**
 * Accessibility Utilities
 * Provides functions for checking and ensuring accessibility compliance
 */

/**
 * Color contrast ratio calculation utilities
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const parseColor = (color: string): { r: number; g: number; b: number } | null => {
    // Handle hex colors
    if (color.startsWith('#')) {
      return hexToRgb(color);
    }
    
    // Handle HSL colors (e.g., "hsl(215, 25%, 12%)")
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const [, h, s, l] = hslMatch.map(Number);
      return hslToRgb(h, s, l);
    }
    
    // Handle RGB colors (e.g., "rgb(255, 255, 255)")
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      return { r, g, b };
    }
    
    return null;
  };

  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  
  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format provided to getContrastRatio');
    return 1;
  }
  
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get CSS custom property value
 */
export function getCSSCustomProperty(property: string): string {
  if (typeof window === 'undefined') return '';
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
    
  // Convert HSL values to full HSL string if needed
  if (value && !value.startsWith('hsl') && !value.startsWith('#') && !value.startsWith('rgb')) {
    return `hsl(${value})`;
  }
  
  return value;
}

/**
 * Validate theme contrast ratios
 */
export interface ContrastCheck {
  property: string;
  foreground: string;
  background: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  isLargeText?: boolean;
}

export function validateThemeContrast(): ContrastCheck[] {
  const checks: ContrastCheck[] = [];
  
  const contrastPairs = [
    {
      property: 'Primary text on background',
      foreground: '--foreground',
      background: '--background',
    },
    {
      property: 'Muted text on background',
      foreground: '--muted-foreground',
      background: '--background',
    },
    {
      property: 'Card text on card background',
      foreground: '--card-foreground',
      background: '--card',
    },
    {
      property: 'Primary button text',
      foreground: '--primary-foreground',
      background: '--primary',
    },
    {
      property: 'Secondary text on secondary background',
      foreground: '--secondary-foreground',
      background: '--secondary',
    },
    {
      property: 'Destructive text',
      foreground: '--destructive-foreground',
      background: '--destructive',
    },
  ];
  
  contrastPairs.forEach(({ property, foreground, background }) => {
    const fgColor = getCSSCustomProperty(foreground);
    const bgColor = getCSSCustomProperty(background);
    
    if (fgColor && bgColor) {
      const ratio = getContrastRatio(fgColor, bgColor);
      checks.push({
        property,
        foreground: fgColor,
        background: bgColor,
        ratio,
        meetsAA: meetsWCAGAA(fgColor, bgColor),
        meetsAAA: meetsWCAGAAA(fgColor, bgColor),
      });
    }
  });
  
  return checks;
}

/**
 * Focus management utilities
 */

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Focus the first element
  firstElement?.focus();
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Screen reader utilities
 */

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof window === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.matchMedia('(prefers-contrast: high)').matches;
  } catch {
    return false;
  }
}

/**
 * Keyboard navigation utilities
 */

/**
 * Handle arrow key navigation in a list
 */
export function handleArrowKeyNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onIndexChange: (index: number) => void,
  options: {
    loop?: boolean;
    horizontal?: boolean;
  } = {}
): void {
  const { loop = true, horizontal = false } = options;
  
  let newIndex = currentIndex;
  
  switch (event.key) {
    case horizontal ? 'ArrowLeft' : 'ArrowUp':
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? items.length - 1 : 0);
      break;
    case horizontal ? 'ArrowRight' : 'ArrowDown':
      event.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : (loop ? 0 : items.length - 1);
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    default:
      return;
  }
  
  if (newIndex !== currentIndex) {
    onIndexChange(newIndex);
    items[newIndex]?.focus();
  }
}

/**
 * Generate unique ID for accessibility attributes
 */
export function generateAccessibilityId(prefix = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    element.hasAttribute('aria-hidden') ||
    element.hidden ||
    style.opacity === '0'
  );
}

/**
 * Accessibility testing utilities for development
 */
export const a11yTest = {
  /**
   * Log contrast ratios for current theme
   */
  logContrastRatios(): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    const checks = validateThemeContrast();
    console.group('🎨 Theme Contrast Analysis');
    
    checks.forEach(check => {
      const status = check.meetsAA ? '✅' : '❌';
      const aaa = check.meetsAAA ? ' (AAA ✅)' : ' (AAA ❌)';
      console.log(`${status} ${check.property}: ${check.ratio.toFixed(2)}:1${aaa}`);
    });
    
    console.groupEnd();
  },
  
  /**
   * Check for missing alt text on images
   */
  checkImageAltText(): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    const images = document.querySelectorAll('img');
    const missingAlt: HTMLImageElement[] = [];
    
    images.forEach(img => {
      if (!img.alt && !img.hasAttribute('aria-label') && !img.hasAttribute('aria-labelledby')) {
        missingAlt.push(img);
      }
    });
    
    if (missingAlt.length > 0) {
      console.warn('🖼️ Images missing alt text:', missingAlt);
    }
  },
  
  /**
   * Check for proper heading hierarchy
   */
  checkHeadingHierarchy(): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels: number[] = [];
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      levels.push(level);
    });
    
    let hasIssues = false;
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        hasIssues = true;
        break;
      }
    }
    
    if (hasIssues) {
      console.warn('📝 Heading hierarchy issues detected:', levels);
    }
  },
};