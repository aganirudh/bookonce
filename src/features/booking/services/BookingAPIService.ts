/**
 * Booking API Service
 * Main service layer for handling all booking-related API communications
 */

import type {
  AvailabilityParams,
  AvailabilityResponse,
  BookingRequest,
  BookingConfirmation,
  CancellationConfirmation,
  PricingDetails,
  Hotel,
} from '@/types/booking';
import { useCacheStore, getAvailabilityCacheKey, getPricingCacheKey } from '../stores/cacheStore';
import { getProviderForHotel } from './adapters';
import {
  retryWithBackoff,
  withErrorHandling,
  logError,
  BookingAPIError,
} from '../utils/errorHandling';
import { CACHE_TTL } from '../constants';
import {
  optimizeAvailabilityResponse,
  optimizeHotelData,
  prefetchManager,
  isSlowNetwork,
} from '../utils/apiOptimization';
import {
  availabilityRateLimiter,
  bookingRateLimiter,
  modificationRateLimiter,
  cancellationRateLimiter,
  enforceRateLimit,
  RateLimitError,
} from '../utils/rateLimiter';
import { sanitizeBookingRequest, detectXSS, detectSQLInjection } from '../utils/inputSanitization';
import { performanceMonitoringService } from './PerformanceMonitoringService';

/**
 * Configuration for currency conversion
 */
interface CurrencyConversionConfig {
  targetCurrency: string;
  exchangeRates?: Record<string, number>;
}

/**
 * Main Booking API Service class
 */
export class BookingAPIService {
  private currencyConfig: CurrencyConversionConfig = {
    targetCurrency: 'USD',
  };

  /**
   * Set currency conversion configuration
   */
  setCurrencyConfig(config: CurrencyConversionConfig): void {
    this.currencyConfig = config;
  }

  /**
   * Get user identifier for rate limiting
   * In a real app, this would come from authentication context
   */
  private getUserId(): string {
    // For now, use a session-based identifier
    // In production, this should be the authenticated user ID or IP address
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('booking_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('booking_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server';
  }

  /**
   * Check availability for a hotel with caching
   */
  checkAvailability = withErrorHandling(
    async (params: AvailabilityParams): Promise<AvailabilityResponse> => {
      const { hotelId, checkInDate, checkOutDate } = params;

      // Enforce rate limiting
      try {
        enforceRateLimit(availabilityRateLimiter, this.getUserId());
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw new BookingAPIError(
            'RATE_LIMIT_ERROR',
            error.message,
            { retryAfter: error.retryAfter, resetAt: error.resetAt },
            429,
            false
          );
        }
        throw error;
      }

      // Generate cache key
      const cacheKey = getAvailabilityCacheKey(hotelId, checkInDate, checkOutDate);

      // Check prefetch cache first
      const prefetched = prefetchManager.getPrefetched<AvailabilityResponse>(cacheKey);
      if (prefetched) {
        return prefetched;
      }

      // Check cache
      const cached = useCacheStore.getState().getAvailability(cacheKey);
      if (cached) {
        performanceMonitoringService.trackCacheOperation('availability', true);
        return cached;
      }
      performanceMonitoringService.trackCacheOperation('availability', false);

      // Detect mobile device
      const isMobile = window.innerWidth < 768;

      // Start performance timer
      const endTimer = performanceMonitoringService.startTimer('checkAvailability');

      // Fetch from provider with retry logic
      const availability = await retryWithBackoff(
        async () => {
          // Get hotel data to determine provider
          const hotel = await this.getHotelById(hotelId);
          const provider = getProviderForHotel(hotel);

          return await provider.checkAvailability(params);
        },
        {
          maxRetries: isSlowNetwork() ? 2 : 3,
          initialDelay: isSlowNetwork() ? 2000 : 1000,
          onRetry: (error, attempt, delay) => {
            logError(`Availability check failed, retrying (attempt ${attempt})`, error, {
              hotelId,
              checkInDate,
              checkOutDate,
              delay,
            });
          },
        }
      );

      // Track API response time
      const duration = endTimer();
      performanceMonitoringService.trackApiResponseTime(
        '/api/availability',
        'POST',
        duration,
        200,
        true
      );

      // Optimize response for mobile
      const optimized = optimizeAvailabilityResponse(availability, isMobile);

      // Cache the result
      useCacheStore.getState().setAvailability(cacheKey, optimized, CACHE_TTL.AVAILABILITY);

      return optimized;
    },
    { action: 'checkAvailability', component: 'BookingAPIService' }
  );

