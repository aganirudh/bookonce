/**
 * Performance Optimization Configuration
 * Central configuration for all performance-related settings
 */

export const PERFORMANCE_CONFIG = {
  // Code Splitting
  CODE_SPLITTING: {
    ENABLED: true,
    CHUNK_SIZE_WARNING: 500000, // 500KB
    PREFETCH_ROUTES: ['/profile', '/profile/bookings'],
  },

  // Image Optimization
  IMAGES: {
    LAZY_LOAD: true,
    WEBP_ENABLED: true,
    QUALITY: 85,
    SIZES: [320, 640, 768, 1024, 1280, 1920],
    PLACEHOLDER: 'blur',
    FORMATS: ['webp', 'jpeg'],
  },

  // Caching
  CACHE: {
    ENABLED: true,
    VERSION: 'v1',
    STRATEGIES: {
      STATIC: 'cache-first',
      API: 'network-first',
      IMAGES: 'cache-first',
    },
    MAX_AGE: {
      STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
      API: 5 * 60 * 1000, // 5 minutes
      IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  },

  // Service Worker
  SERVICE_WORKER: {
    ENABLED: true,
    UPDATE_CHECK_INTERVAL: 60000, // 1 minute
    OFFLINE_FALLBACK: '/offline.html',
  },

  // Bundle Optimization
  BUNDLE: {
    TREE_SHAKING: true,
    MINIFICATION: true,
    COMPRESSION: 'gzip',
    SOURCE_MAPS: false,
  },

  // Resource Hints
  RESOURCE_HINTS: {
    PRELOAD: [
      '/fonts/main.woff2',
    ],
    PREFETCH: [
      '/api/hotels',
    ],
    PRECONNECT: [
      'https://api.stripe.com',
    ],
  },

  // Performance Budgets
  BUDGETS: {
    INITIAL_LOAD: 3000, // 3 seconds
    FIRST_CONTENTFUL_PAINT: 1500, // 1.5 seconds
    TIME_TO_INTERACTIVE: 3500, // 3.5 seconds
    TOTAL_BUNDLE_SIZE: 500000, // 500KB
  },

  // Monitoring
  MONITORING: {
    ENABLED: true,
    SAMPLE_RATE: 0.1, // 10% of users
    METRICS: [
      'FCP', // First Contentful Paint
      'LCP', // Largest Contentful Paint
      'FID', // First Input Delay
      'CLS', // Cumulative Layout Shift
      'TTFB', // Time to First Byte
    ],
  },
} as const;

/**
 * Check if performance optimization is enabled
 */
export const isPerformanceOptimizationEnabled = (): boolean => {
  return import.meta.env.PROD || import.meta.env.VITE_ENABLE_PERFORMANCE === 'true';
};

/**
 * Get cache strategy for resource type
 */
export const getCacheStrategy = (resourceType: 'static' | 'api' | 'images'): string => {
  return PERFORMANCE_CONFIG.CACHE.STRATEGIES[resourceType.toUpperCase() as keyof typeof PERFORMANCE_CONFIG.CACHE.STRATEGIES];
};

/**
 * Get cache max age for resource type
 */
export const getCacheMaxAge = (resourceType: 'static' | 'api' | 'images'): number => {
  return PERFORMANCE_CONFIG.CACHE.MAX_AGE[resourceType.toUpperCase() as keyof typeof PERFORMANCE_CONFIG.CACHE.MAX_AGE];
};

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
}

/**
 * Collect performance metrics
 */
export const collectPerformanceMetrics = (): PerformanceMetrics => {
  const metrics: PerformanceMetrics = {};

  if ('performance' in window && 'getEntriesByType' in performance) {
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.ttfb = navigation.responseStart - navigation.requestStart;
    }

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcp) {
      metrics.fcp = fcp.startTime;
    }
  }

  return metrics;
};

/**
 * Report performance metrics
 */
export const reportPerformanceMetrics = (metrics: PerformanceMetrics): void => {
  if (!PERFORMANCE_CONFIG.MONITORING.ENABLED) return;

  // Sample rate check
  if (Math.random() > PERFORMANCE_CONFIG.MONITORING.SAMPLE_RATE) return;

  // In production, send to analytics service
  console.log('Performance Metrics:', metrics);
};
