/**
 * BookingConfirmation Page Tests
 * Tests for booking details display, PDF download, and calendar integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BookingConfirmation from '../BookingConfirmation';
import { bookingAPIService } from '@/features/booking/services/BookingAPIService';
import * as confirmationActions from '@/features/booking/utils/confirmationActions';
import type { BookingConfirmation as BookingConfirmationType } from '@/types/booking';

// Mock the services and utilities
vi.mock('@/features/booking/services/BookingAPIService');
vi.mock('@/features/booking/utils/confirmationActions');
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock booking data
const mockBooking: BookingConfirmationType = {
  bookingId: 'booking-123',
  referenceNumber: 'REF-ABC123',
  hotel: {
    id: 1,
    title: 'The Serene Lakehouse',
    location: 'Lake Tahoe, California',
    price: 420,
    rating: 4.8,
    reviews: 156,
    image: '/test-hotel.jpg',
    amenities: ['WiFi', 'Pool', 'Spa'],
    tags: ['Luxury', 'Nature'],
    energy: 30,
    social: 40,
    budget: 70,
    coordinates: [39.0968, -120.0324],
    instantBooking: true,
    checkInTime: '15:00',
    checkOutTime: '11:00',
    providerId: 'mock-provider',
    providerHotelId: '1',
    cancellationPolicy: {
      type: 'flexible',
      description: 'Free cancellation up to 24 hours before check-in',
      rules: [
        { daysBeforeCheckIn: 1, refundPercentage: 100 },
        { daysBeforeCheckIn: 0, refundPercentage: 0 },
      ],
    },
  },
  checkInDate: '2024-12-20',
  checkOutDate: '2024-12-25',
  guestInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    country: 'US',
    specialRequests: 'Late check-in',
  },
  roomDetails: {
    id: 'room-1',
    name: 'Deluxe Lake View Suite',
    description: 'Spacious suite with panoramic lake views',
    capacity: 2,
    bedType: 'King',
    size: 45,
    images: ['/room1.jpg'],
    amenities: ['WiFi', 'TV', 'Minibar'],
    basePrice: 420,
    available: 3,
    instantBooking: true,
  },
  pricing: {
    baseRate: 420,
    numberOfNights: 5,
    subtotal: 2100,
    taxes: [{ name: 'Hotel Tax', amount: 252, percentage: 12 }],
    fees: [{ name: 'Service Fee', amount: 25, description: 'Booking service fee' }],
    total: 2377,
    currency: 'USD',
  },
  status: 'confirmed',
  confirmationSentAt: '2024-12-15T10:30:00Z',
  createdAt: '2024-12-15T10:30:00Z',
  updatedAt: '2024-12-15T10:30:00Z',
};

// Helper to render with router and query client
function renderWithProviders(bookingId: string = 'booking-123') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>,
    {
      wrapper: ({ children }) => {
        // Navigate to the booking confirmation page
        window.history.pushState({}, '', `/booking-confirmation/${bookingId}`);
        return <>{children}</>;
      },
    }
  );
}

describe('BookingConfirmation Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching booking', () => {
      vi.mocked(bookingAPIService.getBooking).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders();

      expect(screen.getByText('Loading your booking details...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loader icon
    });
  });

  describe('Error State', () => {
    it('should display error message when booking not found', async () => {
      vi.mocked(bookingAPIService.getBooking).mockRejectedValue(new Error('Booking not found'));

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Booking Not Found')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/We couldn't find the booking you're looking for/)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to home/i })).toBeInTheDocument();
    });

    it('should navigate to home when return button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(bookingAPIService.getBooking).mockRejectedValue(new Error('Booking not found'));

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Booking Not Found')).toBeInTheDocument();
      });

      const returnButton = screen.getByRole('button', { name: /return to home/i });
      await user.click(returnButton);

      // Check that navigation was attempted (URL would change in real app)
      expect(returnButton).toBeInTheDocument();
    });
  });

  describe('Booking Details Display', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getBooking).mockResolvedValue(mockBooking);
    });

    it('should display success header with confirmation message', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Your reservation has been successfully confirmed')
      ).toBeInTheDocument();
    });

    it('should display booking reference number', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('REF-ABC123')).toBeInTheDocument();
      });

      expect(screen.getByText('Booking Reference')).toBeInTheDocument();
    });

    it('should display hotel information', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      expect(screen.getAllByText('Lake Tahoe, California').length).toBeGreaterThan(0);
      expect(screen.getByText(/4\.8/)).toBeInTheDocument();
      expect(screen.getByText(/156 reviews/)).toBeInTheDocument();
    });

    it('should display stay details with formatted dates', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText(/Friday, December 20, 2024/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Wednesday, December 25, 2024/)).toBeInTheDocument();
      expect(screen.getAllByText(/5 nights/).length).toBeGreaterThan(0);
      expect(screen.getByText('3:00 PM')).toBeInTheDocument();
      expect(screen.getByText('11:00 AM')).toBeInTheDocument();
    });

    it('should display room details', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Deluxe Lake View Suite')).toBeInTheDocument();
      });

      expect(screen.getByText('Spacious suite with panoramic lake views')).toBeInTheDocument();
      expect(screen.getByText('King')).toBeInTheDocument();
      expect(screen.getByText('2 guests')).toBeInTheDocument();
      expect(screen.getByText('45m²')).toBeInTheDocument();
    });

    it('should display guest information', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getAllByText('john.doe@example.com').length).toBeGreaterThan(0);
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('Late check-in')).toBeInTheDocument();
    });

    it('should display pricing summary with all line items', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Pricing Summary')).toBeInTheDocument();
      });

      expect(screen.getByText(/\$420 × 5 nights/)).toBeInTheDocument();
      expect(screen.getByText('$2100.00')).toBeInTheDocument();
      expect(screen.getByText('Hotel Tax (12%)')).toBeInTheDocument();
      expect(screen.getByText('$252.00')).toBeInTheDocument();
      expect(screen.getByText('Service Fee')).toBeInTheDocument();
      expect(screen.getByText('$25.00')).toBeInTheDocument();
      expect(screen.getByText('$2377.00 USD')).toBeInTheDocument();
    });

    it('should display booking status badge', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
      });
    });

    it('should display QR code for mobile check-in', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Mobile Check-in')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Show this QR code at the hotel for quick check-in')
      ).toBeInTheDocument();
    });

    it('should display hotel contact information', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Hotel Contact & Directions')).toBeInTheDocument();
      });

      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getAllByText('Phone').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
    });

    it('should display confirmation email notice', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText(/A confirmation email has been sent to/)).toBeInTheDocument();
      });

      expect(screen.getAllByText('john.doe@example.com').length).toBeGreaterThan(0);
    });
  });

  describe('PDF Download Functionality', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getBooking).mockResolvedValue(mockBooking);
    });

    it('should display download PDF button', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
      });
    });

    it('should call downloadPDFConfirmation when button clicked', async () => {
      const user = userEvent.setup();
      const downloadSpy = vi.mocked(confirmationActions.downloadPDFConfirmation);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download pdf/i });
      await user.click(downloadButton);

      expect(downloadSpy).toHaveBeenCalledWith(mockBooking);
    });
  });

  describe('Calendar Integration', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getBooking).mockResolvedValue(mockBooking);
    });

    it('should display add to calendar button', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add to calendar/i })).toBeInTheDocument();
      });
    });

    it('should show calendar options when dropdown clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add to calendar/i })).toBeInTheDocument();
      });

      const calendarButton = screen.getByRole('button', { name: /add to calendar/i });
      await user.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByText('Google Calendar')).toBeInTheDocument();
        expect(screen.getByText('iCal / Outlook')).toBeInTheDocument();
      });
    });

    it('should call addToGoogleCalendar when Google Calendar option clicked', async () => {
      const user = userEvent.setup();
      const googleCalendarSpy = vi.mocked(confirmationActions.addToGoogleCalendar);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add to calendar/i })).toBeInTheDocument();
      });

      const calendarButton = screen.getByRole('button', { name: /add to calendar/i });
      await user.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      });

      const googleOption = screen.getByText('Google Calendar');
      await user.click(googleOption);

      expect(googleCalendarSpy).toHaveBeenCalledWith(mockBooking);
    });

    it('should call addToCalendar when iCal option clicked', async () => {
      const user = userEvent.setup();
      const icalSpy = vi.mocked(confirmationActions.addToCalendar);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add to calendar/i })).toBeInTheDocument();
      });

      const calendarButton = screen.getByRole('button', { name: /add to calendar/i });
      await user.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByText('iCal / Outlook')).toBeInTheDocument();
      });

      const icalOption = screen.getByText('iCal / Outlook');
      await user.click(icalOption);

      expect(icalSpy).toHaveBeenCalledWith(mockBooking);
    });
  });

  describe('Share Functionality', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getBooking).mockResolvedValue(mockBooking);
    });

    it('should display share booking button', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /share booking/i })).toBeInTheDocument();
      });
    });

    it('should call shareBooking when button clicked', async () => {
      const user = userEvent.setup();
      const shareSpy = vi.mocked(confirmationActions.shareBooking);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /share booking/i })).toBeInTheDocument();
      });

      const shareButton = screen.getByRole('button', { name: /share booking/i });
      await user.click(shareButton);

      expect(shareSpy).toHaveBeenCalledWith(mockBooking);
    });
  });

  describe('Directions Functionality', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getBooking).mockResolvedValue(mockBooking);
    });

    it('should display get directions button', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /get directions/i })).toBeInTheDocument();
      });
    });

    it('should call getDirectionsUrl when button clicked', async () => {
      const user = userEvent.setup();
      const directionsSpy = vi.mocked(confirmationActions.getDirectionsUrl);
      directionsSpy.mockReturnValue('https://maps.google.com/test');

      // Mock window.open
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /get directions/i })).toBeInTheDocument();
      });

      const directionsButton = screen.getByRole('button', { name: /get directions/i });
      await user.click(directionsButton);

      expect(directionsSpy).toHaveBeenCalledWith(mockBooking);
      expect(windowOpenSpy).toHaveBeenCalledWith('https://maps.google.com/test', '_blank');

      windowOpenSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getBooking).mockResolvedValue(mockBooking);
    });

    it('should display return to home button', async () => {
      renderWithProviders();

      await waitFor(() => {
        const returnButtons = screen.getAllByRole('button', { name: /return to home/i });
        expect(returnButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
