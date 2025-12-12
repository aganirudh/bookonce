/**
 * Payment Security Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isSecureConnection,
  requires3DSecure,
  maskCardNumber,
  validateNoCardNumbers,
  sanitizePaymentMetadata,
  isValidPaymentToken,
  isPaymentMethodExpired,
  isValidPaymentAmount,
} from '../paymentSecurity';

describe('isSecureConnection', () => {
  it('should return true for HTTPS', () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        hostname: 'example.com',
      },
      writable: true,
    });

    expect(isSecureConnection()).toBe(true);
  });

  it('should return true for localhost in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:',
        hostname: 'localhost',
      },
      writable: true,
    });

    expect(isSecureConnection()).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });
});

describe('requires3DSecure', () => {
  it('should require 3DS for high-value transactions', () => {
    expect(requires3DSecure(50000)).toBe(true); // $500
    expect(requires3DSecure(100000)).toBe(true); // $1000
  });

  it('should not require 3DS for low-value transactions', () => {
    expect(requires3DSecure(10000)).toBe(false); // $100
    expect(requires3DSecure(49999)).toBe(false); // $499.99
  });
});

describe('maskCardNumber', () => {
  it('should mask card numbers correctly', () => {
    expect(maskCardNumber('4242424242424242')).toBe('**** **** **** 4242');
    expect(maskCardNumber('1234567890123456')).toBe('**** **** **** 3456');
  });

  it('should handle short inputs', () => {
    expect(maskCardNumber('123')).toBe('****');
    expect(maskCardNumber('')).toBe('****');
  });
});

describe('validateNoCardNumbers', () => {
  it('should detect potential card numbers', () => {
    const dataWithCard = {
      cardNumber: '4242424242424242',
      name: 'John Doe',
    };

    expect(validateNoCardNumbers(dataWithCard)).toBe(false);
  });

  it('should pass data without card numbers', () => {
    const safeData = {
      name: 'John Doe',
      email: 'john@example.com',
      amount: 1000,
    };

    expect(validateNoCardNumbers(safeData)).toBe(true);
  });

  it('should not flag short number sequences', () => {
    const safeData = {
      phone: '5551234',
      zip: '12345',
    };

    expect(validateNoCardNumbers(safeData)).toBe(true);
  });
});

describe('sanitizePaymentMetadata', () => {
  it('should keep only allowed fields', () => {
    const metadata = {
      bookingId: 'BK123',
      hotelId: 456,
      userId: 'user789',
      cardNumber: '4242424242424242', // Should be removed
      cvv: '123', // Should be removed
      guestName: 'John Doe',
    };

    const sanitized = sanitizePaymentMetadata(metadata);

    expect(sanitized.bookingId).toBe('BK123');
    expect(sanitized.hotelId).toBe('456');
    expect(sanitized.userId).toBe('user789');
    expect(sanitized.guestName).toBe('John Doe');
    expect(sanitized.cardNumber).toBeUndefined();
    expect(sanitized.cvv).toBeUndefined();
  });

  it('should convert all values to strings', () => {
    const metadata = {
      hotelId: 123,
      bookingId: 456,
    };

    const sanitized = sanitizePaymentMetadata(metadata);

    expect(typeof sanitized.hotelId).toBe('string');
    expect(typeof sanitized.bookingId).toBe('string');
  });
});

describe('isValidPaymentToken', () => {
  it('should accept valid Stripe tokens', () => {
    expect(isValidPaymentToken('pm_1234567890')).toBe(true);
    expect(isValidPaymentToken('pi_1234567890')).toBe(true);
    expect(isValidPaymentToken('tok_1234567890')).toBe(true);
    expect(isValidPaymentToken('card_1234567890')).toBe(true);
    expect(isValidPaymentToken('src_1234567890')).toBe(true);
  });

  it('should reject invalid tokens', () => {
    expect(isValidPaymentToken('invalid_token')).toBe(false);
    expect(isValidPaymentToken('4242424242424242')).toBe(false);
    expect(isValidPaymentToken('')).toBe(false);
  });
});

describe('isPaymentMethodExpired', () => {
  it('should detect expired cards', () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Last year
    expect(isPaymentMethodExpired(12, currentYear - 1)).toBe(true);

    // Last month
    if (currentMonth > 1) {
      expect(isPaymentMethodExpired(currentMonth - 1, currentYear)).toBe(true);
    }
  });

  it('should not flag valid cards', () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Next year
    expect(isPaymentMethodExpired(1, currentYear + 1)).toBe(false);

    // Current month
    expect(isPaymentMethodExpired(currentMonth, currentYear)).toBe(false);

    // Next month
    if (currentMonth < 12) {
      expect(isPaymentMethodExpired(currentMonth + 1, currentYear)).toBe(false);
    }
  });
});

describe('isValidPaymentAmount', () => {
  it('should accept valid amounts', () => {
    expect(isValidPaymentAmount(1000)).toBe(true); // $10
    expect(isValidPaymentAmount(50000)).toBe(true); // $500
    expect(isValidPaymentAmount(1)).toBe(true); // $0.01
  });

  it('should reject invalid amounts', () => {
    expect(isValidPaymentAmount(0)).toBe(false);
    expect(isValidPaymentAmount(-100)).toBe(false);
    expect(isValidPaymentAmount(100000001)).toBe(false); // Over $1M
  });

  it('should reject fractional cents', () => {
    expect(isValidPaymentAmount(10.5)).toBe(false);
    expect(isValidPaymentAmount(99.99)).toBe(false);
  });
});
