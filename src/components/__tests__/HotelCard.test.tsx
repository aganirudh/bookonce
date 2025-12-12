/**
 * HotelCard Component Tests
 * Tests for "Book Now" button click and instant booking badge display
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HotelCard from '../HotelCard';
import { Hotel } from '@/types/booking';

describe('HotelCard Component - Booking Integration', () => {
  const mockOnBookingClick = vi.fn();

  const baseHotel: Hotel = {
    id: 1,
    title: 'Test Hotel',
    location: 'Test Location',
    price: 200,
    rating: 4.5,
    reviews: 100,
    image: 'https://example.com/image.jpg',
    amenities: ['Wifi', 'Pool'],
    tags: ['luxury', 'romantic'],
    energy: 5,
    social: 5,
    budget: 5,
    coordinates: [0, 0],
  };

  describe('Book Now Button', () => {
    it('should render "Book Now" button', () => {
      render(
        <HotelCard
          hotel={baseHotel}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      const bookButton = screen.getByRole('button', { name: /book now/i });
      expect(bookButton).toBeInTheDocument();
    });

    it('should call onBookingClick with hotel id when "Book Now" button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <HotelCard
          hotel={baseHotel}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      const bookButton = screen.getByRole('button', { name: /book now/i });
      await user.click(bookButton);

      expect(mockOnBookingClick).toHaveBeenCalledWith(baseHotel.id);
      expect(mockOnBookingClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when onBookingClick is not provided', async () => {
      const user = userEvent.setup();
      
      render(
        <HotelCard
          hotel={baseHotel}
          index={0}
        />
      );

      const bookButton = screen.getByRole('button', { name: /book now/i });
      
      // Should not throw error
      await expect(user.click(bookButton)).resolves.not.toThrow();
    });
  });

  describe('Instant Booking Badge', () => {
    it('should display instant booking badge when instantBooking is true', () => {
      const hotelWithInstantBooking: Hotel = {
        ...baseHotel,
        instantBooking: true,
      };

      render(
        <HotelCard
          hotel={hotelWithInstantBooking}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      expect(screen.getByText('Instant Booking')).toBeInTheDocument();
    });

    it('should not display instant booking badge when instantBooking is false', () => {
      const hotelWithoutInstantBooking: Hotel = {
        ...baseHotel,
        instantBooking: false,
      };

      render(
        <HotelCard
          hotel={hotelWithoutInstantBooking}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      expect(screen.queryByText('Instant Booking')).not.toBeInTheDocument();
    });

    it('should not display instant booking badge when instantBooking is undefined', () => {
      render(
        <HotelCard
          hotel={baseHotel}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      expect(screen.queryByText('Instant Booking')).not.toBeInTheDocument();
    });

    it('should display instant booking badge with lightning icon', () => {
      const hotelWithInstantBooking: Hotel = {
        ...baseHotel,
        instantBooking: true,
      };

      const { container } = render(
        <HotelCard
          hotel={hotelWithInstantBooking}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      // Check for the Zap (lightning) icon
      const zapIcon = container.querySelector('svg.lucide-zap');
      expect(zapIcon).toBeInTheDocument();
    });
  });

  describe('Existing Functionality', () => {
    it('should render hotel title', () => {
      render(
        <HotelCard
          hotel={baseHotel}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      expect(screen.getByText('Test Hotel')).toBeInTheDocument();
    });

    it('should render hotel location', () => {
      render(
        <HotelCard
          hotel={baseHotel}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });

    it('should render hotel price', () => {
      render(
        <HotelCard
          hotel={baseHotel}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      expect(screen.getByText('$200')).toBeInTheDocument();
      expect(screen.getByText('/night')).toBeInTheDocument();
    });

    it('should render hotel rating', () => {
      render(
        <HotelCard
          hotel={baseHotel}
          index={0}
          onBookingClick={mockOnBookingClick}
        />
      );

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('(100)')).toBeInTheDocument();
    });
  });
});
