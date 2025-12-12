/**
 * BookingHistory Page Tests
 * Tests for filtering, sorting, and search functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import BookingHistory from '../BookingHistory';
import { bookingAPIService } from '@/features/booking/services/BookingAPIService';
import type { BookingConfirmation } from '@/types/booking';

// Mock the services
vi.mock('@/features/booking/services/BookingAPIService');

// Mock booking data
const mockBookings: BookingConfirmation[] = [
  {
    bookingId: 'BK001',
    referenceNumber: 'VGN-2024-001',
    hotel: {
      id: 1,
      title: 'The Serene Lakehouse',
      location: 'Lake Como, Italy',
      price: 420,
      rating: 4.9,
      reviews: 234,
      image: '/placeholder.svg',
      amenities: ['WiFi', 'Lake View', 'Spa'],
      tags: ['Peaceful', 'Romantic', 'Luxury'],
      energy: 30,
      social: 20,
      budget: 80,
      coordinates: [45.8, 9.2],
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
    checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    checkOutDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    guestInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      country: 'United States',
    },
    roomDetails: {
      id: 'room-1',
      name: 'Deluxe Lake View Suite',
      description: 'Spacious suite with panoramic lake views',
      capacity: 2,
      bedType: 'King',
      size: 45,
      images: ['/placeholder.svg'],
      amenities: ['Lake View', 'Balcony', 'Mini Bar'],
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
    confirmationSentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    bookingId: 'BK002',
    referenceNumber: 'VGN-2024-002',
    hotel: {
      id: 2,
      title: 'Urban Loft Downtown',
      location: 'New York, USA',
      price: 280,
      rating: 4.7,
      reviews: 456,
      image: '/placeholder.svg',
      amenities: ['WiFi', 'Gym', 'Rooftop Bar'],
      tags: ['Modern', 'Central', 'Vibrant'],
      energy: 85,
      social: 90,
      budget: 60,
      coordinates: [40.7, -74.0],
      instantBooking: true,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      providerId: 'mock-provider',
      providerHotelId: '2',
      cancellationPolicy: {
        type: 'moderate',
        description: 'Free cancellation up to 5 days before check-in',
        rules: [
          { daysBeforeCheckIn: 5, refundPercentage: 100 },
          { daysBeforeCheckIn: 2, refundPercentage: 50 },
          { daysBeforeCheckIn: 0, refundPercentage: 0 },
        ],
      },
    },
    checkInDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    checkOutDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    guestInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      country: 'United States',
    },
    roomDetails: {
      id: 'room-2',
      name: 'Studio Loft',
      description: 'Modern studio with city views',
      capacity: 2,
      bedType: 'Queen',
      size: 35,
      images: ['/placeholder.svg'],
      amenities: ['City View', 'Kitchenette', 'Smart TV'],
      basePrice: 280,
      available: 5,
      instantBooking: true,
    },
    pricing: {
      baseRate: 280,
      numberOfNights: 3,
      subtotal: 840,
      taxes: [{ name: 'Hotel Tax', amount: 100.8, percentage: 12 }],
      fees: [{ name: 'Service Fee', amount: 25, description: 'Booking service fee' }],
      total: 965.8,
      currency: 'USD',
    },
    status: 'confirmed',
    confirmationSentAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    bookingId: 'BK003',
    referenceNumber: 'VGN-2024-003',
    hotel: {
      id: 3,
      title: 'Mountain Retreat Lodge',
      location: 'Aspen, Colorado',
      price: 350,
      rating: 4.8,
      reviews: 189,
      image: '/placeholder.svg',
      amenities: ['WiFi', 'Fireplace', 'Ski Storage'],
      tags: ['Cozy', 'Adventure', 'Nature'],
      energy: 60,
      social: 40,
      budget: 70,
      coordinates: [39.2, -106.8],
      instantBooking: false,
      checkInTime: '16:00',
      checkOutTime: '10:00',
      providerId: 'mock-provider',
      providerHotelId: '3',
      cancellationPolicy: {
        type: 'strict',
        description: 'Free cancellation up to 14 days before check-in',
        rules: [
          { daysBeforeCheckIn: 14, refundPercentage: 100 },
          { daysBeforeCheckIn: 7, refundPercentage: 50 },
          { daysBeforeCheckIn: 0, refundPercentage: 0 },
        ],
      },
    },
    checkInDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    checkOutDate: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000).toISOString(),
    guestInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      country: 'United States',
    },
    roomDetails: {
      id: 'room-3',
      name: 'Mountain View Cabin',
      description: 'Rustic cabin with mountain views',
      capacity: 4,
      bedType: '2 Queens',
      size: 55,
      images: ['/placeholder.svg'],
      amenities: ['Mountain View', 'Fireplace', 'Kitchenette'],
      basePrice: 350,
      available: 2,
      instantBooking: false,
    },
    pricing: {
      baseRate: 350,
      numberOfNights: 7,
      subtotal: 2450,
      taxes: [{ name: 'Hotel Tax', amount: 294, percentage: 12 }],
      fees: [{ name: 'Service Fee', amount: 25, description: 'Booking service fee' }],
      total: 2769,
      currency: 'USD',
    },
    status: 'cancelled',
    confirmationSentAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to render with providers
function renderWithProviders() {
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
        <BookingHistory />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('BookingHistory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner while fetching bookings', () => {
      vi.mocked(bookingAPIService.getUserBookings).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders();

      expect(screen.getByText('Loading bookings...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      vi.mocked(bookingAPIService.getUserBookings).mockRejectedValue(
        new Error('Failed to fetch bookings')
      );

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Failed to load bookings. Please try again.')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should retry fetching when retry button clicked', async () => {
      const user = userEvent.setup();
      const getUserBookingsSpy = vi.mocked(bookingAPIService.getUserBookings);
      
      getUserBookingsSpy.mockRejectedValueOnce(new Error('Failed to fetch'));
      getUserBookingsSpy.mockResolvedValueOnce(mockBookings);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Failed to load bookings. Please try again.')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no bookings exist', async () => {
      vi.mocked(bookingAPIService.getUserBookings).mockResolvedValue([]);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('No bookings yet')).toBeInTheDocument();
      });
    });
  });

  describe('Booking List Display', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getUserBookings).mockResolvedValue(mockBookings);
    });

    it('should display all bookings', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      expect(screen.getByText('Urban Loft Downtown')).toBeInTheDocument();
      expect(screen.getByText('Mountain Retreat Lodge')).toBeInTheDocument();
    });

    it('should display booking details on each card', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      expect(screen.getByText('Lake Como, Italy')).toBeInTheDocument();
      expect(screen.getByText('VGN-2024-001')).toBeInTheDocument();
      expect(screen.getByText('$2377.00')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getUserBookings).mockResolvedValue(mockBookings);
    });

    it('should show all bookings by default', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      expect(screen.getByText('Urban Loft Downtown')).toBeInTheDocument();
      expect(screen.getByText('Mountain Retreat Lodge')).toBeInTheDocument();
    });

    it('should filter upcoming bookings', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const upcomingTab = screen.getByRole('tab', { name: /upcoming/i });
      await user.click(upcomingTab);

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      expect(screen.queryByText('Urban Loft Downtown')).not.toBeInTheDocument();
      expect(screen.queryByText('Mountain Retreat Lodge')).not.toBeInTheDocument();
    });

    it('should filter past bookings', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const pastTab = screen.getByRole('tab', { name: /past/i });
      await user.click(pastTab);

      await waitFor(() => {
        expect(screen.getByText('Urban Loft Downtown')).toBeInTheDocument();
      });

      expect(screen.queryByText('The Serene Lakehouse')).not.toBeInTheDocument();
      expect(screen.queryByText('Mountain Retreat Lodge')).not.toBeInTheDocument();
    });

    it('should filter cancelled bookings', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const cancelledTab = screen.getByRole('tab', { name: /cancelled/i });
      await user.click(cancelledTab);

      await waitFor(() => {
        expect(screen.getByText('Mountain Retreat Lodge')).toBeInTheDocument();
      });

      expect(screen.queryByText('The Serene Lakehouse')).not.toBeInTheDocument();
      expect(screen.queryByText('Urban Loft Downtown')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getUserBookings).mockResolvedValue(mockBookings);
    });

    it('should filter bookings by hotel name', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by hotel/i);
      await user.type(searchInput, 'Lakehouse');

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      expect(screen.queryByText('Urban Loft Downtown')).not.toBeInTheDocument();
      expect(screen.queryByText('Mountain Retreat Lodge')).not.toBeInTheDocument();
    });

    it('should filter bookings by location', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by hotel/i);
      await user.type(searchInput, 'New York');

      await waitFor(() => {
        expect(screen.getByText('Urban Loft Downtown')).toBeInTheDocument();
      });

      expect(screen.queryByText('The Serene Lakehouse')).not.toBeInTheDocument();
      expect(screen.queryByText('Mountain Retreat Lodge')).not.toBeInTheDocument();
    });

    it('should filter bookings by reference number', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by hotel/i);
      await user.type(searchInput, 'VGN-2024-002');

      await waitFor(() => {
        expect(screen.getByText('Urban Loft Downtown')).toBeInTheDocument();
      });

      expect(screen.queryByText('The Serene Lakehouse')).not.toBeInTheDocument();
      expect(screen.queryByText('Mountain Retreat Lodge')).not.toBeInTheDocument();
    });

    it('should show empty state when search has no results', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by hotel/i);
      await user.type(searchInput, 'NonexistentHotel');

      await waitFor(() => {
        expect(screen.getByText('No bookings match your search')).toBeInTheDocument();
      });
    });

    it('should clear search when clear button clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by hotel/i);
      await user.type(searchInput, 'NonexistentHotel');

      await waitFor(() => {
        expect(screen.getByText('No bookings match your search')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getUserBookings).mockResolvedValue(mockBookings);
    });

    it('should sort by date descending by default', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const bookingCards = screen.getAllByRole('img');
      expect(bookingCards[0]).toHaveAttribute('alt', 'The Serene Lakehouse');
    });

    it('should sort by price high to low', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const sortSelect = screen.getByRole('combobox');
      await user.click(sortSelect);

      const priceHighOption = screen.getByRole('option', { name: /price \(high to low\)/i });
      await user.click(priceHighOption);

      await waitFor(() => {
        const prices = screen.getAllByText(/\$\d+\.\d+/);
        expect(prices[0]).toHaveTextContent('$2769.00');
      });
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      vi.mocked(bookingAPIService.getUserBookings).mockResolvedValue(mockBookings);
    });

    it('should display refresh button', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      const refreshButtons = screen.getAllByRole('button', { name: /refresh/i });
      expect(refreshButtons.length).toBeGreaterThan(0);
    });

    it('should refetch bookings when refresh clicked', async () => {
      const user = userEvent.setup();
      const getUserBookingsSpy = vi.mocked(bookingAPIService.getUserBookings);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('The Serene Lakehouse')).toBeInTheDocument();
      });

      expect(getUserBookingsSpy).toHaveBeenCalledTimes(1);

      const refreshButton = screen.getAllByRole('button', { name: /refresh/i })[0];
      await user.click(refreshButton);

      await waitFor(() => {
        expect(getUserBookingsSpy).toHaveBeenCalledTimes(2);
      });
    });
  });
});
