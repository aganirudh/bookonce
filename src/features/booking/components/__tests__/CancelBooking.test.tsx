import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelBooking } from '../CancelBooking';
import type { BookingConfirmation } from '@/types/booking';

vi.mock('../../services/BookingAPIService', () => ({
  bookingAPIService: {
    cancelBooking: vi.fn(),
  },
}));

const createMockBooking = (
  policyType: 'flexible' | 'moderate' | 'strict' | 'non-refundable',
  daysUntilCheckIn: number
): BookingConfirmation => {
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + daysUntilCheckIn);
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + 5);

  const policies = {
    flexible: {
      type: 'flexible' as const,
      description: 'Free cancellation up to 24 hours before check-in',
      rules: [
        { daysBeforeCheckIn: 1, refundPercentage: 100 },
        { daysBeforeCheckIn: 0, refundPercentage: 0 },
      ],
    },
    moderate: {
      type: 'moderate' as const,
      description: 'Free cancellation up to 5 days before check-in',
      rules: [
        { daysBeforeCheckIn: 5, refundPercentage: 100 },
        { daysBeforeCheckIn: 2, refundPercentage: 50 },
        { daysBeforeCheckIn: 0, refundPercentage: 0 },
      ],
    },
    strict: {
      type: 'strict' as const,
      description: 'Free cancellation up to 14 days before check-in',
      rules: [
        { daysBeforeCheckIn: 14, refundPercentage: 100 },
        { daysBeforeCheckIn: 7, refundPercentage: 50 },
        { daysBeforeCheckIn: 0, refundPercentage: 0 },
      ],
    },
    'non-refundable': {
      type: 'non-refundable' as const,
      description: 'Non-refundable booking',
      rules: [{ daysBeforeCheckIn: 0, refundPercentage: 0 }],
    },
  };

  return {
    bookingId: 'BK001',
    referenceNumber: 'REF-001',
    hotel: {
      id: 1,
      title: 'Test Hotel',
      location: 'Test City',
      price: 200,
      rating: 4.5,
      reviews: 100,
      image: '/test.jpg',
      amenities: ['WiFi', 'Pool'],
      tags: ['Luxury'],
      energy: 70,
      social: 60,
      budget: 80,
      coordinates: [0, 0],
      instantBooking: true,
      cancellationPolicy: policies[policyType],
      checkInTime: '15:00',
      checkOutTime: '11:00',
    },
    checkInDate: checkInDate.toISOString(),
    checkOutDate: checkOutDate.toISOString(),
    guestInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      country: 'US',
    },
    roomDetails: {
      id: 'room-1',
      name: 'Deluxe Room',
      description: 'A comfortable room',
      capacity: 2,
      bedType: 'King',
      size: 30,
      images: ['/room.jpg'],
      amenities: ['WiFi'],
      basePrice: 200,
      available: 5,
      instantBooking: true,
    },
    pricing: {
      baseRate: 200,
      numberOfNights: 5,
      subtotal: 1000,
      taxes: [{ name: 'VAT', amount: 100, percentage: 10 }],
      fees: [{ name: 'Service Fee', amount: 50, description: 'Service charge' }],
      total: 1150,
      currency: 'USD',
    },
    status: 'confirmed',
    confirmationSentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

