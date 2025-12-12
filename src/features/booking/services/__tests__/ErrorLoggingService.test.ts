/**
 * Error Logging Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { errorLoggingService } from '../ErrorLoggingService';

describe('ErrorLoggingService', () => {
  beforeEach(() => {
    errorLoggingService.clearErrors();
    errorLoggingService.setEnabled(true);
  });

  describe('Error Logging', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      errorLoggingService.logError(error, { component: 'TestComponent', step: 'test' }, 'medium');

      const errors = errorLoggingService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toBe('Test error');
      expect(errors[0].context.component).toBe('TestComponent');
      expect(errors[0].context.step).toBe('test');
      expect(errors[0].severity).toBe('medium');
    });

    it('should log booking error', () => {
      const error = new Error('Booking failed');
      errorLoggingService.logBookingError(error, 'payment', 'BookingModal', { hotelId: 1 });

      const errors = errorLoggingService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toBe('Booking failed');
      expect(errors[0].context.component).toBe('BookingModal');
      expect(errors[0].context.step).toBe('payment');
      expect(errors[0].context.action).toBe('booking');
      expect(errors[0].context.metadata?.hotelId).toBe(1);
      expect(errors[0].severity).toBe('high');
    });

    it('should log payment error as critical', () => {
      const error = new Error('Payment processing failed');
      errorLoggingService.logPaymentError(error, 'pi_123', { amount: 1000 });

      const errors = errorLoggingService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toBe('Payment processing failed');
      expect(errors[0].context.component).toBe('PaymentService');
      expect(errors[0].context.step).toBe('payment');
      expect(errors[0].severity).toBe('critical');
      expect(errors[0].context.metadata?.paymentIntentId).toBe('pi_123');
    });

    it('should log API error', () => {
      const error = new Error('API request failed');
      errorLoggingService.logApiError(error, '/api/bookings', 'POST', { statusCode: 500 });

      const errors = errorLoggingService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toBe('API request failed');
      expect(errors[0].context.component).toBe('APIService');
      expect(errors[0].context.action).toBe('POST /api/bookings');
      expect(errors[0].severity).toBe('high');
    });
  });

  describe('Error Statistics', () => {
    it('should calculate error statistics', () => {
      errorLoggingService.logError(new Error('Error 1'), { component: 'ComponentA', step: 'step1' }, 'low');
      errorLoggingService.logError(new Error('Error 2'), { component: 'ComponentA', step: 'step2' }, 'medium');
      errorLoggingService.logError(new Error('Error 3'), { component: 'ComponentB', step: 'step1' }, 'high');
      errorLoggingService.logError(new Error('Error 4'), { component: 'ComponentB', step: 'step1' }, 'critical');

      const stats = errorLoggingService.getErrorStats();
      expect(stats.total).toBe(4);
      expect(stats.byComponent).toEqual({
        ComponentA: 2,
        ComponentB: 2,
      });
      expect(stats.bySeverity).toEqual({
        low: 1,
        medium: 1,
        high: 1,
        critical: 1,
      });
      expect(stats.byStep).toEqual({
        step1: 3,
        step2: 1,
      });
    });

    it('should handle empty error list', () => {
      const stats = errorLoggingService.getErrorStats();
      expect(stats.total).toBe(0);
      expect(stats.byComponent).toEqual({});
      expect(stats.bySeverity).toEqual({});
      expect(stats.byStep).toEqual({});
    });
  });

  describe('Service Configuration', () => {
    it('should not log errors when disabled', () => {
      errorLoggingService.setEnabled(false);
      errorLoggingService.logError(new Error('Test error'), { component: 'Test' }, 'medium');

      const errors = errorLoggingService.getErrors();
      expect(errors).toHaveLength(0);
    });

    it('should resume logging when re-enabled', () => {
      errorLoggingService.setEnabled(false);
      errorLoggingService.logError(new Error('Error 1'), { component: 'Test' }, 'medium');
      
      errorLoggingService.setEnabled(true);
      errorLoggingService.logError(new Error('Error 2'), { component: 'Test' }, 'medium');

      const errors = errorLoggingService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toBe('Error 2');
    });

    it('should include timestamp with each error', () => {
      const beforeTime = Date.now();
      errorLoggingService.logError(new Error('Test error'), { component: 'Test' }, 'medium');
      const afterTime = Date.now();

      const errors = errorLoggingService.getErrors();
      expect(errors[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(errors[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should clear all errors', () => {
      errorLoggingService.logError(new Error('Error 1'), { component: 'Test' }, 'medium');
      errorLoggingService.logError(new Error('Error 2'), { component: 'Test' }, 'high');
      
      expect(errorLoggingService.getErrors()).toHaveLength(2);
      
      errorLoggingService.clearErrors();
      expect(errorLoggingService.getErrors()).toHaveLength(0);
    });
  });

  describe('Capture Methods', () => {
    it('should capture exception', () => {
      const error = new Error('Exception occurred');
      errorLoggingService.captureException(error, { component: 'TestComponent' });

      const errors = errorLoggingService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toBe('Exception occurred');
      expect(errors[0].severity).toBe('medium');
    });

    it('should capture message', () => {
      errorLoggingService.captureMessage('Something went wrong', { component: 'TestComponent' }, 'low');

      const errors = errorLoggingService.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toBe('Something went wrong');
      expect(errors[0].severity).toBe('low');
    });
  });
});
