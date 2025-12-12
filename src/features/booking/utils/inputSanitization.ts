/**
 * Input Sanitization and Validation Utilities
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize string input to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 * @param input - Raw string input
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Sanitize HTML content (for rich text fields)
 * Allows only safe HTML tags
 * @param html - Raw HTML string
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Allowed tags for rich text
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'];
  
  // Remove all tags except allowed ones
  let sanitized = html;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove style attributes
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * Sanitize email address
 * @param email - Raw email input
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();
  
  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Basic email validation pattern
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  
  if (!emailPattern.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize phone number
 * @param phone - Raw phone input
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = phone.replace(/<[^>]*>/g, '');
  
  // Keep only digits, spaces, +, -, (, )
  sanitized = sanitized.replace(/[^\d\s\+\-\(\)]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Sanitize name (first name, last name)
 * @param name - Raw name input
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = name.replace(/<[^>]*>/g, '');
  
  // Remove numbers and special characters (except spaces, hyphens, apostrophes)
  sanitized = sanitized.replace(/[^a-zA-Z\s\-']/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Capitalize first letter of each word
  sanitized = sanitized.replace(/\b\w/g, (char) => char.toUpperCase());
  
  return sanitized;
}

/**
 * Sanitize special requests or comments
 * @param text - Raw text input
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export function sanitizeText(text: string, maxLength: number = 500): string {
  if (typeof text !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Remove script content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize numeric input
 * @param value - Raw numeric input
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumber(
  value: any,
  min?: number,
  max?: number
): number | null {
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return min;
  }
  
  if (max !== undefined && num > max) {
    return max;
  }
  
  return num;
}

/**
 * Sanitize date string
 * @param dateString - Raw date input
 * @returns Sanitized ISO date string or empty string if invalid
 */
export function sanitizeDate(dateString: string): string {
  if (typeof dateString !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = dateString.replace(/<[^>]*>/g, '').trim();
  
  // Try to parse as date
  const date = new Date(sanitized);
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Return ISO string
  return date.toISOString();
}

/**
 * Sanitize URL
 * @param url - Raw URL input
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = url.replace(/<[^>]*>/g, '').trim();
  
  // Remove javascript: protocol
  if (sanitized.toLowerCase().startsWith('javascript:')) {
    return '';
  }
  
  // Remove data: protocol (can be used for XSS)
  if (sanitized.toLowerCase().startsWith('data:')) {
    return '';
  }
  
  // Only allow http, https, and relative URLs
  const urlPattern = /^(https?:\/\/|\/)/i;
  
  if (!urlPattern.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize object recursively
 * Applies appropriate sanitization to all string values
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) :
          typeof item === 'object' && item !== null ? sanitizeObject(item) :
          item
        );
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as T;
}

/**
 * Validate and sanitize guest information
 * @param guestInfo - Raw guest information
 * @returns Sanitized guest information
 */
export function sanitizeGuestInfo(guestInfo: any): any {
  return {
    firstName: sanitizeName(guestInfo.firstName || ''),
    lastName: sanitizeName(guestInfo.lastName || ''),
    email: sanitizeEmail(guestInfo.email || ''),
    phone: sanitizePhone(guestInfo.phone || ''),
    country: sanitizeString(guestInfo.country || ''),
    specialRequests: sanitizeText(guestInfo.specialRequests || '', 500),
    arrivalTime: guestInfo.arrivalTime ? sanitizeString(guestInfo.arrivalTime) : undefined,
  };
}

/**
 * Validate and sanitize booking request
 * @param request - Raw booking request
 * @returns Sanitized booking request
 */
export function sanitizeBookingRequest(request: any): any {
  return {
    hotelId: sanitizeNumber(request.hotelId, 1),
    roomId: sanitizeString(request.roomId),
    checkInDate: sanitizeDate(request.checkInDate),
    checkOutDate: sanitizeDate(request.checkOutDate),
    guestInfo: sanitizeGuestInfo(request.guestInfo || {}),
    paymentMethodId: sanitizeString(request.paymentMethodId),
    specialRequests: request.specialRequests ? sanitizeText(request.specialRequests, 500) : undefined,
    userId: request.userId ? sanitizeString(request.userId) : undefined,
  };
}

/**
 * SQL injection prevention - escape special characters
 * Note: This is a basic implementation. In production, use parameterized queries
 * @param input - Raw SQL input
 * @returns Escaped string
 */
export function escapeSQLString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\0')
    .replace(/\x1a/g, '\\Z');
}

/**
 * Validate input length
 * @param input - String input
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @returns true if valid
 */
export function validateLength(
  input: string,
  minLength: number,
  maxLength: number
): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  const length = input.trim().length;
  return length >= minLength && length <= maxLength;
}

/**
 * Detect potential XSS patterns
 * @param input - String to check
 * @returns true if suspicious patterns detected
 */
export function detectXSS(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect potential SQL injection patterns
 * @param input - String to check
 * @returns true if suspicious patterns detected
 */
export function detectSQLInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION\s+SELECT)/i,
    /('|")\s*(OR|AND)\s*('|")/i,
    /(--|\#|\/\*)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}
