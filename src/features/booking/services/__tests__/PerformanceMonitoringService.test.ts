/**
 * Performance Monitoring Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitoringService } from '../PerformanceMonitoringService';

describe('PerformanceMonitoringService', () => {
  beforeEach(() => {
    performanceMonitoringService.clearMetrics();
    performanceMonitoringService.setEnabled(true);
  });

  describe('API Performance Tracking', () => {
    it('should track API response time', () => {
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1500, 200, true);

      const metrics = performanceMonitoringService.getApiMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].endpoint).toBe('/api/availability');
      expect(metrics[0].method).toBe('POST');
      expect(metrics[0].value).toBe(1500);
      expect(metrics[0].statusCode).toBe(200);
      expect(metrics[0].success).toBe(true);
    });

    it('should track failed API calls', () => {
      performanceMonitoringService.trackApiResponseTime('/api/bookings', 'POST', 2000, 500, false);

      const metrics = performanceMonitoringService.getApiMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].statusCode).toBe(500);
    });

    it('should calculate average API response time', () => {
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1000, 200, true);
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 2000, 200, true);
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1500, 200, true);

      const average = performanceMonitoringService.getAverageApiResponseTime('/api/availability');
      expect(average).toBe(1500);
    });

    it('should calculate average for all endpoints', () => {
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1000, 200, true);
      performanceMonitoringService.trackApiResponseTime('/api/bookings', 'POST', 2000, 200, true);

      const average = performanceMonitoringService.getAverageApiResponseTime();
      expect(average).toBe(1500);
    });
  });

  describe('Cache Performance Tracking', () => {
    it('should track cache hit', () => {
      performanceMonitoringService.trackCacheOperation('availability', true);

      const metrics = performanceMonitoringService.getCacheMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('availability');
      expect(metrics[0].hit).toBe(true);
      expect(metrics[0].value).toBe(1);
    });

    it('should track cache miss', () => {
      performanceMonitoringService.trackCacheOperation('availability', false);

      const metrics = performanceMonitoringService.getCacheMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].hit).toBe(false);
      expect(metrics[0].value).toBe(0);
    });

    it('should calculate cache hit rate', () => {
      // 7 hits, 3 misses = 70% hit rate
      for (let i = 0; i < 7; i++) {
        performanceMonitoringService.trackCacheOperation('availability', true);
      }
      for (let i = 0; i < 3; i++) {
        performanceMonitoringService.trackCacheOperation('availability', false);
      }

      const hitRate = performanceMonitoringService.getCacheHitRate();
      expect(hitRate).toBe(70);
    });

    it('should return 0 hit rate when no operations', () => {
      const hitRate = performanceMonitoringService.getCacheHitRate();
      expect(hitRate).toBe(0);
    });
  });

  describe('Booking Performance Tracking', () => {
    it('should track booking completion time', () => {
      performanceMonitoringService.trackBookingCompletionTime(8500, 'BK123', 'complete');

      const metrics = performanceMonitoringService.getBookingMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(8500);
      expect(metrics[0].bookingId).toBe('BK123');
      expect(metrics[0].step).toBe('complete');
    });

    it('should calculate average booking completion time', () => {
      performanceMonitoringService.trackBookingCompletionTime(8000);
      performanceMonitoringService.trackBookingCompletionTime(10000);
      performanceMonitoringService.trackBookingCompletionTime(9000);

      const average = performanceMonitoringService.getAverageBookingCompletionTime();
      expect(average).toBe(9000);
    });

    it('should return 0 average when no bookings', () => {
      const average = performanceMonitoringService.getAverageBookingCompletionTime();
      expect(average).toBe(0);
    });
  });

  describe('Payment Performance Tracking', () => {
    it('should track successful payment', () => {
      performanceMonitoringService.trackPaymentAttempt(true, 2000, 'pi_123');

      const metrics = performanceMonitoringService.getPaymentMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].success).toBe(true);
      expect(metrics[0].value).toBe(2000);
      expect(metrics[0].paymentIntentId).toBe('pi_123');
    });

    it('should track failed payment', () => {
      performanceMonitoringService.trackPaymentAttempt(false, 1500, 'pi_456', 'card_declined');

      const metrics = performanceMonitoringService.getPaymentMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].errorType).toBe('card_declined');
    });

    it('should calculate payment success rate', () => {
      // 8 successes, 2 failures = 80% success rate
      for (let i = 0; i < 8; i++) {
        performanceMonitoringService.trackPaymentAttempt(true, 2000);
      }
      for (let i = 0; i < 2; i++) {
        performanceMonitoringService.trackPaymentAttempt(false, 1500);
      }

      const successRate = performanceMonitoringService.getPaymentSuccessRate();
      expect(successRate).toBe(80);
    });

    it('should return 0 success rate when no payments', () => {
      const successRate = performanceMonitoringService.getPaymentSuccessRate();
      expect(successRate).toBe(0);
    });
  });

  describe('Performance Timer', () => {
    it('should measure elapsed time', async () => {
      const endTimer = performanceMonitoringService.startTimer('test');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const duration = endTimer();
      expect(duration).toBeGreaterThanOrEqual(50);
      expect(duration).toBeLessThan(100);
    });

    it('should return accurate duration', () => {
      const endTimer = performanceMonitoringService.startTimer('test');
      const duration = endTimer();
      
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Performance Statistics', () => {
    it('should return comprehensive performance stats', () => {
      // Add various metrics
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1500, 200, true);
      performanceMonitoringService.trackCacheOperation('availability', true);
      performanceMonitoringService.trackCacheOperation('availability', false);
      performanceMonitoringService.trackBookingCompletionTime(8500);
      performanceMonitoringService.trackPaymentAttempt(true, 2000);

      const stats = performanceMonitoringService.getPerformanceStats();
      expect(stats.totalMetrics).toBe(5);
      expect(stats.apiCalls).toBe(1);
      expect(stats.cacheOperations).toBe(2);
      expect(stats.bookings).toBe(1);
      expect(stats.payments).toBe(1);
      expect(stats.cacheHitRate).toBe(50);
      expect(stats.paymentSuccessRate).toBe(100);
      expect(stats.averageApiResponseTime).toBe(1500);
      expect(stats.averageBookingCompletionTime).toBe(8500);
    });

    it('should handle empty metrics', () => {
      const stats = performanceMonitoringService.getPerformanceStats();
      expect(stats.totalMetrics).toBe(0);
      expect(stats.apiCalls).toBe(0);
      expect(stats.cacheOperations).toBe(0);
      expect(stats.bookings).toBe(0);
      expect(stats.payments).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
      expect(stats.paymentSuccessRate).toBe(0);
      expect(stats.averageApiResponseTime).toBe(0);
      expect(stats.averageBookingCompletionTime).toBe(0);
    });
  });

  describe('Service Configuration', () => {
    it('should not track metrics when disabled', () => {
      performanceMonitoringService.setEnabled(false);
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1500, 200, true);

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should resume tracking when re-enabled', () => {
      performanceMonitoringService.setEnabled(false);
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1500, 200, true);
      
      performanceMonitoringService.setEnabled(true);
      performanceMonitoringService.trackCacheOperation('availability', true);

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('cache_operation');
    });

    it('should include timestamp with each metric', () => {
      const beforeTime = Date.now();
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1500, 200, true);
      const afterTime = Date.now();

      const metrics = performanceMonitoringService.getMetrics();
      expect(metrics[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(metrics[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should clear all metrics', () => {
      performanceMonitoringService.trackApiResponseTime('/api/availability', 'POST', 1500, 200, true);
      performanceMonitoringService.trackCacheOperation('availability', true);
      
      expect(performanceMonitoringService.getMetrics()).toHaveLength(2);
      
      performanceMonitoringService.clearMetrics();
      expect(performanceMonitoringService.getMetrics()).toHaveLength(0);
      expect(performanceMonitoringService.getCacheHitRate()).toBe(0);
      expect(performanceMonitoringService.getPaymentSuccessRate()).toBe(0);
    });
  });
});
