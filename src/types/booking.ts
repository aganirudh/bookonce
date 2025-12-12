/**
 * Booking Integration Type Definitions
 * Core types for hotel booking functionality
 */

// ============================================================================
// Hotel Extensions
// ============================================================================

export interface CancellationPolicy {
  type: 'flexible' | 'moderate' | 'strict' | 'non-refundable';
  description: string;
  rules: CancellationRule[];
}

export interface CancellationRule {
  daysBeforeCheckIn: number;
  refundPercentage: number;
  fee?: number;
}

export interface Hotel {
  // Existing fields
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  tags: string[];
  energy: number;
  social: number;
  budget: number;
  coordinates?: number[];
  
  // New fields for booking
  instantBooking?: boolean;
  cancellationPolicy?: CancellationPolicy;
  checkInTime?: string;
  checkOutTime?: string;
  providerId?: string;
  providerHotelId?: string;
}

// ============================================================================
// Room and Availability
// ============================================================================

export interface RoomOption {
  id: string;
  name: string;
  description: string;
  capacity: number;
  bedType: string;
  size: number; // square meters
  images: string[];
  amenities: string[];
  basePrice: number;
  available: number; // number of rooms available
  instantBooking: boolean;
}

export interface DateRange {
  checkIn: string;
  checkOut: string;
}

export interface AvailabilityResponse {
  hotelId: number;
  checkInDate: string;
  checkOutDate: string;
  available: boolean;
  rooms: RoomOption[];
  alternativeDates?: DateRange[];
  cachedAt: string;
  expiresAt: string;
}

// ============================================================================
// Pricing
// ============================================================================

export interface TaxBreakdown {
  name: string;
  amount: number;
  percentage?: number;
}

export interface FeeBreakdown {
  name: string;
  amount: number;
  description: string;
}

export interface PricingDetails {
  baseRate: number;
  numberOfNights: number;
  subtotal: number;
  taxes: TaxBreakdown[];
  fees: FeeBreakdown[];
  total: number;
  currency: string;
  convertedTotal?: {
    amount: number;
    currency: string;
    rate: number;
  };
}

// ============================================================================
// Guest Information
// ============================================================================

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  specialRequests?: string;
  arrivalTime?: string;
}

// ============================================================================
// Booking Request and Confirmation
// ============================================================================

export interface BookingRequest {
  hotelId: number;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guestInfo: GuestInfo;
  paymentMethodId: string;
  specialRequests?: string;
  userId?: string; // if authenticated
}

export interface BookingConfirmation {
  bookingId: string;
  referenceNumber: string;
  hotel: Hotel;
  checkInDate: string;
  checkOutDate: string;
  guestInfo: GuestInfo;
  roomDetails: RoomOption;
  pricing: PricingDetails;
  status: 'confirmed' | 'pending' | 'cancelled';
  confirmationSentAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Cancellation
// ============================================================================

export interface CancellationConfirmation {
  bookingId: string;
  referenceNumber: string;
  cancelledAt: string;
  refundAmount: number;
  refundCurrency: string;
  refundStatus: 'pending' | 'processed' | 'failed';
  reason?: string;
}

// ============================================================================
// Payment
// ============================================================================

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
}

export interface PaymentConfirmation {
  paymentIntentId: string;
  status: 'succeeded' | 'failed';
  amount: number;
  currency: string;
  paymentMethod: string;
  receiptUrl?: string;
}

export interface RefundConfirmation {
  refundId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  reason: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  isDefault: boolean;
}

// ============================================================================
// Booking Provider Adapter
// ============================================================================

export interface AvailabilityParams {
  hotelId: number;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
}

export interface BookingProviderAdapter {
  checkAvailability(params: AvailabilityParams): Promise<AvailabilityResponse>;
  getHotelDetails(hotelId: string): Promise<Hotel>;
  createReservation(request: BookingRequest): Promise<BookingConfirmation>;
  modifyReservation(bookingId: string, changes: Partial<BookingRequest>): Promise<BookingConfirmation>;
  cancelReservation(bookingId: string): Promise<CancellationConfirmation>;
}

// ============================================================================
// State Management Types
// ============================================================================

export type BookingStep = 'dates' | 'rooms' | 'guest-info' | 'payment' | 'processing';

export interface BookingModalState {
  step: BookingStep;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  selectedRoom: RoomOption | null;
  guestInfo: Partial<GuestInfo>;
  availability: AvailabilityResponse | null;
  pricing: PricingDetails | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CachedData<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

// ============================================================================
// Error Types
// ============================================================================

export type BookingErrorType = 
  | 'VALIDATION_ERROR'
  | 'AVAILABILITY_CHECK_FAILED'
  | 'BOOKING_FAILED'
  | 'PAYMENT_DECLINED'
  | 'NETWORK_ERROR'
  | 'HOTEL_UNAVAILABLE'
  | 'MODIFICATION_FAILED'
  | 'CANCELLATION_FAILED'
  | 'RATE_LIMIT_ERROR'
  | 'UNKNOWN_ERROR';

export interface BookingError {
  type: BookingErrorType;
  message: string;
  details?: any;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 
  | 'booking_confirmation'
  | 'booking_modification'
  | 'booking_cancellation'
  | 'check_in_reminder'
  | 'booking_status_change'
  | 'hotel_cancellation';

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    types: NotificationType[];
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
  };
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  notificationPreferences: NotificationPreferences;
}
