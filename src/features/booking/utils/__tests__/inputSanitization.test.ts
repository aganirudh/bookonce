/**
 * Input Sanitization Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeText,
  sanitizeNumber,
  sanitizeDate,
  sanitizeURL,
  sanitizeGuestInfo,
  detectXSS,
  detectSQLInjection,
  validateLength,
} from '../inputSanitization';

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(sanitizeString('<b>Hello</b> World')).toBe('Hello World');
    expect(sanitizeString('Normal text')).toBe('Normal text');
  });

  it('should remove event handlers', () => {
    expect(sanitizeString('<div onclick="alert()">Click</div>')).toBe('Click');
    expect(sanitizeString('onload="malicious()"')).toBe('');
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });
});

describe('sanitizeEmail', () => {
  it('should accept valid emails', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    expect(sanitizeEmail('test.user+tag@domain.co.uk')).toBe('test.user+tag@domain.co.uk');
  });

  it('should reject invalid emails', () => {
    expect(sanitizeEmail('not-an-email')).toBe('');
    expect(sanitizeEmail('missing@domain')).toBe('');
    expect(sanitizeEmail('@example.com')).toBe('');
  });

  it('should convert to lowercase', () => {
    expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
  });

  it('should remove HTML tags', () => {
    expect(sanitizeEmail('<script>user@example.com</script>')).toBe('user@example.com');
  });
});

describe('sanitizePhone', () => {
  it('should keep valid phone characters', () => {
    expect(sanitizePhone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
    expect(sanitizePhone('555-1234')).toBe('555-1234');
  });

  it('should remove invalid characters', () => {
    expect(sanitizePhone('555-1234<script>')).toBe('555-1234');
    expect(sanitizePhone('call me @ 555-1234')).toBe('555-1234');
  });
});

describe('sanitizeName', () => {
  it('should capitalize names properly', () => {
    expect(sanitizeName('john doe')).toBe('John Doe');
    expect(sanitizeName('mary-jane')).toBe('Mary-Jane');
  });

  it('should remove numbers and special characters', () => {
    expect(sanitizeName('John123')).toBe('John');
    expect(sanitizeName('Jane@Doe')).toBe('JaneDoe');
  });

  it('should keep hyphens and apostrophes', () => {
    expect(sanitizeName("O'Brien")).toBe("O'Brien");
    expect(sanitizeName('Mary-Jane')).toBe('Mary-Jane');
  });
});

describe('sanitizeText', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeText('<p>Hello</p>')).toBe('Hello');
  });

  it('should enforce max length', () => {
    const longText = 'a'.repeat(600);
    expect(sanitizeText(longText, 500).length).toBe(500);
  });

  it('should remove script tags', () => {
    expect(sanitizeText('Hello <script>alert(1)</script> World')).toBe('Hello alert(1) World');
  });
});

describe('sanitizeNumber', () => {
  it('should parse valid numbers', () => {
    expect(sanitizeNumber('123')).toBe(123);
    expect(sanitizeNumber(456)).toBe(456);
    expect(sanitizeNumber('78.9')).toBe(78.9);
  });

  it('should return null for invalid numbers', () => {
    expect(sanitizeNumber('not a number')).toBeNull();
    expect(sanitizeNumber(NaN)).toBeNull();
    expect(sanitizeNumber(Infinity)).toBeNull();
  });

  it('should enforce min/max bounds', () => {
    expect(sanitizeNumber(5, 10, 20)).toBe(10);
    expect(sanitizeNumber(25, 10, 20)).toBe(20);
    expect(sanitizeNumber(15, 10, 20)).toBe(15);
  });
});

describe('sanitizeDate', () => {
  it('should parse valid dates', () => {
    const result = sanitizeDate('2024-12-25');
    expect(result).toContain('2024-12-25');
  });

  it('should return empty string for invalid dates', () => {
    expect(sanitizeDate('not a date')).toBe('');
    expect(sanitizeDate('2024-13-45')).toBe('');
  });

  it('should remove HTML tags', () => {
    const result = sanitizeDate('<script>2024-12-25</script>');
    expect(result).toContain('2024-12-25');
  });
});

describe('sanitizeURL', () => {
  it('should accept valid URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    expect(sanitizeURL('http://example.com')).toBe('http://example.com');
    expect(sanitizeURL('/relative/path')).toBe('/relative/path');
  });

  it('should reject javascript: protocol', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
  });

  it('should reject data: protocol', () => {
    expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should reject invalid protocols', () => {
    expect(sanitizeURL('ftp://example.com')).toBe('');
  });
});

describe('sanitizeGuestInfo', () => {
  it('should sanitize all guest info fields', () => {
    const input = {
      firstName: 'john<script>',
      lastName: 'doe123',
      email: 'JOHN@EXAMPLE.COM',
      phone: '+1-555-1234',
      country: 'USA',
      specialRequests: '<b>Late check-in</b>',
    };

    const result = sanitizeGuestInfo(input);

    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.phone).toBe('+1-555-1234');
    expect(result.country).toBe('USA');
    expect(result.specialRequests).toBe('Late check-in');
  });

  it('should handle missing fields', () => {
    const result = sanitizeGuestInfo({});

    expect(result.firstName).toBe('');
    expect(result.lastName).toBe('');
    expect(result.email).toBe('');
  });
});

describe('detectXSS', () => {
  it('should detect script tags', () => {
    expect(detectXSS('<script>alert(1)</script>')).toBe(true);
    expect(detectXSS('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(detectXSS('javascript:alert(1)')).toBe(true);
    expect(detectXSS('JAVASCRIPT:alert(1)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(detectXSS('onclick="alert(1)"')).toBe(true);
    expect(detectXSS('onload="malicious()"')).toBe(true);
  });

  it('should detect iframe tags', () => {
    expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should detect eval', () => {
    expect(detectXSS('eval("malicious")')).toBe(true);
  });

  it('should not flag safe content', () => {
    expect(detectXSS('Hello World')).toBe(false);
    expect(detectXSS('user@example.com')).toBe(false);
  });
});

describe('detectSQLInjection', () => {
  it('should detect SQL keywords', () => {
    expect(detectSQLInjection('SELECT * FROM users')).toBe(true);
    expect(detectSQLInjection('DROP TABLE users')).toBe(true);
    expect(detectSQLInjection('INSERT INTO users')).toBe(true);
  });

  it('should detect UNION attacks', () => {
    expect(detectSQLInjection('1 UNION SELECT password')).toBe(true);
  });

  it('should detect OR/AND attacks', () => {
    expect(detectSQLInjection("' OR '1'='1")).toBe(true);
    expect(detectSQLInjection('" AND "1"="1')).toBe(true);
  });

  it('should detect SQL comments', () => {
    expect(detectSQLInjection("admin'--")).toBe(true);
    expect(detectSQLInjection('user/*comment*/')).toBe(true);
  });

  it('should detect tautology attacks', () => {
    expect(detectSQLInjection('OR 1=1')).toBe(true);
  });

  it('should not flag safe content', () => {
    expect(detectSQLInjection('Hello World')).toBe(false);
    expect(detectSQLInjection('user@example.com')).toBe(false);
  });
});

describe('validateLength', () => {
  it('should validate string length', () => {
    expect(validateLength('hello', 3, 10)).toBe(true);
    expect(validateLength('hi', 3, 10)).toBe(false);
    expect(validateLength('this is too long', 3, 10)).toBe(false);
  });

  it('should trim before checking', () => {
    expect(validateLength('  hello  ', 3, 10)).toBe(true);
  });
});
