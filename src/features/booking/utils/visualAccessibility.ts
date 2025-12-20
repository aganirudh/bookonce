/**
 * Visual Accessibility Utilities
 * Provides utilities for ensuring visual accessibility compliance
 */

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 1;
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard (7:1 for normal text)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 7;
}

/**
 * Check if contrast ratio meets WCAG AA standard for large text (3:1)
 */
export function meetsWCAGAALargeText(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 3;
}

/**
 * Get accessible color variant
 * Returns a darker or lighter version of the color to meet contrast requirements
 */
export function getAccessibleColor(
  color: string,
  background: string,
  targetRatio: number = 4.5
): string {
  let currentColor = color;
  let ratio = getContrastRatio(currentColor, background);

  if (ratio >= targetRatio) {
    return currentColor;
  }

  // Try darkening or lightening the color
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  // Determine if we should darken or lighten
  const bgRgb = hexToRgb(background);
  if (!bgRgb) return color;

  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const shouldDarken = bgLuminance > 0.5;

  const step = shouldDarken ? -10 : 10;
  let attempts = 0;
  const maxAttempts = 25;

  while (ratio < targetRatio && attempts < maxAttempts) {
    rgb.r = Math.max(0, Math.min(255, rgb.r + step));
    rgb.g = Math.max(0, Math.min(255, rgb.g + step));
    rgb.b = Math.max(0, Math.min(255, rgb.b + step));

    currentColor = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g
      .toString(16)
      .padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
    ratio = getContrastRatio(currentColor, background);
    attempts++;
  }

  return currentColor;
}

/**
 * Focus indicator styles that meet accessibility requirements
 */
export const focusStyles = {
  // Standard focus ring
  ring: 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',

  // Focus ring for dark backgrounds
  ringDark:
    'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900',

  // Visible focus indicator (always visible, not just on keyboard focus)
  visible: 'outline-none ring-2 ring-ring ring-offset-2',

  // Focus within (for containers)
  within: 'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
};

/**
 * Minimum touch target size (44x44px per WCAG)
 */
export const minTouchTarget = {
  width: '44px',
  height: '44px',
  minWidth: '44px',
  minHeight: '44px',
};

/**
 * Check if an element meets minimum touch target size
 */
export function meetsTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
}

/**
 * Text size utilities for accessibility
 */
export const textSizes = {
  // Minimum readable text size
  minimum: 'text-sm', // 14px

  // Standard body text
  body: 'text-base', // 16px

  // Large text (for better readability)
  large: 'text-lg', // 18px

  // Extra large (for headings)
  xl: 'text-xl', // 20px
};

/**
 * Color-blind safe color palette
 * These colors maintain distinction for common types of color blindness
 */
export const colorBlindSafePalette = {
  // Primary colors
  blue: '#0077BB',
  orange: '#EE7733',
  green: '#009988',
  red: '#CC3311',

  // Secondary colors
  purple: '#AA3377',
  yellow: '#EECC66',
  cyan: '#33BBEE',

  // Neutral colors
  gray: '#BBBBBB',
  darkGray: '#333333',
};

/**
 * Status colors that don't rely solely on color
 * Each status should also have an icon or text indicator
 */
export const statusIndicators = {
  success: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: '✓',
    label: 'Success',
  },
  error: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: '✕',
    label: 'Error',
  },
  warning: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: '⚠',
    label: 'Warning',
  },
  info: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: 'ℹ',
    label: 'Info',
  },
};

/**
 * Check if text is resizable
 * Text should be resizable up to 200% without loss of functionality
 */
export function isTextResizable(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const fontSize = computedStyle.fontSize;

  // Check if font size is in relative units (em, rem, %)
  return fontSize.includes('em') || fontSize.includes('rem') || fontSize.includes('%');
}

/**
 * Ensure proper heading hierarchy
 * Headings should follow a logical order (h1 -> h2 -> h3, etc.)
 */
export function validateHeadingHierarchy(container: HTMLElement): boolean {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;

  for (const heading of headings) {
    const level = parseInt(heading.tagName.substring(1));

    // Check if we skipped a level
    if (level > previousLevel + 1) {
      console.warn(`Heading hierarchy issue: ${heading.tagName} follows h${previousLevel}`);
      return false;
    }

    previousLevel = level;
  }

  return true;
}
