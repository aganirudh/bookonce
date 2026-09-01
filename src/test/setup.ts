import '@testing-library/jest-dom';
import '@/index.css';
import { afterEach, vi } from 'vitest';

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

const createMediaQueryList = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: vi.fn(createMediaQueryList),
});

Object.defineProperties(HTMLElement.prototype, {
  scrollIntoView: { configurable: true, value: vi.fn() },
  setPointerCapture: { configurable: true, value: vi.fn() },
  releasePointerCapture: { configurable: true, value: vi.fn() },
  hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
});

afterEach(() => {
  document.documentElement.classList.remove('light', 'dark', 'high-contrast');
  document.body.innerHTML = '';
});
