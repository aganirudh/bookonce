/**
 * Mock Booking Provider Adapter
 * Simulates booking provider API for development and testing
 */

import { BaseBookingProviderAdapter } from './BookingProviderAdapter';
import type {
  AvailabilityParams,
  AvailabilityResponse,
  BookingRequest,
  BookingConfirmation,
  CancellationConfirmation,
  Hotel,
  RoomOption,
  PricingDetails,
} from '@/types/booking';

/**
 * Mock adapter that simulates booking provider responses
 */
export class MockBookingAdapter extends BaseBookingProviderAdapter {
  private bookings: Map<string, BookingConfirmation> = new Map();
  private bookingCounter = 1000;

  constructor() {
    super('mock-provider', {
      apiKey: 'mock-api-key',
      baseUrl: 'https://mock-booking-api.example.com',
    });
  }

  /**
   * Mock adapter supports all hotels
   */
  supportsHotel(hotel: Hotel): boolean {
    return true;
  }

  /**
   * Simulate availability check with mock data
   */
  async checkAvailability(params: AvailabilityParams): Promise<AvailabilityResponse> {
    // Simulate network delay
    await this.simulateDelay(500, 1000);

    const { hotelId, checkInDate, checkOutDate } = params;

    // Get hotel details to check instant booking capability
    const hotel = await this.getHotelDetails(hotelId.toString());
    const hasInstantBooking = hotel.instantBooking || false;

    // Generate mock room options with instant booking based on hotel capability
    const rooms: RoomOption[] = [
      {
        id: `room-${hotelId}-1`,
        name: 'Standard Room',
        description: 'Comfortable room with essential amenities',
        capacity: 2,
        bedType: 'Queen',
        size: 25,
        images: ['/placeholder.svg'],
        amenities: ['WiFi', 'TV', 'Air Conditioning'],
        basePrice: 120,
        available: 5,
        instantBooking: hasInstantBooking,
      },
      {
        id: `room-${hotelId}-2`,
        name: 'Deluxe Room',
        description: 'Spacious room with premium amenities',
        capacity: 2,
        bedType: 'King',
        size: 35,
        images: ['/placeholder.svg'],
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony'],
        basePrice: 180,
        available: 3,
        instantBooking: hasInstantBooking,
      },
      {
        id: `room-${hotelId}-3`,
        name: 'Suite',
        description: 'Luxurious suite with separate living area',
        capacity: 4,
        bedType: 'King + Sofa Bed',
        size: 55,
        images: ['/placeholder.svg'],
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Kitchen'],
        basePrice: 280,
        available: 2,
        instantBooking: hasInstantBooking,
      },
    ];

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    return {
      hotelId,
      checkInDate,
      checkOutDate,
      available: true,
      rooms,
      cachedAt: now,
      expiresAt,
    };
  }

  /**
   * Simulate getting hotel details
   */
  async getHotelDetails(hotelId: string): Promise<Hotel> {
    await this.simulateDelay(300, 600);

    // Return mock hotel data
    // In a real implementation, this would fetch from the provider API
    return {
      id: parseInt(hotelId),
      title: 'Mock Hotel',
      location: 'Mock City',
      price: 150,
      rating: 4.5,
      reviews: 100,
      image: '/placeholder.svg',
      amenities: ['WiFi', 'Pool', 'Gym'],
      tags: ['Modern', 'Central'],
      energy: 70,
      social: 60,
      budget: 50,
      coordinates: [0, 0],
      instantBooking: true,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      providerId: this.providerId,
      providerHotelId: hotelId,
      cancellationPolicy: {
        type: 'flexible',
        description: 'Free cancellation up to 24 hours before check-in',
        rules: [
          { daysBeforeCheckIn: 1, refundPercentage: 100 },
          { daysBeforeCheckIn: 0, refundPercentage: 0 },
        ],
      },
    };
  }

  /**
   * Simulate creating a reservation
   */
  async createReservation(request: BookingRequest): Promise<BookingConfirmation> {
    // Get hotel details first to check instant booking capability
    const hotel = await this.getHotelDetails(request.hotelId.toString());

    // Simulate different confirmation times based on instant booking capability
    if (hotel.instantBooking) {
      // Instant booking: confirm within 30 seconds (simulate 1-3 seconds)
      await this.simulateDelay(1000, 3000);
    } else {
      // Non-instant booking: takes longer (simulate 2-5 minutes in demo, we'll use 5-10 seconds)
      await this.simulateDelay(5000, 10000);
    }

    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Mock booking failed - simulated error');
    }

    const bookingId = `BK${this.bookingCounter++}`;
    const referenceNumber = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // Calculate pricing
    const checkIn = new Date(request.checkInDate);
    const checkOut = new Date(request.checkOutDate);
    const numberOfNights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const baseRate = 150; // Mock base rate
    const subtotal = baseRate * numberOfNights;
    const taxAmount = subtotal * 0.12; // 12% tax
    const serviceFee = 25;
    const total = subtotal + taxAmount + serviceFee;