describe('CancelBooking', () => {
  const mockOnClose = vi.fn();
  const mockOnCancellationComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Refund Scenarios', () => {
    it('should calculate 100% refund for flexible policy with 2+ days until check-in', () => {
      const booking = createMockBooking('flexible', 2);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('$1,150.00 USD')).toBeInTheDocument();
    });

    it('should calculate 100% refund for moderate policy with 5+ days until check-in', () => {
      const booking = createMockBooking('moderate', 7);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('$1,150.00 USD')).toBeInTheDocument();
    });

    it('should calculate 100% refund for strict policy with 14+ days until check-in', () => {
      const booking = createMockBooking('strict', 15);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('$1,150.00 USD')).toBeInTheDocument();
    });
  });

  describe('Partial Refund Scenarios', () => {
    it('should calculate 50% refund for moderate policy with 3 days until check-in', () => {
      const booking = createMockBooking('moderate', 3);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('$575.00 USD')).toBeInTheDocument();
    });

    it('should calculate 50% refund for strict policy with 10 days until check-in', () => {
      const booking = createMockBooking('strict', 10);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('$575.00 USD')).toBeInTheDocument();
    });
  });

  describe('No Refund Scenarios', () => {
    it('should calculate 0% refund for flexible policy with 0 days until check-in', () => {
      const booking = createMockBooking('flexible', 0);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('$0.00 USD')).toBeInTheDocument();
      expect(
        screen.getByText(/non-refundable based on the cancellation policy/i)
      ).toBeInTheDocument();
    });

    it('should calculate 0% refund for non-refundable policy', () => {
      const booking = createMockBooking('non-refundable', 30);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('$0.00 USD')).toBeInTheDocument();
      expect(
        screen.getByText(/non-refundable based on the cancellation policy/i)
      ).toBeInTheDocument();
    });

    it('should calculate 0% refund for moderate policy with 0 days until check-in', () => {
      const booking = createMockBooking('moderate', 0);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('$0.00 USD')).toBeInTheDocument();
    });
  });

  describe('Cancellation Flow', () => {
    it('should require reason selection before enabling cancel button', async () => {
      const booking = createMockBooking('flexible', 2);
      const user = userEvent.setup();
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
      expect(cancelButton).toBeDisabled();
      const reasonSelect = screen.getByRole('combobox');
      await user.click(reasonSelect);
      const changeOfPlans = await screen.findByRole('option', { name: /change of plans/i });
      await user.click(changeOfPlans);
      await waitFor(() => {
        expect(cancelButton).not.toBeDisabled();
      });
    });

    it('should show confirmation dialog before final cancellation', async () => {
      const booking = createMockBooking('flexible', 2);
      const user = userEvent.setup();
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      const reasonSelect = screen.getByRole('combobox');
      await user.click(reasonSelect);
      const changeOfPlans = await screen.findByRole('option', { name: /change of plans/i });
      await user.click(changeOfPlans);
      const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
      await user.click(cancelButton);
      await waitFor(() => {
        expect(screen.getByText(/are you absolutely sure/i)).toBeInTheDocument();
        expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      });
    });

    it('should call API and complete cancellation on confirmation', async () => {
      const { bookingAPIService } = await import('../../services/BookingAPIService');
      const mockCancelBooking = vi.mocked(bookingAPIService.cancelBooking);
      mockCancelBooking.mockResolvedValue({
        bookingId: 'BK001',
        referenceNumber: 'REF-001',
        cancelledAt: new Date().toISOString(),
        refundAmount: 1150,
        refundCurrency: 'USD',
        refundStatus: 'pending',
        reason: 'Change of plans',
      });
      const booking = createMockBooking('flexible', 2);
      const user = userEvent.setup();
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      const reasonSelect = screen.getByRole('combobox');
      await user.click(reasonSelect);
      const changeOfPlans = await screen.findByRole('option', { name: /change of plans/i });
      await user.click(changeOfPlans);
      const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
      await user.click(cancelButton);
      const confirmButton = await screen.findByRole('button', { name: /confirm cancellation/i });
      await user.click(confirmButton);
      await waitFor(() => {
        expect(mockCancelBooking).toHaveBeenCalledWith('BK001', 'Change of plans', undefined);
      });
      await waitFor(() => {
        expect(mockOnCancellationComplete).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should allow going back from confirmation dialog', async () => {
      const booking = createMockBooking('flexible', 2);
      const user = userEvent.setup();
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      const reasonSelect = screen.getByRole('combobox');
      await user.click(reasonSelect);
      const changeOfPlans = await screen.findByRole('option', { name: /change of plans/i });
      await user.click(changeOfPlans);
      const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
      await user.click(cancelButton);
      await waitFor(() => {
        expect(screen.getByText(/are you absolutely sure/i)).toBeInTheDocument();
      });
      const goBackButton = screen.getByRole('button', { name: /go back/i });
      await user.click(goBackButton);
      await waitFor(() => {
        expect(screen.queryByText(/are you absolutely sure/i)).not.toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });
  });

  describe('Policy Display', () => {
    it('should display cancellation policy rules correctly', () => {
      const booking = createMockBooking('moderate', 7);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText(/moderate policy/i)).toBeInTheDocument();
      expect(
        screen.getByText(/free cancellation up to 5 days before check-in/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/5\+ days before check-in: 100% refund/i)).toBeInTheDocument();
      expect(screen.getByText(/2\+ days before check-in: 50% refund/i)).toBeInTheDocument();
      expect(screen.getByText(/less than 1 day before check-in: 0% refund/i)).toBeInTheDocument();
    });

    it('should display booking details correctly', () => {
      const booking = createMockBooking('flexible', 2);
      render(
        <CancelBooking
          booking={booking}
          isOpen={true}
          onClose={mockOnClose}
          onCancellationComplete={mockOnCancellationComplete}
        />
      );
      expect(screen.getByText('Test Hotel')).toBeInTheDocument();
      expect(screen.getByText('Test City')).toBeInTheDocument();
      expect(screen.getByText('REF-001')).toBeInTheDocument();
      expect(screen.getByText(/total paid/i)).toBeInTheDocument();
      expect(screen.getByText('$1,150.00 USD')).toBeInTheDocument();
    });
  });
});
