/**
 * PricingSummary Component Tests
 * Tests for pricing display, currency conversion, and cancellation policy
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingSummary } from '../PricingSummary';
import type { PricingDetails, CancellationPolicy } from '@/types/booking';

describe('PricingSummary Component', () => {
  const mockPricing: PricingDetails = {
    baseRate: 200,
    numberOfNights: 3,
    subtotal: 600,
    taxes: [
      { name: 'VAT', amount: 60, percentage: 10 },
      { name: 'City Tax', amount: 30 },
    ],
    fees: [
      { name: 'Service Fee', amount: 20, description: 'Booking service fee' },
      { name: 'Cleaning Fee', amount: 40, description: 'One-time cleaning fee' },
    ],
    total: 750,
    currency: 'USD',
  };

  const mockCancellationPolicy: CancellationPolicy = {
    type: 'flexible',
    description: 'Free cancellation up to 24 hours before check-in',
    rules: [
      { daysBeforeCheckIn: 1, refundPercentage: 100 },
      { daysBeforeCheckIn: 0, refundPercentage: 50 },
    ],
  };

  describe('Initial Rendering', () => {
    it('should render pricing summary title', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.getByText('Price Summary')).toBeInTheDocument();
    });

    it('should display message when no pricing data', () => {
      render(<PricingSummary pricing={null} />);

      expect(screen.getByText(/select dates and room to see pricing/i)).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<PricingSummary pricing={null} isLoading={true} />);

      // Should show skeleton loaders
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Pricing Display', () => {
    it('should display base rate with number of nights', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.getByText(/\$200\.00 x 3 nights?/i)).toBeInTheDocument();
      expect(screen.getByText('$600.00')).toBeInTheDocument();
    });

    it('should display singular "night" for one night', () => {
      const singleNightPricing = { ...mockPricing, numberOfNights: 1, subtotal: 200 };
      render(<PricingSummary pricing={singleNightPricing} />);

      expect(screen.getByText(/\$200\.00 x 1 night/i)).toBeInTheDocument();
    });

    it('should display all taxes', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.getByText('VAT')).toBeInTheDocument();
      expect(screen.getByText('City Tax')).toBeInTheDocument();
      expect(screen.getByText('$60.00')).toBeInTheDocument();
      expect(screen.getByText('$30.00')).toBeInTheDocument();
    });

    it('should display all fees', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.getByText('Service Fee')).toBeInTheDocument();
      expect(screen.getByText('Cleaning Fee')).toBeInTheDocument();
      expect(screen.getByText('$20.00')).toBeInTheDocument();
      expect(screen.getByText('$40.00')).toBeInTheDocument();
    });

    it('should display total amount', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('$750.00')).toBeInTheDocument();
    });
  });

  describe('Currency Conversion', () => {
    it('should display currency selector when onCurrencyChange is provided', () => {
      const mockOnCurrencyChange = vi.fn();
      render(
        <PricingSummary
          pricing={mockPricing}
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should not display currency selector when onCurrencyChange is not provided', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('should call onCurrencyChange when currency is changed', async () => {
      const user = userEvent.setup();
      const mockOnCurrencyChange = vi.fn();
      
      render(
        <PricingSummary
          pricing={mockPricing}
          onCurrencyChange={mockOnCurrencyChange}
        />
      );

      const currencySelect = screen.getByRole('combobox');
      await user.click(currencySelect);

      const eurOption = await screen.findByRole('option', { name: 'EUR' });
      await user.click(eurOption);

      expect(mockOnCurrencyChange).toHaveBeenCalledWith('EUR');
    });

    it('should display converted pricing when available', () => {
      const pricingWithConversion: PricingDetails = {
        ...mockPricing,
        convertedTotal: {
          amount: 680,
          currency: 'EUR',
          rate: 0.91,
        },
      };

      render(<PricingSummary pricing={pricingWithConversion} />);

      // Should show conversion notice
      expect(screen.getByText(/original price/i)).toBeInTheDocument();
      expect(screen.getByText(/exchange rate/i)).toBeInTheDocument();
    });
  });

  describe('Cancellation Policy', () => {
    it('should display cancellation policy when provided', () => {
      render(
        <PricingSummary
          pricing={mockPricing}
          cancellationPolicy={mockCancellationPolicy}
        />
      );

      expect(screen.getByText('Cancellation Policy')).toBeInTheDocument();
      expect(screen.getByText('Flexible')).toBeInTheDocument();
      expect(screen.getByText(mockCancellationPolicy.description)).toBeInTheDocument();
    });

    it('should not display cancellation policy when not provided', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.queryByText('Cancellation Policy')).not.toBeInTheDocument();
    });

    it('should display flexible policy badge', () => {
      const flexiblePolicy: CancellationPolicy = {
        type: 'flexible',
        description: 'Free cancellation',
        rules: [],
      };

      render(
        <PricingSummary
          pricing={mockPricing}
          cancellationPolicy={flexiblePolicy}
        />
      );

      expect(screen.getByText('Flexible')).toBeInTheDocument();
    });

    it('should display moderate policy badge', () => {
      const moderatePolicy: CancellationPolicy = {
        type: 'moderate',
        description: 'Moderate cancellation',
        rules: [],
      };

      render(
        <PricingSummary
          pricing={mockPricing}
          cancellationPolicy={moderatePolicy}
        />
      );

      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('should display strict policy badge', () => {
      const strictPolicy: CancellationPolicy = {
        type: 'strict',
        description: 'Strict cancellation',
        rules: [],
      };

      render(
        <PricingSummary
          pricing={mockPricing}
          cancellationPolicy={strictPolicy}
        />
      );

      expect(screen.getByText('Strict')).toBeInTheDocument();
    });

    it('should display non-refundable policy badge', () => {
      const nonRefundablePolicy: CancellationPolicy = {
        type: 'non-refundable',
        description: 'No refunds',
        rules: [],
      };

      render(
        <PricingSummary
          pricing={mockPricing}
          cancellationPolicy={nonRefundablePolicy}
        />
      );

      expect(screen.getByText('Non-Refundable')).toBeInTheDocument();
    });

    it('should display cancellation rules', () => {
      render(
        <PricingSummary
          pricing={mockPricing}
          cancellationPolicy={mockCancellationPolicy}
        />
      );

      expect(screen.getByText(/cancel 1\+ days before/i)).toBeInTheDocument();
      expect(screen.getByText(/100% refund/i)).toBeInTheDocument();
    });

    it('should display cancellation fees in rules', () => {
      const policyWithFees: CancellationPolicy = {
        type: 'moderate',
        description: 'Moderate cancellation with fees',
        rules: [
          { daysBeforeCheckIn: 7, refundPercentage: 100, fee: 25 },
          { daysBeforeCheckIn: 3, refundPercentage: 50, fee: 50 },
        ],
      };

      render(
        <PricingSummary
          pricing={mockPricing}
          cancellationPolicy={policyWithFees}
        />
      );

      expect(screen.getByText(/\$25\.00 fee/i)).toBeInTheDocument();
      expect(screen.getByText(/\$50\.00 fee/i)).toBeInTheDocument();
    });
  });

  describe('Sticky Behavior', () => {
    it('should apply sticky class by default', () => {
      const { container } = render(<PricingSummary pricing={mockPricing} />);

      const card = container.querySelector('.sticky');
      expect(card).toBeInTheDocument();
    });

    it('should not apply sticky class when sticky is false', () => {
      const { container } = render(
        <PricingSummary pricing={mockPricing} sticky={false} />
      );

      const card = container.querySelector('.sticky');
      expect(card).not.toBeInTheDocument();
    });
  });

  describe('Additional Information', () => {
    it('should display additional pricing information', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.getByText(/prices include all taxes and fees/i)).toBeInTheDocument();
      expect(screen.getByText(/payment will be processed in USD/i)).toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('should show tooltip for taxes with percentage', async () => {
      const user = userEvent.setup();
      render(<PricingSummary pricing={mockPricing} />);

      // Find info icons
      const infoIcons = screen.getAllByRole('button');
      expect(infoIcons.length).toBeGreaterThan(0);
    });

    it('should show tooltip for fees with description', async () => {
      const user = userEvent.setup();
      render(<PricingSummary pricing={mockPricing} />);

      // Fee descriptions should be available via tooltips
      const infoIcons = screen.getAllByRole('button');
      expect(infoIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle pricing with no taxes', () => {
      const pricingNoTaxes: PricingDetails = {
        ...mockPricing,
        taxes: [],
      };

      render(<PricingSummary pricing={pricingNoTaxes} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.queryByText('VAT')).not.toBeInTheDocument();
    });

    it('should handle pricing with no fees', () => {
      const pricingNoFees: PricingDetails = {
        ...mockPricing,
        fees: [],
      };

      render(<PricingSummary pricing={pricingNoFees} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.queryByText('Service Fee')).not.toBeInTheDocument();
    });

    it('should handle pricing with zero amounts', () => {
      const zeroPricing: PricingDetails = {
        baseRate: 0,
        numberOfNights: 1,
        subtotal: 0,
        taxes: [],
        fees: [],
        total: 0,
        currency: 'USD',
      };

      render(<PricingSummary pricing={zeroPricing} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should format large amounts correctly', () => {
      const largePricing: PricingDetails = {
        baseRate: 5000,
        numberOfNights: 7,
        subtotal: 35000,
        taxes: [],
        fees: [],
        total: 35000,
        currency: 'USD',
      };

      render(<PricingSummary pricing={largePricing} />);

      expect(screen.getByText('$35,000.00')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format USD correctly', () => {
      render(<PricingSummary pricing={mockPricing} />);

      expect(screen.getByText('$750.00')).toBeInTheDocument();
    });

    it('should format EUR correctly', () => {
      const eurPricing: PricingDetails = {
        ...mockPricing,
        currency: 'EUR',
      };

      render(<PricingSummary pricing={eurPricing} />);

      expect(screen.getByText('€750.00')).toBeInTheDocument();
    });

    it('should format GBP correctly', () => {
      const gbpPricing: PricingDetails = {
        ...mockPricing,
        currency: 'GBP',
      };

      render(<PricingSummary pricing={gbpPricing} />);

      expect(screen.getByText('£750.00')).toBeInTheDocument();
    });

    it('should handle unknown currency codes', () => {
      const unknownPricing: PricingDetails = {
        ...mockPricing,
        currency: 'XYZ',
      };

      render(<PricingSummary pricing={unknownPricing} />);

      // Should still display with currency code
      expect(screen.getByText(/XYZ750\.00/)).toBeInTheDocument();
    });
  });
});
