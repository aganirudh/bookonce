/**
 * Payment Security Utilities
 * Ensures secure handling of payment data and PCI compliance
 */

/**
 * Security configuration for payment processing
 */
export const PAYMENT_SECURITY_CONFIG = {
  // Minimum transaction amount for 3D Secure (in cents)
  THREE_D_SECURE_THRESHOLD: 50000, // $500

  // HTTPS enforcement
  REQUIRE_HTTPS: true,

  // Token expiration time (in milliseconds)
  TOKEN_EXPIRATION: 15 * 60 * 1000, // 15 minutes

  // Maximum saved payment methods per user
  MAX_SAVED_METHODS: 5,
} as const;

/**
 * Check if the current connection is secure (HTTPS)
 * @returns true if connection is secure
 */
export function isSecureConnection(): boolean {
  if (typeof window === 'undefined') {
    return true; // Server-side is considered secure
  }

  // Check if running on HTTPS
  const isHttps = window.location.protocol === 'https:';

  // Allow localhost for development
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return isHttps || (isLocalhost && process.env.NODE_ENV === 'development');
}

/**
 * Enforce HTTPS for payment operations
 * @throws Error if connection is not secure
 */
export function enforceSecureConnection(): void {
  if (PAYMENT_SECURITY_CONFIG.REQUIRE_HTTPS && !isSecureConnection()) {
    throw new Error(
      'Payment operations require a secure HTTPS connection. ' +
        'Please ensure your site is served over HTTPS.'
    );
  }
}

/**
 * Check if a transaction requires 3D Secure authentication
 * @param amountCents - Transaction amount in cents
 * @returns true if 3D Secure is required
 */
export function requires3DSecure(amountCents: number): boolean {
  return amountCents >= PAYMENT_SECURITY_CONFIG.THREE_D_SECURE_THRESHOLD;
}

/**
 * Mask credit card number for display
 * Only shows last 4 digits
 * @param cardNumber - Full card number
 * @returns Masked card number (e.g., "**** **** **** 1234")
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return '****';
  }

  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Validate that we never store complete card numbers
 * This function should be used in development to ensure compliance
 * @param data - Any data object to check
 * @returns true if no card numbers detected
 */
export function validateNoCardNumbers(data: any): boolean {
  const cardNumberPattern = /\b\d{13,19}\b/g;
  const dataString = JSON.stringify(data);

  const matches = dataString.match(cardNumberPattern);

  if (matches && matches.length > 0) {
    console.error(
      'SECURITY WARNING: Potential card number detected in data!',
      'This should never happen in production.'
    );
    return false;
  }

  return true;
}

/**
 * Sanitize payment metadata before storage
 * Removes any sensitive information
 * @param metadata - Payment metadata object
 * @returns Sanitized metadata
 */
export function sanitizePaymentMetadata(metadata: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  // Allowed fields that can be stored
  const allowedFields = [
    'bookingId',
    'hotelId',
    'userId',
    'guestName',
    'checkInDate',
    'checkOutDate',
    'roomType',
  ];

  for (const key of allowedFields) {
    if (metadata[key] !== undefined && metadata[key] !== null) {
      sanitized[key] = String(metadata[key]);
    }
  }

  return sanitized;
}

/**
 * Generate a secure token for payment method storage
 * This is a placeholder - in production, use Stripe's tokenization
 * @returns Secure token string
 */
export function generatePaymentToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `pm_${timestamp}_${random}`;
}

/**
 * Validate payment method token format
 * @param token - Payment method token
 * @returns true if token format is valid
 */
export function isValidPaymentToken(token: string): boolean {
  // Stripe payment method tokens start with 'pm_'
  // Stripe payment intent tokens start with 'pi_'
  // Stripe card tokens start with 'tok_'
  const validPrefixes = ['pm_', 'pi_', 'tok_', 'card_', 'src_'];

  return validPrefixes.some(prefix => token.startsWith(prefix));
}

/**
 * Check if a saved payment method has expired
 * @param expiryMonth - Card expiry month (1-12)
 * @param expiryYear - Card expiry year (full year, e.g., 2025)
 * @returns true if card has expired
 */
export function isPaymentMethodExpired(expiryMonth: number, expiryYear: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  if (expiryYear < currentYear) {
    return true;
  }

  if (expiryYear === currentYear && expiryMonth < currentMonth) {
    return true;
  }

  return false;
}

/**
 * Security headers for payment API requests
 */
export const PAYMENT_SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

/**
 * Validate payment amount
 * @param amount - Amount in cents
 * @returns true if amount is valid
 */
export function isValidPaymentAmount(amount: number): boolean {
  // Amount must be positive
  if (amount <= 0) {
    return false;
  }

  // Amount must be an integer (no fractional cents)
  if (!Number.isInteger(amount)) {
    return false;
  }

  // Amount must be reasonable (less than $1 million)
  if (amount > 100000000) {
    return false;
  }

  return true;
}

/**
 * Log security event (for audit trail)
 * @param event - Security event type
 * @param details - Event details
 */
export function logSecurityEvent(
  event:
    | 'payment_initiated'
    | 'payment_completed'
    | 'payment_failed'
    | '3ds_required'
    | 'token_created',
  details: Record<string, any>
): void {
  const logEntry = {
    event,
    timestamp: new Date().toISOString(),
    details: sanitizePaymentMetadata(details),
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[Payment Security]', logEntry);
  }

  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to security monitoring service
    // Example: sendToSecurityMonitoring(logEntry);
  }
}

/**
 * Create a Content Security Policy for payment pages
 * @returns CSP header value
 */
export function getPaymentCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' https://js.stripe.com",
    'frame-src https://js.stripe.com https://hooks.stripe.com',
    "connect-src 'self' https://api.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
  ].join('; ');
}
