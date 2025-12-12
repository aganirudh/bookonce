/**
 * Payment API Service
 * Handles all payment-related operations using Stripe
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import type {
  PaymentIntent,
  PaymentConfirmation,
  RefundConfirmation,
  PaymentMethod,
} from '@/types/booking';
import {
  enforceSecureConnection,
  requires3DSecure,
  isValidPaymentToken,
  isValidPaymentAmount,
  sanitizePaymentMetadata,
  logSecurityEvent,
  PAYMENT_SECURITY_HEADERS,
} from '../utils/paymentSecurity';
import { performanceMonitoringService } from './PerformanceMonitoringService';

// Rate limiting configuration
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes in milliseconds
const MAX_ATTEMPTS = 5;

/**
 * PaymentAPIService class
 * Manages payment processing through Stripe with rate limiting and error handling
 */
export class PaymentAPIService {
  private stripePromise: Promise<Stripe | null>;
  private apiBaseUrl: string;
  private rateLimitMap: Map<string, RateLimitEntry>;

  constructor(publishableKey: string, apiBaseUrl: string = '/api') {
    // Enforce HTTPS for payment operations
    enforceSecureConnection();
    
    this.stripePromise = loadStripe(publishableKey);
    this.apiBaseUrl = apiBaseUrl;
    this.rateLimitMap = new Map();
  }

  /**
   * Check and enforce rate limiting
   * @param userId - User identifier for rate limiting
   * @throws Error if rate limit exceeded
   */
  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(userId);

