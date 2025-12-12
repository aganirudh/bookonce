/**
 * PricingSummary Component
 * Displays pricing breakdown with currency conversion and cancellation policy
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PricingDetails, CancellationPolicy } from '@/types/booking';

// ============================================================================
// Component Props
// ============================================================================

interface PricingSummaryProps {
  pricing: PricingDetails | null;
  cancellationPolicy?: CancellationPolicy;
  isLoading?: boolean;
  sticky?: boolean;
  className?: string;
  onCurrencyChange?: (currency: string) => void;
}

// ============================================================================
// Supported Currencies
// ============================================================================

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(amount: number, currency: string): string {
  const currencyInfo = CURRENCIES.find((c) => c.code === currency);
  const symbol = currencyInfo?.symbol || currency;
  
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getCancellationPolicyBadge(type: CancellationPolicy['type']) {
  const badges = {
    flexible: { label: 'Flexible', variant: 'default' as const },
    moderate: { label: 'Moderate', variant: 'secondary' as const },
    strict: { label: 'Strict', variant: 'outline' as const },
    'non-refundable': { label: 'Non-Refundable', variant: 'destructive' as const },
  };
  
  return badges[type] || badges.moderate;
}

// ============================================================================
// Component
// ============================================================================

export function PricingSummary({
  pricing,
  cancellationPolicy,
  isLoading = false,
  sticky = true,
  className,
  onCurrencyChange,
}: PricingSummaryProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(
    pricing?.currency || 'USD'
  );

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    onCurrencyChange?.(currency);
  };

  // Calculate display amounts based on selected currency
  const displayPricing = pricing
    ? selectedCurrency === pricing.currency
      ? pricing
      : pricing.convertedTotal
      ? {
          ...pricing,
          baseRate: pricing.convertedTotal.amount / pricing.numberOfNights,
          subtotal: pricing.convertedTotal.amount,
          taxes: pricing.taxes.map((tax) => ({
            ...tax,
            amount: tax.amount * (pricing.convertedTotal?.rate || 1),
          })),
          fees: pricing.fees.map((fee) => ({
            ...fee,
            amount: fee.amount * (pricing.convertedTotal?.rate || 1),
          })),
          total: pricing.convertedTotal.amount,
          currency: pricing.convertedTotal.currency,
        }
      : pricing
    : null;

  if (isLoading) {
    return (
      <Card className={cn(sticky && 'sticky top-4', className)} role="region" aria-label="Pricing summary">
        <CardHeader>
          <CardTitle>Price Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading pricing information">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pricing) {
    return (
      <Card className={cn(sticky && 'sticky top-4', className)} role="region" aria-label="Pricing summary">
        <CardHeader>
          <CardTitle>Price Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground" role="status">
            Select dates and room to see pricing
          </p>
        </CardContent>
      </Card>
    );
  }

  const policyBadge = cancellationPolicy
    ? getCancellationPolicyBadge(cancellationPolicy.type)
    : null;

  return (
    <Card className={cn(sticky && 'sticky top-4', className)} role="region" aria-label="Pricing summary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle id="pricing-summary-title">Price Summary</CardTitle>
          {onCurrencyChange && (
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[100px] h-8" aria-label="Select currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Base Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(displayPricing.baseRate, displayPricing.currency)} x{' '}
              {displayPricing.numberOfNights} night
              {displayPricing.numberOfNights > 1 ? 's' : ''}
            </span>
            <span className="font-medium">
              {formatCurrency(displayPricing.subtotal, displayPricing.currency)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Taxes */}
        {displayPricing.taxes.length > 0 && (
          <div className="space-y-2">
            {displayPricing.taxes.map((tax, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{tax.name}</span>
                  {tax.percentage && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tax.percentage}% of base rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <span className="font-medium">
                  {formatCurrency(tax.amount, displayPricing.currency)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Fees */}
        {displayPricing.fees.length > 0 && (
          <div className="space-y-2">
            {displayPricing.fees.map((fee, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{fee.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{fee.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="font-medium">
                  {formatCurrency(fee.amount, displayPricing.currency)}
                </span>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between text-lg font-bold" role="status" aria-live="polite" aria-atomic="true">
          <span>Total</span>
          <span aria-label={`Total price: ${formatCurrency(displayPricing.total, displayPricing.currency)}`}>
            {formatCurrency(displayPricing.total, displayPricing.currency)}
          </span>
        </div>

        {/* Currency Conversion Notice */}
        {pricing.convertedTotal && selectedCurrency !== pricing.currency && (
          <p className="text-xs text-muted-foreground">
            Original price: {formatCurrency(pricing.total, pricing.currency)}
            <br />
            Exchange rate: 1 {pricing.currency} ={' '}
            {pricing.convertedTotal.rate.toFixed(4)} {pricing.convertedTotal.currency}
          </p>
        )}

        {/* Cancellation Policy */}
        {cancellationPolicy && policyBadge && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cancellation Policy</span>
                <Badge variant={policyBadge.variant}>{policyBadge.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {cancellationPolicy.description}
              </p>
              
              {/* Cancellation Rules */}
              {cancellationPolicy.rules.length > 0 && (
                <div className="space-y-1 pt-2">
                  {cancellationPolicy.rules.map((rule, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      • {rule.daysBeforeCheckIn > 0 ? (
                        <>
                          Cancel {rule.daysBeforeCheckIn}+ days before:{' '}
                          {rule.refundPercentage}% refund
                          {rule.fee && ` (${formatCurrency(rule.fee, displayPricing.currency)} fee)`}
                        </>
                      ) : (
                        <>
                          Cancel within {Math.abs(rule.daysBeforeCheckIn)} days:{' '}
                          {rule.refundPercentage}% refund
                          {rule.fee && ` (${formatCurrency(rule.fee, displayPricing.currency)} fee)`}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Additional Info */}
        <div className="pt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            • Prices include all taxes and fees
          </p>
          <p className="text-xs text-muted-foreground">
            • Payment will be processed in {displayPricing.currency}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
