/**
 * Analytics Service
 *
 * Tracks booking funnel events and user interactions throughout the booking process.
 * Provides a centralized interface for analytics tracking across the application.
 */

export interface BookingEventData {
  hotelId?: number;
  source?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  roomId?: string;
  price?: number;
  hasAccount?: boolean;
  paymentMethod?: string;
  bookingId?: string;
  totalPrice?: number;
  currency?: string;
  step?: string;
  errorType?: string;
  errorMessage?: string;
  component?: string;
}

export interface PerformanceMetrics {
  apiResponseTime?: number;
  cacheHitRate?: number;
  bookingCompletionTime?: number;
  paymentSuccessRate?: number;
  endpoint?: string;
  operation?: string;
  duration?: number;
  success?: boolean;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private events: Array<{ event: string; data: any; timestamp: number }> = [];

  /**
   * Initialize analytics service
   */
  initialize(): void {
    // In production, this would initialize analytics providers like Google Analytics, Mixpanel, etc.
    console.log('[Analytics] Service initialized');
  }

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Track a generic event
   */
  track(event: string, data?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const eventData = {
      event,
      data: data || {},
      timestamp: Date.now(),
    };

    this.events.push(eventData);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, data);
    }

    // In production, send to analytics provider
    this.sendToProvider(eventData);
  }

  /**
   * Track booking funnel events
   */
  trackBookingStarted(data: BookingEventData): void {
    this.track('Booking Started', {
      hotelId: data.hotelId,
      source: data.source || 'hotel_card',
    });
  }

  trackDatesSelected(data: BookingEventData): void {
    this.track('Dates Selected', {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights: data.nights,
    });
  }

  trackRoomSelected(data: BookingEventData): void {
    this.track('Room Selected', {
      roomId: data.roomId,
      price: data.price,
    });
  }

  trackGuestInfoCompleted(data: BookingEventData): void {
    this.track('Guest Info Completed', {
      hasAccount: data.hasAccount,
    });
  }

  trackPaymentSubmitted(data: BookingEventData): void {
    this.track('Payment Submitted', {
      paymentMethod: data.paymentMethod,
    });
  }

  trackBookingCompleted(data: BookingEventData): void {
    this.track('Booking Completed', {
      bookingId: data.bookingId,
      totalPrice: data.totalPrice,
      currency: data.currency,
    });
  }

  trackBookingError(data: BookingEventData): void {
    this.track('Booking Error', {
      step: data.step,
      errorType: data.errorType,
      errorMessage: data.errorMessage,
      component: data.component,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, data: PerformanceMetrics): void {
    this.track(`Performance: ${metric}`, data);
  }

  trackApiResponseTime(endpoint: string, duration: number): void {
    this.trackPerformance('API Response Time', {
      endpoint,
      duration,
    });
  }

  trackCacheHitRate(operation: string, hitRate: number): void {
    this.trackPerformance('Cache Hit Rate', {
      operation,
      cacheHitRate: hitRate,
    });
  }

  trackBookingCompletionTime(duration: number): void {
    this.trackPerformance('Booking Completion Time', {
      bookingCompletionTime: duration,
    });
  }

  trackPaymentSuccess(success: boolean): void {
    this.trackPerformance('Payment Success', {
      success,
    });
  }

  /**
   * Get all tracked events (for testing)
   */
  getEvents(): Array<{ event: string; data: any; timestamp: number }> {
    return [...this.events];
  }

  /**
   * Clear all tracked events (for testing)
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Send event to analytics provider
   */
  private sendToProvider(eventData: { event: string; data: any; timestamp: number }): void {
    // In production, this would send to analytics providers
    // Example: Google Analytics, Mixpanel, Segment, etc.
    // For now, we'll just store it locally
    // In a real implementation, you would do something like:
    // window.gtag?.('event', eventData.event, eventData.data);
    // window.mixpanel?.track(eventData.event, eventData.data);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