    if (entry) {
      // Reset if window has passed
      if (now >= entry.resetAt) {
        this.rateLimitMap.set(userId, {
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW,
        });
        return;
      }

      // Check if limit exceeded
      if (entry.count >= MAX_ATTEMPTS) {
        const remainingTime = Math.ceil((entry.resetAt - now) / 1000 / 60);
        throw new Error(
          `Rate limit exceeded. Please try again in ${remainingTime} minutes.`
        );
      }

      // Increment count
      entry.count += 1;
    } else {
      // First attempt
      this.rateLimitMap.set(userId, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      });
    }
  }

  /**
   * Create a payment intent for a booking
   * @param amount - Amount in cents
   * @param currency - Currency code (e.g., 'usd')
   * @param metadata - Additional metadata for the payment
   * @returns PaymentIntent object
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<PaymentIntent> {
    const endTimer = performanceMonitoringService.startTimer('createPaymentIntent');
    
    try {
      // Validate payment amount
      if (!isValidPaymentAmount(amount)) {
        throw new Error('Invalid payment amount');
      }

      // Check rate limit using booking metadata
      const userId = metadata.userId || 'guest';
      this.checkRateLimit(userId);

      // Sanitize metadata to ensure no sensitive data is stored
      const sanitizedMetadata = sanitizePaymentMetadata(metadata);

      // Log security event
      logSecurityEvent('payment_initiated', {
        amount,
        currency,
        userId,
      });

      const response = await fetch(`${this.apiBaseUrl}/payments/create-intent`, {
        method: 'POST',
        headers: PAYMENT_SECURITY_HEADERS,
        body: JSON.stringify({
          amount,
          currency,
          metadata: sanitizedMetadata,
          // Request 3D Secure for high-value transactions
          captureMethod: requires3DSecure(amount) ? 'manual' : 'automatic',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const duration = endTimer();
        performanceMonitoringService.trackApiResponseTime(
          '/api/payments/create-intent',
          'POST',
          duration,
          response.status,
          false
        );
        throw new Error(error.message || 'Failed to create payment intent');
      }

      const data = await response.json();

      // Track successful API call
      const duration = endTimer();
      performanceMonitoringService.trackApiResponseTime(
        '/api/payments/create-intent',
        'POST',
        duration,
        200,
        true
      );

      // Log successful payment intent creation
      logSecurityEvent('token_created', {
        paymentIntentId: data.id,
        amount: data.amount,
      });

      return {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        clientSecret: data.client_secret,
      };
    } catch (error) {
      logSecurityEvent('payment_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm a payment with 3D Secure support
   * @param paymentIntentId - Payment intent ID
   * @param paymentMethodId - Payment method ID from Stripe Elements
   * @returns PaymentConfirmation object
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentConfirmation> {
    const endTimer = performanceMonitoringService.startTimer('confirmPayment');
    
    try {
      // Validate payment tokens
      if (!isValidPaymentToken(paymentIntentId)) {
        throw new Error('Invalid payment intent ID');
      }
      if (!isValidPaymentToken(paymentMethodId)) {
        throw new Error('Invalid payment method ID');
      }

      const stripe = await this.stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Confirm the payment on the server
      const response = await fetch(`${this.apiBaseUrl}/payments/confirm`, {
        method: 'POST',
        headers: PAYMENT_SECURITY_HEADERS,
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        const duration = endTimer();
        performanceMonitoringService.trackPaymentAttempt(false, duration, paymentIntentId, error.type);
        throw new Error(error.message || 'Payment confirmation failed');
      }

      const data = await response.json();

      // Handle 3D Secure if required
      if (data.requiresAction && data.clientSecret) {
        // Log 3D Secure requirement
        logSecurityEvent('3ds_required', {
          paymentIntentId: data.id,
        });

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret
        );

        if (stripeError) {
          logSecurityEvent('payment_failed', {
            paymentIntentId: data.id,
            error: stripeError.message,
          });
          throw new Error(stripeError.message || 'Payment authentication failed');
        }

        if (!paymentIntent) {
          throw new Error('Payment intent not returned after authentication');
        }

        const confirmation: PaymentConfirmation = {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'failed',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          paymentMethod: paymentMethodId,
        };

        // Track payment attempt
        const duration = endTimer();
        performanceMonitoringService.trackPaymentAttempt(
          confirmation.status === 'succeeded',
          duration,
          paymentIntent.id
        );

        if (confirmation.status === 'succeeded') {
          logSecurityEvent('payment_completed', {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
          });
        }

        return confirmation;
      }

      const confirmation: PaymentConfirmation = {
        paymentIntentId: data.id,
        status: data.status === 'succeeded' ? 'succeeded' : 'failed',
        amount: data.amount,
        currency: data.currency,
        paymentMethod: paymentMethodId,
        receiptUrl: data.receipt_url,
      };

      // Track payment attempt
      const duration = endTimer();
      performanceMonitoringService.trackPaymentAttempt(
        confirmation.status === 'succeeded',
        duration,
        data.id
      );

      if (confirmation.status === 'succeeded') {
        logSecurityEvent('payment_completed', {
          paymentIntentId: data.id,
          amount: data.amount,
        });
      }

      return confirmation;
    } catch (error) {
      logSecurityEvent('payment_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Process a refund for a cancelled booking
   * @param paymentIntentId - Original payment intent ID
   * @param amount - Amount to refund in cents
   * @param reason - Reason for refund
   * @returns RefundConfirmation object
   */
  async processRefund(
    paymentIntentId: string,
    amount: number,
    reason: string
  ): Promise<RefundConfirmation> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Refund processing failed');
      }

      const data = await response.json();

      return {
        refundId: data.id,
        paymentIntentId: data.payment_intent,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        reason: data.reason,
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get saved payment methods for a user
   * @param userId - User ID
   * @returns Array of saved payment methods (never includes full card numbers)
   */
  async getSavedPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/payments/methods?userId=${userId}`,
        {
          method: 'GET',
          headers: PAYMENT_SECURITY_HEADERS,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payment methods');
      }

      const data = await response.json();

      // Map payment methods, ensuring we only return tokenized data
      // Never return full card numbers
      return data.paymentMethods.map((pm: any) => ({
        id: pm.id, // This is a Stripe token, not actual card data
        type: pm.type,
        card: {
          brand: pm.card.brand,
          last4: pm.card.last4, // Only last 4 digits
          expiryMonth: pm.card.exp_month,
          expiryYear: pm.card.exp_year,
        },
        isDefault: pm.metadata?.isDefault === 'true',
      }));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Get the Stripe instance
   * @returns Stripe instance or null
   */
  async getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  /**
   * Clear rate limit for a user (useful for testing)
   * @param userId - User identifier
   */
  clearRateLimit(userId: string): void {
    this.rateLimitMap.delete(userId);
  }
}

// Export singleton instance
// In production, replace with actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock';

export const paymentAPIService = new PaymentAPIService(STRIPE_PUBLISHABLE_KEY);
