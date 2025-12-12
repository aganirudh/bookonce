/**
 * PaymentFormWrapper Component
 * Provides Stripe Elements context to PaymentForm
 */

import { Elements } from '@stripe/react-stripe-js';
import { paymentAPIService } from '../services/PaymentAPIService';
import { PaymentForm } from './PaymentForm';
import { Loader2 } from 'lucide-react';

interface PaymentFormWrapperProps {
  amount: number;
  currency: string;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  className?: string;
}

/**
 * Wrapper component that provides Stripe Elements context
 */
export function PaymentFormWrapper({
  amount,
  currency,
  clientSecret,
  onSuccess,
  onError,
  className,
}: PaymentFormWrapperProps) {
  const stripePromise = paymentAPIService.getStripe();

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0F172A',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        amount={amount}
        currency={currency}
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
        className={className}
      />
    </Elements>
  );
}

/**
 * Loading state component while Stripe initializes
 */
export function PaymentFormLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading secure payment form...</p>
    </div>
  );
}
