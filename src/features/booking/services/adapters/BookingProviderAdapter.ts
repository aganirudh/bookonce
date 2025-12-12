/**
 * Booking Provider Adapter Interface
 * Defines the contract for integrating with different booking providers
 */

import type {
  AvailabilityParams,
  AvailabilityResponse,
  BookingProviderAdapter,
  BookingRequest,
  BookingConfirmation,
  CancellationConfirmation,
  Hotel,
} from '@/types/booking';

/**
 * Base abstract class for booking provider adapters
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseBookingProviderAdapter implements BookingProviderAdapter {
  protected readonly providerId: string;
  protected readonly apiKey?: string;
  protected readonly baseUrl?: string;

  constructor(providerId: string, config?: { apiKey?: string; baseUrl?: string }) {
    this.providerId = providerId;
    this.apiKey = config?.apiKey;
    this.baseUrl = config?.baseUrl;
  }

  /**
   * Get provider ID
   */
  getProviderId(): string {
    return this.providerId;
  }

  /**
   * Check if this adapter supports a given hotel
   */
  abstract supportsHotel(hotel: Hotel): boolean;

  /**
   * Check availability for a hotel
   */
  abstract checkAvailability(params: AvailabilityParams): Promise<AvailabilityResponse>;

  /**
   * Get detailed hotel information
   */
  abstract getHotelDetails(hotelId: string): Promise<Hotel>;

  /**
   * Create a new reservation
   */
  abstract createReservation(request: BookingRequest): Promise<BookingConfirmation>;

  /**
   * Modify an existing reservation
   */
  abstract modifyReservation(
    bookingId: string,
    changes: Partial<BookingRequest>
  ): Promise<BookingConfirmation>;

  /**
   * Cancel a reservation
   */
  abstract cancelReservation(bookingId: string): Promise<CancellationConfirmation>;
}

export default BaseBookingProviderAdapter;
