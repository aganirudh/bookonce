/**
 * Provider Factory
 * Selects and instantiates the appropriate booking provider adapter
 */

import type { Hotel } from '@/types/booking';
import type { BookingProviderAdapter } from '@/types/booking';
import { MockBookingAdapter } from './MockBookingAdapter';
import { logWarning } from '../../utils/errorHandling';

/**
 * Registry of available booking provider adapters
 */
const providerRegistry: Map<string, BookingProviderAdapter> = new Map();

/**
 * Initialize provider registry with available adapters
 */
export const initializeProviders = (): void => {
  // Register mock provider for development
  const mockProvider = new MockBookingAdapter();
  providerRegistry.set('mock-provider', mockProvider);

  // TODO: Register real providers when available
  // const bookingComProvider = new BookingComAdapter(config);
  // providerRegistry.set('booking-com', bookingComProvider);

  // const expediaProvider = new ExpediaAdapter(config);
  // providerRegistry.set('expedia', expediaProvider);
};

/**
 * Get provider adapter for a specific hotel
 */
export const getProviderForHotel = (hotel: Hotel): BookingProviderAdapter => {
  // If hotel has a specific provider ID, use that
  if (hotel.providerId && providerRegistry.has(hotel.providerId)) {
    return providerRegistry.get(hotel.providerId)!;
  }

  // Otherwise, find first provider that supports this hotel
  for (const provider of providerRegistry.values()) {
    if (provider.supportsHotel(hotel)) {
      return provider;
    }
  }

  // Fallback to mock provider if no other provider found
  logWarning('No provider found for hotel, using mock provider', {
    hotelId: hotel.id,
    providerId: hotel.providerId,
  });

  return providerRegistry.get('mock-provider')!;
};

/**
 * Get provider adapter by ID
 */
export const getProviderById = (providerId: string): BookingProviderAdapter | null => {
  return providerRegistry.get(providerId) || null;
};

/**
 * Get all registered providers
 */
export const getAllProviders = (): BookingProviderAdapter[] => {
  return Array.from(providerRegistry.values());
};

/**
 * Register a custom provider adapter
 */
export const registerProvider = (providerId: string, adapter: BookingProviderAdapter): void => {
  providerRegistry.set(providerId, adapter);
};

/**
 * Unregister a provider adapter
 */
export const unregisterProvider = (providerId: string): boolean => {
  return providerRegistry.delete(providerId);
};

// Initialize providers on module load
initializeProviders();
