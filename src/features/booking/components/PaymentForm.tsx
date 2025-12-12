/**
 * PaymentForm Component
 * Stripe Elements integration for secure payment processing
 * 
 * SECURITY NOTES:
 * - Uses Stripe Elements for PCI-compliant card input
 * - Card data never touches our servers (handled by Stripe)
 * - Automatic tokenization - we only receive payment tokens
 * - Supports 3D Secure authentication for high-value transactions
 * - All payment data transmitted over HTTPS
 */

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSecureConnection } from '../utils/paymentSecurity';

interface PaymentFormProps {
  amount: number;
  currency: string;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  className?: string;
}

/**
 * PaymentForm component with Stripe Elements
 * Handles card input, validation, and payment processing with 3D Secure support
 */
export function PaymentForm({
  amount,
  currency,
  clientSecret,
  onSuccess,
  onError,
  className,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Security check: Ensure connection is secure
  useEffect(() => {
    if (!isSecureConnection()) {
      setErrorMessage('Payment requires a secure HTTPS connection');
      return;
    }
  }, []);

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }
    setIsReady(true);
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Payment system is not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Handle payment errors
        const userFriendlyMessage = getUserFriendlyErrorMessage(error.message || 'Payment failed');
        setErrorMessage(userFriendlyMessage);
        onError(userFriendlyMessage);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful
        onSuccess(paymentIntent.id);
      } else {
        // Unexpected status
        const message = 'Payment processing incomplete. Please contact support.';
        setErrorMessage(message);
        onError(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Security Badges */}
      <div className="flex items-center justify-center gap-4 py-4 border-b">
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-xs">SSL Encrypted</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-xs">PCI Compliant</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          <span className="text-xs">Secure Payment</span>
        </Badge>
      </div>

      {/* Payment Amount */}
      <div className="text-center py-2">
        <p className="text-sm text-muted-foreground">Total Amount</p>
        <p className="text-2xl font-bold">{formatAmount(amount, currency)}</p>
      </div>

      {/* Stripe Payment Element */}
      <div className="min-h-[200px]">
        {clientSecret && (
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
              fields: {
                billingDetails: {
                  address: {
                    country: 'auto',
                  },
                },
              },
            }}
          />
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isReady || isProcessing || !stripe || !elements}
        className="w-full min-h-[44px]"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Pay {formatAmount(amount, currency)}
          </>
        )}
      </Button>

      {/* Security Notice */}
      <p className="text-xs text-center text-muted-foreground">
        Your payment information is encrypted and secure. We never store your card details.
      </p>
    </form>
  );
}

/**
 * Convert Stripe error messages to user-friendly messages
 */
function getUserFriendlyErrorMessage(stripeMessage: string): string {
  const errorMap: Record<string, string> = {
    'card_declined': 'Your card was declined. Please try another payment method.',
    'insufficient_funds': 'Your card has insufficient funds. Please try another card.',
    'expired_card': 'Your card has expired. Please use a different card.',
    'incorrect_cvc': 'The security code (CVC) is incorrect. Please check and try again.',
    'processing_error': 'An error occurred while processing your card. Please try again.',
    'incorrect_number': 'The card number is incorrect. Please check and try again.',
    'invalid_expiry_month': 'The expiration month is invalid.',
    'invalid_expiry_year': 'The expiration year is invalid.',
    'authentication_required': 'Additional authentication is required. Please complete the verification.',
  };

  // Check if the message contains any known error codes
  for (const [code, message] of Object.entries(errorMap)) {
    if (stripeMessage.toLowerCase().includes(code.replace('_', ' '))) {
      return message;
    }
  }

  // Default user-friendly message
  return 'We couldn\'t process your payment. Please check your card details and try again.';
}
