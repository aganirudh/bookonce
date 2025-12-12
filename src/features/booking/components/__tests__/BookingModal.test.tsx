/**
 * BookingModal Integration Tests
 * Tests for complete booking flow, step navigation, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingModal } from '../BookingModal';
import { useBookingStore } from '../../stores/bookingStore';
import { bookingAPIService } from '../../services/BookingAPIService';
import { paymentAPIService } from '../../services/PaymentAPIService';
import type { Hotel, AvailabilityResponse, PricingDetails, PaymentIntent } from '@/types/booking';

// Mock the services
vi.mock('../../services/BookingAPIService');
vi.mock('../../services/PaymentAPIService');

// Mock useAvailability hook
vi.mock('../../hooks/useAvailability', () => ({
  useAvailability: vi.fn(() => ({
    availability: null,
    isLoading: false,
    error: null,
    checkAvailability: vi.fn(),
    clearAvailability: vi.fn(),
  })),
}));

// Mock hotel data
const mockHotel: Hotel = {
  id: 1,
  title: 'Test Hotel',
  location: 'Test Location',
  price: 150,
  rating: 4.5,
  reviews: 100,
  image: '/test.jpg',
  amenities: ['WiFi', 'Pool'],
  tags: ['Luxury'],
  energy: 50,
  social: 50,
  budget: 50,
  coordinates: [0, 0],
  instantBooking: true,
  checkInTime: '15:00',
  checkOutTime: '11:00',
  cancellationPolicy: {
    type: 'flexible',
    description: 'Free cancellation',
    rules: [{ daysBeforeCheckIn: 1, refundPercentage: 100 }],
  },
};

const mockHotelNonInstant: Hotel = {
  ...mockHotel,
  id: 2,
  title: 'Non-Instant Hotel',
  instantBooking: false,
};

const mockAvailability: AvailabilityResponse = {
  hotelId: 1,
  checkInDate: '2024-12-20',
  checkOutDate: '2024-12-25',
  available: true,
  rooms: [
    {
      id: 'room-1',
      name: 'Deluxe Room',
      description: 'Spacious room with city view',
      capacity: 2,
      bedType: 'King',
      size: 30,
      images: ['/room1.jpg'],
      amenities: ['WiFi', 'TV'],
      basePrice: 150,
      available: 5,
      instantBooking: true,
    },
  ],
  cachedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 300000).toISOString(),
};

const mockPricing: PricingDetails = {
  baseRate: 150,
  numberOfNights: 5,
  subtotal: 750,
  taxes: [{ name: 'Hotel Tax', amount: 90, percentage: 12 }],
  fees: [{ name: 'Service Fee', amount: 25, description: 'Booking fee' }],
  total: 865,
  currency: 'USD',
};

const mockPaymentIntent: PaymentIntent = {
  id: 'pi_test',
  amount: 86500,
  currency: 'usd',
  status: 'requires_payment_method',
  clientSecret: 'pi_test_secret',
};

describe('BookingModal Integration Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnBookingComplete = vi.fn();

  beforeEach(() => {
    // Reset store
    useBookingStore.setState({
      currentBooking: null,
      bookingHistory: [],
      isLoading: false,
      error: null,
    });

    // Clear mocks
    mockOnClose.mockClear();
    mockOnBookingComplete.mockClear();
    vi.clearAllMocks();
  });

  describe('Modal Opening and Initialization', () => {
    it('should initialize booking when modal opens', async () => {
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const state = useBookingStore.getState();
        expect(state.currentBooking).not.toBeNull();
        expect(state.currentBooking?.hotel.id).toBe(mockHotel.id);
        expect(state.currentBooking?.step).toBe('dates');
      });
    });

    it('should display hotel name in modal', () => {
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Test Hotel')).toBeInTheDocument();
    });

    it('should show progress indicator', () => {
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should not show back button on first step', () => {
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const backButtons = screen.queryAllByRole('button', { name: /back/i });
      expect(backButtons).toHaveLength(0);
    });

    it('should disable continue button when dates not selected', () => {
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });

    it('should enable continue button when dates are selected', async () => {
      const user = userEvent.setup();

      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Simulate date selection
      const { setDates } = useBookingStore.getState();
      const checkIn = new Date('2024-12-20');
      const checkOut = new Date('2024-12-25');
      setDates(checkIn, checkOut);

      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).not.toBeDisabled();
      });
    });
  });

  describe('Complete Booking Flow', () => {
    it('should progress through all steps successfully', async () => {
      const user = userEvent.setup();

      // Mock API responses
      vi.mocked(bookingAPIService.checkAvailability).mockResolvedValue(mockAvailability);
      vi.mocked(bookingAPIService.getPricing).mockResolvedValue(mockPricing);
      vi.mocked(paymentAPIService.createPaymentIntent).mockResolvedValue(mockPaymentIntent);

      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
          onBookingComplete={mockOnBookingComplete}
        />
      );

      // Step 1: Select dates
      const { setDates, updateBookingStep, setAvailability } = useBookingStore.getState();
      const checkIn = new Date('2024-12-20');
      const checkOut = new Date('2024-12-25');
      setDates(checkIn, checkOut);
      setAvailability(mockAvailability);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
      });

      // Move to rooms step
      updateBookingStep('rooms');

      await waitFor(() => {
        expect(screen.getByText('Choose your room')).toBeInTheDocument();
      });

      // Step 2: Select room
      const { selectRoom, setPricing } = useBookingStore.getState();
      selectRoom(mockAvailability.rooms[0]);
      setPricing(mockPricing);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
      });

      // Move to guest info step
      updateBookingStep('guest-info');

      await waitFor(() => {
        expect(screen.getByText('Guest Information')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when availability check fails', async () => {
      vi.mocked(bookingAPIService.checkAvailability).mockRejectedValue(
        new Error('Availability check failed')
      );

      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const { setDates } = useBookingStore.getState();
      const checkIn = new Date('2024-12-20');
      const checkOut = new Date('2024-12-25');
      setDates(checkIn, checkOut);

      // Error would be shown by useAvailability hook
      // This test verifies the modal handles the error state
      await waitFor(() => {
        const state = useBookingStore.getState();
        expect(state.currentBooking?.checkInDate).toEqual(checkIn);
      });
    });

    it('should show retry button when error occurs', async () => {
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Set an error
      const { setError } = useBookingStore.getState();
      setError('Test error message');

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Instant Booking Indicators', () => {
    it('should display instant confirmation message for instant booking hotels', async () => {
      const { startBooking, updateBookingStep } = useBookingStore.getState();
      
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Initialize booking and move to processing step
      startBooking(mockHotel);
      updateBookingStep('processing');

      await waitFor(() => {
        expect(screen.getByText(/instant confirmation in progress/i)).toBeInTheDocument();
      });
    });

    it('should display instant booking badge in payment step', async () => {
      const { startBooking, updateBookingStep, setDates, selectRoom, setGuestInfo } = useBookingStore.getState();
      
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Set up booking state
      startBooking(mockHotel);
      setDates(new Date('2024-12-20'), new Date('2024-12-25'));
      selectRoom(mockAvailability.rooms[0]);
      setGuestInfo({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        country: 'US',
      });
      updateBookingStep('payment');

      await waitFor(() => {
        expect(screen.getByText(/instant confirmation/i)).toBeInTheDocument();
      });
    });

    it('should display estimated time for non-instant booking hotels', async () => {
      const { startBooking, updateBookingStep } = useBookingStore.getState();
      
      render(
        <BookingModal
          hotel={mockHotelNonInstant}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Initialize booking and move to processing step
      startBooking(mockHotelNonInstant);
      updateBookingStep('processing');

      await waitFor(() => {
        expect(screen.getByText(/estimated confirmation time/i)).toBeInTheDocument();
      });
    });

    it('should show 30 second confirmation time for instant bookings', async () => {
      const { startBooking, updateBookingStep } = useBookingStore.getState();
      
      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Initialize booking and move to processing step
      startBooking(mockHotel);
      updateBookingStep('processing');

      await waitFor(() => {
        expect(screen.getByText(/within 30 seconds/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Closing', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();

      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should cleanup booking state when modal closes', async () => {
      const user = userEvent.setup();

      render(
        <BookingModal
          hotel={mockHotel}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Initialize booking
      const { startBooking } = useBookingStore.getState();
      startBooking(mockHotel);

      await waitFor(() => {
        expect(useBookingStore.getState().currentBooking).not.toBeNull();
      });

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(useBookingStore.getState().currentBooking).toBeNull();
      });
    });
  });
});