  /**
   * Prefetch availability for likely next dates
   */
  async prefetchAvailability(
    hotelId: number,
    checkInDate: string,
    checkOutDate: string
  ): Promise<void> {
    const cacheKey = getAvailabilityCacheKey(hotelId, checkInDate, checkOutDate);

    await prefetchManager.prefetch(cacheKey, async () => {
      return this.checkAvailability({ hotelId, checkInDate, checkOutDate });
    });
  }

  /**
   * Prefetch pricing for a room
   */
  async prefetchPricing(
    hotelId: number,
    roomId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<void> {
    const cacheKey = getPricingCacheKey(hotelId, roomId, checkInDate, checkOutDate);

    await prefetchManager.prefetch(cacheKey, async () => {
      return this.getPricing(hotelId, roomId, checkInDate, checkOutDate);
    });
  }

  /**
   * Get pricing for a specific room with currency conversion support
   */
  getPricing = withErrorHandling(
    async (
      hotelId: number,
      roomId: string,
      checkInDate: string,
      checkOutDate: string,
      targetCurrency?: string
    ): Promise<PricingDetails> => {
      // Generate cache key
      const cacheKey = getPricingCacheKey(hotelId, roomId, checkInDate, checkOutDate);

      // Check cache first
      const cached = useCacheStore.getState().getPricing(cacheKey);
      if (cached && (!targetCurrency || cached.currency === targetCurrency)) {
        return cached;
      }

      // Calculate pricing with retry logic
      const pricing = await retryWithBackoff(
        async () => {
          // Get availability to find room details
          const availability = await this.checkAvailability({
            hotelId,
            checkInDate,
            checkOutDate,
          });

          const room = availability.rooms.find(r => r.id === roomId);
          if (!room) {
            throw new BookingAPIError(
              'VALIDATION_ERROR',
              'Room not found',
              { roomId, hotelId },
              404,
              false
            );
          }

          // Calculate number of nights
          const checkIn = new Date(checkInDate);
          const checkOut = new Date(checkOutDate);
          const numberOfNights = Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Calculate pricing
          const baseRate = room.basePrice;
          const subtotal = baseRate * numberOfNights;
          const taxAmount = subtotal * 0.12; // 12% tax
          const serviceFee = 25; // Flat service fee
          const total = subtotal + taxAmount + serviceFee;

          const pricingDetails: PricingDetails = {
            baseRate,
            numberOfNights,
            subtotal,
            taxes: [
              {
                name: 'Hotel Tax',
                amount: taxAmount,
                percentage: 12,
              },
            ],
            fees: [
              {
                name: 'Service Fee',
                amount: serviceFee,
                description: 'Booking service fee',
              },
            ],
            total,
            currency: 'USD',
          };

          return pricingDetails;
        },
        {
          maxRetries: 2,
          initialDelay: 500,
          onRetry: (error, attempt, delay) => {
            logError(`Pricing calculation failed, retrying (attempt ${attempt})`, error, {
              hotelId,
              roomId,
              checkInDate,
              checkOutDate,
              delay,
            });
          },
        }
      );

      // Apply currency conversion if needed
      const finalPricing =
        targetCurrency && targetCurrency !== pricing.currency
          ? this.convertCurrency(pricing, targetCurrency)
          : pricing;

      // Cache the result
      useCacheStore.getState().setPricing(cacheKey, finalPricing, CACHE_TTL.PRICING);

      return finalPricing;
    },
    { action: 'getPricing', component: 'BookingAPIService' }
  );

  /**
   * Create a new booking with error handling
   */
  createBooking = withErrorHandling(
    async (request: BookingRequest): Promise<BookingConfirmation> => {
      // Enforce rate limiting
      try {
        enforceRateLimit(bookingRateLimiter, this.getUserId());
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw new BookingAPIError(
            'RATE_LIMIT_ERROR',
            error.message,
            { retryAfter: error.retryAfter, resetAt: error.resetAt },
            429,
            false
          );
        }
        throw error;
      }

      // Sanitize input to prevent XSS and injection attacks
      const sanitizedRequest = sanitizeBookingRequest(request);

      // Detect malicious patterns
      const requestString = JSON.stringify(sanitizedRequest);
      if (detectXSS(requestString)) {
        throw new BookingAPIError(
          'VALIDATION_ERROR',
          'Invalid input detected',
          { reason: 'XSS pattern detected' },
          400,
          false
        );
      }
      if (detectSQLInjection(requestString)) {
        throw new BookingAPIError(
          'VALIDATION_ERROR',
          'Invalid input detected',
          { reason: 'SQL injection pattern detected' },
          400,
          false
        );
      }

      // Validate request
      this.validateBookingRequest(sanitizedRequest);

      // Create booking with retry logic
      const booking = await retryWithBackoff(
        async () => {
          // Get hotel to determine provider
          const hotel = await this.getHotelById(sanitizedRequest.hotelId);
          const provider = getProviderForHotel(hotel);

          return await provider.createReservation(sanitizedRequest);
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
          onRetry: (error, attempt, delay) => {
            logError(`Booking creation failed, retrying (attempt ${attempt})`, error, {
              hotelId: sanitizedRequest.hotelId,
              delay,
            });
          },
        }
      );

      // Invalidate availability and pricing caches for this hotel
      this.invalidateCachesForHotel(sanitizedRequest.hotelId);

      return booking;
    },
    { action: 'createBooking', component: 'BookingAPIService' }
  );