    const pricing: PricingDetails = {
      baseRate,
      numberOfNights,
      subtotal,
      taxes: [{ name: 'Hotel Tax', amount: taxAmount, percentage: 12 }],
      fees: [{ name: 'Service Fee', amount: serviceFee, description: 'Booking service fee' }],
      total,
      currency: 'USD',
    };

    // Create mock room details with instant booking based on hotel capability
    const roomDetails: RoomOption = {
      id: request.roomId,
      name: 'Standard Room',
      description: 'Comfortable room with essential amenities',
      capacity: 2,
      bedType: 'Queen',
      size: 25,
      images: ['/placeholder.svg'],
      amenities: ['WiFi', 'TV', 'Air Conditioning'],
      basePrice: baseRate,
      available: 5,
      instantBooking: hotel.instantBooking || false,
    };

    const now = new Date().toISOString();

    const booking: BookingConfirmation = {
      bookingId,
      referenceNumber,
      hotel,
      checkInDate: request.checkInDate,
      checkOutDate: request.checkOutDate,
      guestInfo: request.guestInfo,
      roomDetails,
      pricing,
      status: 'confirmed',
      confirmationSentAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Store booking
    this.bookings.set(bookingId, booking);

    return booking;
  }

  /**
   * Simulate modifying a reservation
   */
  async modifyReservation(
    bookingId: string,
    changes: Partial<BookingRequest>
  ): Promise<BookingConfirmation> {
    await this.simulateDelay(800, 1500);

    const existingBooking = this.bookings.get(bookingId);
    if (!existingBooking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Mock modification failed - simulated error');
    }

    // Determine new dates
    const newCheckInDate = changes.checkInDate || existingBooking.checkInDate;
    const newCheckOutDate = changes.checkOutDate || existingBooking.checkOutDate;

    // Determine new room
    let newRoomDetails = existingBooking.roomDetails;
    if (changes.roomId && changes.roomId !== existingBooking.roomDetails.id) {
      // Get availability to find the new room details
      const availability = await this.checkAvailability({
        hotelId: existingBooking.hotel.id,
        checkInDate: newCheckInDate,
        checkOutDate: newCheckOutDate,
      });

      const room = availability.rooms.find(r => r.id === changes.roomId);
      if (room) {
        newRoomDetails = room;
      }
    }

    // Recalculate pricing with new dates/room
    const checkIn = new Date(newCheckInDate);
    const checkOut = new Date(newCheckOutDate);
    const numberOfNights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const baseRate = newRoomDetails.basePrice;
    const subtotal = baseRate * numberOfNights;
    const taxAmount = subtotal * 0.12; // 12% tax
    const serviceFee = 25;
    const total = subtotal + taxAmount + serviceFee;

    const newPricing: PricingDetails = {
      baseRate,
      numberOfNights,
      subtotal,
      taxes: [{ name: 'Hotel Tax', amount: taxAmount, percentage: 12 }],
      fees: [{ name: 'Service Fee', amount: serviceFee, description: 'Booking service fee' }],
      total,
      currency: 'USD',
    };

    // Create updated booking
    const updatedBooking: BookingConfirmation = {
      ...existingBooking,
      checkInDate: newCheckInDate,
      checkOutDate: newCheckOutDate,
      roomDetails: newRoomDetails,
      pricing: newPricing,
      guestInfo: changes.guestInfo || existingBooking.guestInfo,
      updatedAt: new Date().toISOString(),
    };

    // Update stored booking
    this.bookings.set(bookingId, updatedBooking);

    return updatedBooking;
  }

  /**
   * Simulate cancelling a reservation
   */
  async cancelReservation(bookingId: string): Promise<CancellationConfirmation> {
    await this.simulateDelay(800, 1500);

    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    // Calculate refund based on cancellation policy
    const checkInDate = new Date(booking.checkInDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let refundPercentage = 0;
    if (booking.hotel.cancellationPolicy) {
      const applicableRule = booking.hotel.cancellationPolicy.rules
        .sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
        .find(rule => daysUntilCheckIn >= rule.daysBeforeCheckIn);

      refundPercentage = applicableRule?.refundPercentage || 0;
    }

    const refundAmount = (booking.pricing.total * refundPercentage) / 100;

    // Update booking status
    const updatedBooking: BookingConfirmation = {
      ...booking,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };
    this.bookings.set(bookingId, updatedBooking);

    return {
      bookingId,
      referenceNumber: booking.referenceNumber,
      cancelledAt: new Date().toISOString(),
      refundAmount,
      refundCurrency: booking.pricing.currency,
      refundStatus: 'pending',
    };
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get all bookings (for testing)
   */
  getAllBookings(): BookingConfirmation[] {
    return Array.from(this.bookings.values());
  }

  /**
   * Clear all bookings (for testing)
   */
  clearBookings(): void {
    this.bookings.clear();
    this.bookingCounter = 1000;
  }
}

export default MockBookingAdapter;
