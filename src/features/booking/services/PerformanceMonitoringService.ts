/**
 * Performance Monitoring Service
 * 
 * Tracks and monitors performance metrics for the booking system.
 * Monitors API response times, cache hit rates, booking completion times, and payment success rates.
 */

import { analyticsService } from './AnalyticsService';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ApiPerformanceMetric extends PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode?: number;
  success: boolean;
}

export interface CachePerformanceMetric extends PerformanceMetric {
  operation: string;
  hit: boolean;
}

export interface BookingPerformanceMetric extends PerformanceMetric {
  bookingId?: string;
  step: string;
}

export interface PaymentPerformanceMetric extends PerformanceMetric {
  paymentIntentId?: string;
  success: boolean;
  errorType?: string;
}

class PerformanceMonitoringService {
  private isEnabled: boolean = true;
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: ApiPerformanceMetric[] = [];
  private cacheMetrics: CachePerformanceMetric[] = [];
  private bookingMetrics: BookingPerformanceMetric[] = [];
  private paymentMetrics: PaymentPerformanceMetric[] = [];

  // Cache statistics
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  // Payment statistics
  private paymentSuccesses: number = 0;
  private paymentFailures: number = 0;

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    console.log('[PerformanceMonitoring] Service initialized');
    
    // Set up performance observer for web vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observeWebVitals();
    }
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Track API response time
   */
  trackApiResponseTime(
    endpoint: string,
    method: string,
    duration: number,
    statusCode?: number,
    success: boolean = true
  ): void {
    if (!this.isEnabled) return;

    const metric: ApiPerformanceMetric = {
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      endpoint,
      method,
      statusCode,
      success,
    };

    this.apiMetrics.push(metric);
    this.metrics.push(metric);

    // Send to analytics
    analyticsService.trackApiResponseTime(endpoint, duration);

    // Log slow API calls
    if (duration > 3000) {
      console.warn('[PerformanceMonitoring] Slow API call detected:', {
        endpoint,
        method,
        duration: `${duration}ms`,
      });
    }

    if (import.meta.env.DEV) {
      console.log('[PerformanceMonitoring] API:', {
        endpoint,
        method,
        duration: `${duration}ms`,
        success,
      });
    }
  }

  /**
   * Track cache hit or miss
   */
  trackCacheOperation(operation: string, hit: boolean): void {
    if (!this.isEnabled) return;

    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    const metric: CachePerformanceMetric = {
      name: 'cache_operation',
      value: hit ? 1 : 0,
      unit: 'boolean',
      timestamp: Date.now(),
      operation,
      hit,
    };

    this.cacheMetrics.push(metric);
    this.metrics.push(metric);

    // Calculate and track hit rate periodically
    const totalOperations = this.cacheHits + this.cacheMisses;
    if (totalOperations % 10 === 0) {
      const hitRate = (this.cacheHits / totalOperations) * 100;
      analyticsService.trackCacheHitRate(operation, hitRate);
    }

    if (import.meta.env.DEV) {
      console.log('[PerformanceMonitoring] Cache:', {
        operation,
        hit: hit ? 'HIT' : 'MISS',
        hitRate: this.getCacheHitRate(),
      });
    }
  }

  /**
   * Track booking completion time
   */
  trackBookingCompletionTime(duration: number, bookingId?: string, step?: string): void {
    if (!this.isEnabled) return;

    const metric: BookingPerformanceMetric = {
      name: 'booking_completion_time',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      bookingId,
      step: step || 'complete',
    };

    this.bookingMetrics.push(metric);
    this.metrics.push(metric);

    // Send to analytics
    analyticsService.trackBookingCompletionTime(duration);

    // Log slow bookings
    if (duration > 10000) {
      console.warn('[PerformanceMonitoring] Slow booking completion:', {
        duration: `${duration}ms`,
        bookingId,
      });
    }

    if (import.meta.env.DEV) {
      console.log('[PerformanceMonitoring] Booking:', {
        duration: `${duration}ms`,
        bookingId,
        step,
      });
    }
  }

  /**
   * Track payment success or failure
   */
  trackPaymentAttempt(
    success: boolean,
    duration: number,
    paymentIntentId?: string,
    errorType?: string
  ): void {
    if (!this.isEnabled) return;

    if (success) {
      this.paymentSuccesses++;
    } else {
      this.paymentFailures++;
    }

    const metric: PaymentPerformanceMetric = {
      name: 'payment_attempt',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      paymentIntentId,
      success,
      errorType,
    };

    this.paymentMetrics.push(metric);
    this.metrics.push(metric);

    // Send to analytics
    analyticsService.trackPaymentSuccess(success);

    // Calculate success rate
    const totalAttempts = this.paymentSuccesses + this.paymentFailures;
    const successRate = (this.paymentSuccesses / totalAttempts) * 100;

    if (import.meta.env.DEV) {
      console.log('[PerformanceMonitoring] Payment:', {
        success,
        duration: `${duration}ms`,
        successRate: `${successRate.toFixed(2)}%`,
        errorType,
      });
    }
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      return duration;
    };
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;
    return (this.cacheHits / total) * 100;
  }

  /**
   * Get payment success rate
   */
  getPaymentSuccessRate(): number {
    const total = this.paymentSuccesses + this.paymentFailures;
    if (total === 0) return 0;
    return (this.paymentSuccesses / total) * 100;
  }

  /**
   * Get average API response time
   */
  getAverageApiResponseTime(endpoint?: string): number {
    let relevantMetrics = this.apiMetrics;
    
    if (endpoint) {
      relevantMetrics = this.apiMetrics.filter(m => m.endpoint === endpoint);
    }

    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  /**
   * Get average booking completion time
   */
  getAverageBookingCompletionTime(): number {
    if (this.bookingMetrics.length === 0) return 0;

    const sum = this.bookingMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / this.bookingMetrics.length;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    cacheHitRate: number;
    paymentSuccessRate: number;
    averageApiResponseTime: number;
    averageBookingCompletionTime: number;
    totalMetrics: number;
    apiCalls: number;
    cacheOperations: number;
    bookings: number;
    payments: number;
  } {
    return {
      cacheHitRate: this.getCacheHitRate(),
      paymentSuccessRate: this.getPaymentSuccessRate(),
      averageApiResponseTime: this.getAverageApiResponseTime(),
      averageBookingCompletionTime: this.getAverageBookingCompletionTime(),
      totalMetrics: this.metrics.length,
      apiCalls: this.apiMetrics.length,
      cacheOperations: this.cacheMetrics.length,
      bookings: this.bookingMetrics.length,
      payments: this.paymentMetrics.length,
    };
  }

  /**
   * Get all metrics (for testing)
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get API metrics
   */
  getApiMetrics(): ApiPerformanceMetric[] {
    return [...this.apiMetrics];
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CachePerformanceMetric[] {
    return [...this.cacheMetrics];
  }

  /**
   * Get booking metrics
   */
  getBookingMetrics(): BookingPerformanceMetric[] {
    return [...this.bookingMetrics];
  }

  /**
   * Get payment metrics
   */
  getPaymentMetrics(): PaymentPerformanceMetric[] {
    return [...this.paymentMetrics];
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics = [];
    this.apiMetrics = [];
    this.cacheMetrics = [];
    this.bookingMetrics = [];
    this.paymentMetrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.paymentSuccesses = 0;
    this.paymentFailures = 0;
  }

  /**
   * Observe web vitals (LCP, FID, CLS)
   */
  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.push({
          name: 'lcp',
          value: lastEntry.startTime,
          unit: 'ms',
          timestamp: Date.now(),
        });

        if (import.meta.env.DEV) {
          console.log('[PerformanceMonitoring] LCP:', `${lastEntry.startTime.toFixed(2)}ms`);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.push({
            name: 'fid',
            value: entry.processingStart - entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
          });

          if (import.meta.env.DEV) {
            console.log('[PerformanceMonitoring] FID:', `${(entry.processingStart - entry.startTime).toFixed(2)}ms`);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.metrics.push({
          name: 'cls',
          value: clsValue,
          unit: 'score',
          timestamp: Date.now(),
        });

        if (import.meta.env.DEV) {
          console.log('[PerformanceMonitoring] CLS:', clsValue.toFixed(4));
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();
export default performanceMonitoringService;
