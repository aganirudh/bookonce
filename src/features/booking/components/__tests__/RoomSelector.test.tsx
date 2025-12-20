/**
 * RoomSelector Component Tests
 * Tests for room selection and quantity updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomSelector } from '../RoomSelector';
import type { RoomOption } from '@/types/booking';

// Mock room data
const mockRooms: RoomOption[] = [
  {
    id: 'room-1',
    name: 'Deluxe Room',
    description: 'A comfortable room with city view',
    capacity: 2,
    bedType: 'King',
    size: 30,
    images: ['/room1-1.jpg', '/room1-2.jpg'],
    amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning'],
    basePrice: 150,
    available: 5,
    instantBooking: true,
  },
  {
    id: 'room-2',
    name: 'Suite',
    description: 'Spacious suite with ocean view',
    capacity: 4,
    bedType: 'King + Sofa Bed',
    size: 50,
    images: ['/room2-1.jpg'],
    amenities: ['WiFi', 'TV', 'Balcony'],
    basePrice: 250,
    available: 2,
    instantBooking: false,
  },
  {
    id: 'room-3',
    name: 'Standard Room',
    description: 'Cozy standard room',
    capacity: 2,
    bedType: 'Queen',
    size: 25,
    images: [],
    amenities: ['WiFi'],
    basePrice: 100,
    available: 0,
    instantBooking: true,
  },
];

describe('RoomSelector Component', () => {
  const mockOnRoomSelect = vi.fn();

  beforeEach(() => {
    mockOnRoomSelect.mockClear();
  });

  describe('Initial Rendering', () => {
    it('should render all available rooms', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      expect(screen.getByText('Deluxe Room')).toBeInTheDocument();
      expect(screen.getByText('Suite')).toBeInTheDocument();
      expect(screen.getByText('Standard Room')).toBeInTheDocument();
    });

    it('should display "No rooms available" message when rooms array is empty', () => {
      render(<RoomSelector rooms={[]} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />);

      expect(screen.getByText('No rooms available for selected dates')).toBeInTheDocument();
    });

    it('should display room descriptions', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      expect(screen.getByText('A comfortable room with city view')).toBeInTheDocument();
      expect(screen.getByText('Spacious suite with ocean view')).toBeInTheDocument();
    });
  });

  describe('Room Details Display', () => {
    it('should display room capacity', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      const capacityTexts = screen.getAllByText(/Up to \d+ guests?/);
      expect(capacityTexts.length).toBeGreaterThan(0);
    });

    it('should display bed type', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      expect(screen.getByText('King')).toBeInTheDocument();
      expect(screen.getByText('King + Sofa Bed')).toBeInTheDocument();
      expect(screen.getByText('Queen')).toBeInTheDocument();
    });

    it('should display room size', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      expect(screen.getByText('30 m²')).toBeInTheDocument();
      expect(screen.getByText('50 m²')).toBeInTheDocument();
      expect(screen.getByText('25 m²')).toBeInTheDocument();
    });

    it('should display formatted prices', () => {
      render(
        <RoomSelector
          rooms={mockRooms}
          selectedRoomId={null}
          onRoomSelect={mockOnRoomSelect}
          currency="USD"
        />
      );

      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('$250.00')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });
  });

  describe('Availability Display', () => {
    it('should show availability count for available rooms', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      expect(screen.getByText('5 rooms available')).toBeInTheDocument();
      expect(screen.getByText('2 rooms available')).toBeInTheDocument();
    });

    it('should show "Sold out" badge for unavailable rooms', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      expect(screen.getByText('Sold out')).toBeInTheDocument();
    });

    it('should handle singular room availability correctly', () => {
      const singleRoom: RoomOption[] = [{ ...mockRooms[0], available: 1 }];

      render(
        <RoomSelector rooms={singleRoom} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      expect(screen.getByText('1 room available')).toBeInTheDocument();
    });
  });

  describe('Instant Booking Badge', () => {
    it('should display instant booking badge for instant booking rooms', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      const instantBadges = screen.getAllByText('Instant');
      expect(instantBadges).toHaveLength(2); // Deluxe Room and Standard Room
    });

    it('should not display instant booking badge for non-instant rooms', () => {
      const nonInstantRooms = mockRooms.filter(room => !room.instantBooking);

      render(
        <RoomSelector
          rooms={nonInstantRooms}
          selectedRoomId={null}
          onRoomSelect={mockOnRoomSelect}
        />
      );

      expect(screen.queryByText('Instant')).not.toBeInTheDocument();
    });
  });

  describe('Amenities Display', () => {
    it('should display first 3 amenities by default', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      // Deluxe Room has 4 amenities, should show first 3 + "+1 more"
      const wifiAmenities = screen.getAllByText('WiFi');
      expect(wifiAmenities.length).toBeGreaterThan(0);
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('should expand amenities when room card is clicked', async () => {
      const user = userEvent.setup();

      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      // Find the Deluxe Room card by its parent container
      const deluxeTitle = screen.getByText('Deluxe Room');
      const deluxeCard = deluxeTitle.closest('[class*="shadow"]');
      expect(deluxeCard).toBeInTheDocument();

      if (deluxeCard) {
        await user.click(deluxeCard);

        // All amenities should now be visible
        const airConditioning = await screen.findByText('Air Conditioning');
        expect(airConditioning).toBeInTheDocument();
      }
    });
  });

  describe('Room Selection', () => {
    it('should call onRoomSelect when Select Room button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <RoomSelector
          rooms={[mockRooms[0]]} // Only render one room to avoid ambiguity
          selectedRoomId={null}
          onRoomSelect={mockOnRoomSelect}
        />
      );

      const selectButton = screen.getByRole('button', { name: /select room/i });
      await user.click(selectButton);

      expect(mockOnRoomSelect).toHaveBeenCalledWith(mockRooms[0]);
    });

    it('should display "Selected" badge for selected room', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId="room-1" onRoomSelect={mockOnRoomSelect} />
      );

      const selectedBadges = screen.getAllByText('Selected');
      expect(selectedBadges.length).toBeGreaterThan(0);
    });

    it('should highlight selected room with ring styling', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId="room-1" onRoomSelect={mockOnRoomSelect} />
      );

      const deluxeCard = screen.getByText('Deluxe Room').closest('div[class*="rounded"]');
      expect(deluxeCard).toHaveClass('ring-2', 'ring-primary');
    });

    it('should change button text to "Selected" for selected room', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId="room-1" onRoomSelect={mockOnRoomSelect} />
      );

      const selectedButton = screen.getByRole('button', { name: /^selected$/i });
      expect(selectedButton).toBeInTheDocument();
    });

    it('should disable select button for sold out rooms', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      const soldOutButton = screen.getByRole('button', { name: /sold out/i });
      expect(soldOutButton).toBeDisabled();
    });

    it('should not call onRoomSelect when sold out room button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <RoomSelector
          rooms={[mockRooms[2]]} // Only render the sold out room
          selectedRoomId={null}
          onRoomSelect={mockOnRoomSelect}
        />
      );

      const soldOutButton = screen.getByRole('button', { name: /sold out/i });
      await user.click(soldOutButton);

      expect(mockOnRoomSelect).not.toHaveBeenCalled();
    });
  });

  describe('Image Display', () => {
    it('should display images when room is expanded', async () => {
      const user = userEvent.setup();

      render(
        <RoomSelector
          rooms={[mockRooms[0]]} // Only Deluxe Room with images
          selectedRoomId={null}
          onRoomSelect={mockOnRoomSelect}
        />
      );

      // Click to expand Deluxe Room
      const deluxeTitle = screen.getByText('Deluxe Room');
      const deluxeCard = deluxeTitle.closest('[class*="shadow"]');
      if (deluxeCard) {
        await user.click(deluxeCard);

        // Images should be visible
        const images = await screen.findAllByAltText(/Deluxe Room/);
        expect(images.length).toBeGreaterThan(0);
      }
    });

    it('should not display images for rooms without images', async () => {
      const user = userEvent.setup();

      render(
        <RoomSelector
          rooms={[mockRooms[2]]} // Standard Room with no images
          selectedRoomId={null}
          onRoomSelect={mockOnRoomSelect}
        />
      );

      // Click to expand Standard Room (has no images)
      const standardTitle = screen.getByText('Standard Room');
      const standardCard = standardTitle.closest('[class*="shadow"]');
      if (standardCard) {
        await user.click(standardCard);

        // Should not find any images for Standard Room
        const images = screen.queryAllByAltText(/Standard Room/);
        expect(images).toHaveLength(0);
      }
    });
  });

  describe('Currency Formatting', () => {
    it('should format prices in USD by default', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      expect(screen.getByText('$150.00')).toBeInTheDocument();
    });

    it('should format prices in specified currency', () => {
      render(
        <RoomSelector
          rooms={mockRooms}
          selectedRoomId={null}
          onRoomSelect={mockOnRoomSelect}
          currency="EUR"
        />
      );

      // EUR formatting
      expect(screen.getByText('€150.00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible room cards', () => {
      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      const cards = screen.getAllByRole('button', { name: /select room|selected|sold out/i });
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <RoomSelector rooms={mockRooms} selectedRoomId={null} onRoomSelect={mockOnRoomSelect} />
      );

      // Tab through buttons
      await user.tab();
      const firstButton = screen.getAllByRole('button')[0];
      expect(firstButton).toHaveFocus();
    });
  });

  describe('Interaction Behavior', () => {
    it('should stop propagation when select button is clicked', async () => {
      const user = userEvent.setup();
      const cardClickHandler = vi.fn();

      render(
        <div onClick={cardClickHandler}>
          <RoomSelector
            rooms={[mockRooms[0]]} // Only one room to avoid ambiguity
            selectedRoomId={null}
            onRoomSelect={mockOnRoomSelect}
          />
        </div>
      );

      const selectButton = screen.getByRole('button', { name: /select room/i });
      await user.click(selectButton);

      // onRoomSelect should be called
      expect(mockOnRoomSelect).toHaveBeenCalled();

      // Parent click handler should not be called due to stopPropagation
      expect(cardClickHandler).not.toHaveBeenCalled();
    });
  });
});