  /**
   * Get a specific booking by ID
   */
  getBooking = withErrorHandling(
    async (bookingId: string): Promise<BookingConfirmation> => {
      // In a real implementation, this would call a backend API
      // For now, we'll throw an error indicating this needs backend implementation
      throw new BookingAPIError(
        'UNKNOWN_ERROR',
        'getBooking requires backend API implementation',
        { bookingId },
        501,
        false
      );
    },
    { action: 'getBooking', component: 'BookingAPIService' }
  );

  /**
   * Get all bookings for a user
   */
  getUserBookings = withErrorHandling(
    async (userId: string): Promise<BookingConfirmation[]> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real implementation, this would call a backend API
      // For now, return mock data for development
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
            specialRequests: 'Late check-in requested',
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
          checkInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          checkOutDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
          guestInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            country: 'United States',
            specialRequests: 'Ground floor room preferred',
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
          status: 'pending',
          confirmationSentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          bookingId: 'BK004',
          referenceNumber: 'VGN-2023-045',
          hotel: {
            id: 4,
            title: 'Beach Paradise Resort',
            location: 'Maldives',
            price: 550,
            rating: 4.9,
            reviews: 678,
            image: '/placeholder.svg',
            amenities: ['WiFi', 'Beach Access', 'Pool'],
            tags: ['Luxury', 'Romantic', 'Beach'],
            energy: 40,
            social: 30,
            budget: 90,
            coordinates: [3.2, 73.2],
            instantBooking: true,
            checkInTime: '14:00',
            checkOutTime: '12:00',
            providerId: 'mock-provider',
            providerHotelId: '4',
            cancellationPolicy: {
              type: 'non-refundable',
              description: 'Non-refundable booking',
              rules: [{ daysBeforeCheckIn: 0, refundPercentage: 0 }],
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
            id: 'room-4',
            name: 'Overwater Villa',
            description: 'Luxury villa over crystal clear waters',
            capacity: 2,
            bedType: 'King',
            size: 65,
            images: ['/placeholder.svg'],
            amenities: ['Ocean View', 'Private Deck', 'Jacuzzi'],
            basePrice: 550,
            available: 1,
            instantBooking: true,
          },
          pricing: {
            baseRate: 550,
            numberOfNights: 7,
            subtotal: 3850,
            taxes: [{ name: 'Hotel Tax', amount: 462, percentage: 12 }],
            fees: [{ name: 'Service Fee', amount: 25, description: 'Booking service fee' }],
            total: 4337,
            currency: 'USD',
          },
          status: 'cancelled',
          confirmationSentAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      // Merge with localStorage bookings
      if (typeof window !== 'undefined') {
        const localBookings = JSON.parse(localStorage.getItem('user_bookings') || '[]').map((b: any) => ({
          bookingId: b.id,
          referenceNumber: b.referenceNumber,
          hotel: {
            id: 99,
            title: b.hotel.title,
            location: b.hotel.location || 'Unknown Location',
            price: b.amount,
            rating: 4.5,
            reviews: 12,
            image: b.hotel.image,
            amenities: ['WiFi', 'Pool'],
            tags: ['Featured'],
            checkInTime: '14:00',
            checkOutTime: '11:00',
            coordinates: b.coordinates ? [b.coordinates.lat, b.coordinates.lng] : [28.6139, 77.2090]
          },
          checkInDate: new Date(b.date).toISOString(),
          checkOutDate: b.returnDate ? new Date(b.returnDate).toISOString() : new Date(new Date(b.date).getTime() + 86400000).toISOString(),
          guestInfo: { firstName: 'User', lastName: 'Name', email: 'user@example.com', phone: '', country: 'US' },
          roomDetails: { name: 'Standard Room', description: 'Comfortable room', capacity: b.guests, bedType: 'Queen', size: 30, amenities: [], basePrice: b.amount, available: 1 },
          pricing: { baseRate: b.amount, numberOfNights: 1, subtotal: b.amount, total: b.amount, taxes: [], fees: [], currency: 'INR' },
          status: b.status,
          confirmationSentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        return [...localBookings, ...mockBookings];
      }

      return mockBookings;
    },
    { action: 'getUserBookings', component: 'BookingAPIService' }
  );

  /**
   * Modify an existing booking
   */
  modifyBooking = withErrorHandling(
    async (
      bookingId: string,
      modifications: Partial<BookingRequest>
    ): Promise<BookingConfirmation> => {
      // Enforce rate limiting
      try {
        enforceRateLimit(modificationRateLimiter, this.getUserId());
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw new BookingAPIError(
            'RATE_LIMIT_ERROR',
            error.message,
            { retryAfter: error.retryAfter, resetAt: error.resetAt },
            429,
            false
          );
        }
        throw error;
      }

      // Modify booking with retry logic
      const updatedBooking = await retryWithBackoff(
        async () => {
          // Get existing booking to determine provider
          const existingBooking = await this.getBooking(bookingId);
          const provider = getProviderForHotel(existingBooking.hotel);

          return await provider.modifyReservation(bookingId, modifications);
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
          onRetry: (error, attempt, delay) => {
            logError(`Booking modification failed, retrying (attempt ${attempt})`, error, {
              bookingId,
              delay,
            });
          },
        }
      );

      // Invalidate caches
      if (modifications.hotelId) {
        this.invalidateCachesForHotel(modifications.hotelId);
      }

      return updatedBooking;
    },
    { action: 'modifyBooking', component: 'BookingAPIService' }
  );

  /**
   * Cancel a booking
   */
  cancelBooking = withErrorHandling(
    async (
      bookingId: string,
      reason?: string,
      paymentIntentId?: string
    ): Promise<CancellationConfirmation> => {
      // Enforce rate limiting
      try {
        enforceRateLimit(cancellationRateLimiter, this.getUserId());
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw new BookingAPIError(
            'RATE_LIMIT_ERROR',
            error.message,
            { retryAfter: error.retryAfter, resetAt: error.resetAt },
            429,
            false
          );
        }
        throw error;
      }

      // Cancel booking with retry logic
      const cancellation = await retryWithBackoff(
        async () => {
          // Get existing booking to determine provider
          const existingBooking = await this.getBooking(bookingId);
          const provider = getProviderForHotel(existingBooking.hotel);

          // Cancel reservation with provider
          const cancellationResult = await provider.cancelReservation(bookingId);

          // Process refund if applicable
          if (cancellationResult.refundAmount > 0 && paymentIntentId) {
            try {
              // Import payment service dynamically to avoid circular dependencies
              const { paymentAPIService } = await import('./PaymentAPIService');

              // Convert refund amount to cents for Stripe
              const refundAmountCents = Math.round(cancellationResult.refundAmount * 100);

              await paymentAPIService.processRefund(
                paymentIntentId,
                refundAmountCents,
                reason || 'Booking cancelled by customer'
              );
            } catch (refundError) {
              logError('Refund processing failed during cancellation', refundError, {
                bookingId,
                refundAmount: cancellationResult.refundAmount,
              });
              // Don't fail the cancellation if refund fails
              // The booking is still cancelled, refund can be processed manually
            }
          }

          // Send cancellation confirmation email
          try {
            // Import notification service dynamically
            const { notificationService } = await import('./NotificationService');

            await notificationService.sendCancellationConfirmation(
              existingBooking,
              cancellationResult.refundAmount,
              existingBooking.guestInfo.email
            );
          } catch (emailError) {
            logError('Failed to send cancellation confirmation email', emailError, {
              bookingId,
              email: existingBooking.guestInfo.email,
            });
            // Don't fail the cancellation if email fails
          }

          return cancellationResult;
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
          onRetry: (error, attempt, delay) => {
            logError(`Booking cancellation failed, retrying (attempt ${attempt})`, error, {
              bookingId,
              reason,
              delay,
            });
          },
        }
      );

      // Invalidate caches
      // Note: We can't easily get hotelId from bookingId without fetching the booking
      // This is acceptable as the cache will expire naturally

      return cancellation;
    },
    { action: 'cancelBooking', component: 'BookingAPIService' }
  );

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get hotel by ID (placeholder - would fetch from backend in real implementation)
   */
  private async getHotelById(hotelId: number): Promise<Hotel> {
    // In a real implementation, this would fetch from backend or use existing hotel data
    // For now, return a mock hotel with the ID
    return {
      id: hotelId,
      title: 'Hotel',
      location: 'Location',
      price: 150,
      rating: 4.5,
      reviews: 100,
      image: '/placeholder.svg',
      amenities: [],
      tags: [],
      energy: 50,
      social: 50,
      budget: 50,
      coordinates: [0, 0],
      providerId: 'mock-provider',
      providerHotelId: hotelId.toString(),
      instantBooking: true,
      checkInTime: '15:00',
      checkOutTime: '11:00',
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
   * Validate booking request
   */
  private validateBookingRequest(request: BookingRequest): void {
    const errors: string[] = [];

    if (!request.hotelId) {
      errors.push('Hotel ID is required');
    }

    if (!request.roomId) {
      errors.push('Room ID is required');
    }

    if (!request.checkInDate) {
      errors.push('Check-in date is required');
    }

    if (!request.checkOutDate) {
      errors.push('Check-out date is required');
    }

    // Validate dates
    const checkIn = new Date(request.checkInDate);
    const checkOut = new Date(request.checkOutDate);
    const now = new Date();

    if (checkIn < now) {
      errors.push('Check-in date cannot be in the past');
    }

    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }

    // Validate guest info
    if (!request.guestInfo.firstName) {
      errors.push('Guest first name is required');
    }

    if (!request.guestInfo.lastName) {
      errors.push('Guest last name is required');
    }

    if (!request.guestInfo.email) {
      errors.push('Guest email is required');
    }

    if (!request.guestInfo.phone) {
      errors.push('Guest phone is required');
    }

    if (!request.paymentMethodId) {
      errors.push('Payment method is required');
    }

    if (errors.length > 0) {
      throw new BookingAPIError('VALIDATION_ERROR', errors.join(', '), { errors }, 400, false);
    }
  }

  /**
   * Convert pricing to different currency
   */
  private convertCurrency(pricing: PricingDetails, targetCurrency: string): PricingDetails {
    // Get exchange rate
    const rate = this.currencyConfig.exchangeRates?.[targetCurrency] || 1;

    // Convert all amounts
    const convertedPricing: PricingDetails = {
      ...pricing,
      convertedTotal: {
        amount: pricing.total * rate,
        currency: targetCurrency,
        rate,
      },
    };

    return convertedPricing;
  }

  /**
   * Invalidate all caches for a specific hotel
   */
  private invalidateCachesForHotel(hotelId: number): void {
    const cacheStore = useCacheStore.getState();

    // Get all cache keys and invalidate those matching the hotel ID
    const availabilityCache = cacheStore.availabilityCache;
    const pricingCache = cacheStore.pricingCache;

    // Invalidate availability cache entries for this hotel
    for (const key of availabilityCache.keys()) {
      if (key.includes(`availability:${hotelId}:`)) {
        cacheStore.invalidate(key);
      }
    }

    // Invalidate pricing cache entries for this hotel
    for (const key of pricingCache.keys()) {
      if (key.includes(`pricing:${hotelId}:`)) {
        cacheStore.invalidate(key);
      }
    }
  }
}

// Export singleton instance
export const bookingAPIService = new BookingAPIService();

export default bookingAPIService;
