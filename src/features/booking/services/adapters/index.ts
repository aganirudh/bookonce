/**
 * Booking Provider Adapters
 * Export all adapter-related functionality
 */

export { BaseBookingProviderAdapter } from './BookingProviderAdapter';
export { MockBookingAdapter } from './MockBookingAdapter';
export {
  initializeProviders,
  getProviderForHotel,
  getProviderById,
  getAllProviders,
  registerProvider,
  unregisterProvider,
} from './providerFactory';
