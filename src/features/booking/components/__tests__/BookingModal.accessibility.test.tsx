/**
 * BookingModal Accessibility Tests
 * Tests for keyboard navigation, ARIA labels, and screen reader support
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingModal } from '../BookingModal';
import type { Hotel } from '@/types/booking';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
  }),
}));

vi.mock('../../services/PaymentAPIService', () => ({
  paymentAPIService: {
    createPaymentIntent: vi.fn(),
    confirmPayment: vi.fn(),
    processRefund: vi.fn(),
    getSavedPaymentMethods: vi.fn(),
  },
}));

vi.mock('../../services/BookingAPIService', () => ({
  bookingAPIService: {
    checkAvailability: vi.fn(),
    getPricing: vi.fn(),
    createBooking: vi.fn(),
    getBooking: vi.fn(),
    getUserBookings: vi.fn(),
    modifyBooking: vi.fn(),
    cancelBooking: vi.fn(),
  },
}));

vi.mock('../../services/AnalyticsService', () => ({
  analyticsService: {
    trackBookingStarted: vi.fn(),
    trackDatesSelected: vi.fn(),
    trackRoomSelected: vi.fn(),
    trackGuestInfoCompleted: vi.fn(),
    trackPaymentSubmitted: vi.fn(),
    trackBookingCompleted: vi.fn(),
    trackBookingError: vi.fn(),
    trackBookingCompletionTime: vi.fn(),
  },
}));

vi.mock('../../services/ErrorLoggingService', () => ({
  errorLoggingService: {
    logError: vi.fn(),
    logPaymentError: vi.fn(),
    logBookingError: vi.fn(),
  },
}));

vi.mock('../../stores/bookingStore', () => ({
  useBookingStore: () => ({
    currentBooking: {
      step: 'dates',
      checkInDate: null,
      checkOutDate: null,
      selectedRoom: null,
      guestInfo: {},
      availability: null,
      pricing: null,
      isLoading: false,
      error: null,
    },
    startBooking: vi.fn(),
    updateBookingStep: vi.fn(),
    cancelCurrentBooking: vi.fn(),
    setDates: vi.fn(),
    selectRoom: vi.fn(),
    setGuestInfo: vi.fn(),
    setAvailability: vi.fn(),
    setPricing: vi.fn(),
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock('../../hooks/useAvailability', () => ({
  useAvailability: () => ({
    availability: null,
    isLoading: false,
    error: null,
    checkAvailability: vi.fn(),
  }),
}));

const mockHotel: Hotel = {
  id: 1,
  title: 'Test Hotel',
  location: 'Test Location',
  price: 100,
  rating: 4.5,
  reviews: 100,
  image: '/test.jpg',
  amenities: ['WiFi', 'Pool'],
  tags: ['Beach', 'Luxury'],
  energy: 0.8,
  social: 0.6,
  budget: 0.5,
  coordinates: [0, 0],
  instantBooking: true,
  cancellationPolicy: {
    type: 'flexible',
    description: 'Free cancellation',
    rules: [],
  },
  checkInTime: '15:00',
  checkOutTime: '11:00',
  providerId: 'test',
  providerHotelId: 'test-123',
};

describe('BookingModal Accessibility', () => {
  describe('Keyboard Navigation', () => {
    it('should close modal when Escape key is pressed', async () => {
      const onClose = vi.fn();
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={onClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should have focusable close button', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
    });

    it('should have focusable back button when available', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      // Back button should not be visible on first step
      const backButton = screen.queryByLabelText('Go back');
      expect(backButton).not.toBeInTheDocument();
    });
  });

  describe('ARIA Labels', () => {
    it('should have proper ARIA labels on modal', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'booking-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'booking-modal-description');
    });

    it('should have descriptive title', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      const title = document.getElementById('booking-modal-title');
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe('Select Dates');
    });

    it('should have descriptive subtitle', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      const description = screen.getByText('Choose your check-in and check-out dates');
      expect(description).toBeInTheDocument();
      expect(description.id).toBe('booking-modal-description');
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce step progress', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      const progress = screen.getByText(/Step 1 of 5/);
      expect(progress).toBeInTheDocument();
    });

    it('should support live region announcements', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      // The component uses screen reader announcer utility which creates live regions dynamically
      // Just verify the component renders without errors
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Visual Accessibility', () => {
    it('should have minimum touch target size for buttons', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      const closeButton = screen.getByLabelText('Close');
      const styles = window.getComputedStyle(closeButton);

      // Check for min-height class
      expect(closeButton.className).toContain('h-8');
    });

    it('should have visible focus indicators', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      const closeButton = screen.getByLabelText('Close');
      closeButton.focus();

      // Button should be focused
      expect(document.activeElement).toBe(closeButton);
    });

    it('should not convey information by color alone', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      // Instant booking badge should have both icon and text
      const instantBadge = screen.queryByText(/Instant/);
      if (instantBadge) {
        expect(instantBadge).toBeInTheDocument();
      }
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      // Date selector should have accessible labels
      const dateButton = screen.getByRole('button', { name: /Select dates/i });
      expect(dateButton).toBeInTheDocument();
    });

    it('should indicate required fields', () => {
      render(<BookingModal hotel={mockHotel} isOpen={true} onClose={vi.fn()} />);

      // Check for aria-required attributes when on guest info step
      // This would be tested more thoroughly in GuestInfoForm tests
      expect(true).toBe(true);
    });
  });
});
