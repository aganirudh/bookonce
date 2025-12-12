/**
 * Error Logging Service
 * 
 * Provides centralized error logging with context for debugging and monitoring.
 * In production, this would integrate with Sentry or similar error tracking service.
 */

export interface ErrorContext {
  component?: string;
  step?: string;
  userId?: string;
  hotelId?: number;
  bookingId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLogEntry {
  error: Error;
  context: ErrorContext;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorLoggingService {
  private isEnabled: boolean = true;
  private errors: ErrorLogEntry[] = [];
  private sentryInitialized: boolean = false;

  /**
   * Initialize error logging service
   * In production, this would initialize Sentry SDK
   */
  initialize(dsn?: string): void {
    if (dsn && !this.sentryInitialized) {
      // In production, initialize Sentry:
      // Sentry.init({
      //   dsn,
      //   environment: import.meta.env.MODE,
      //   integrations: [
      //     new Sentry.BrowserTracing(),
      //     new Sentry.Replay(),
      //   ],
      //   tracesSampleRate: 1.0,
      //   replaysSessionSampleRate: 0.1,
      //   replaysOnErrorSampleRate: 1.0,
      // });
      this.sentryInitialized = true;
      console.log('[ErrorLogging] Service initialized');
    }
  }

  /**
   * Enable or disable error logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Log an error with context
   */
  logError(
    error: Error,
    context: ErrorContext,
    severity: ErrorLogEntry['severity'] = 'medium'
  ): void {
    if (!this.isEnabled) return;

    const errorEntry: ErrorLogEntry = {
      error,
      context,
      timestamp: Date.now(),
      severity,
    };

    this.errors.push(errorEntry);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorLogging]', {
        message: error.message,
        stack: error.stack,
        context,
        severity,
      });
    }

    // Send to Sentry in production
    this.sendToSentry(errorEntry);

    // Set up alerts for critical errors
    if (severity === 'critical') {
      this.alertCriticalError(errorEntry);
    }
  }

  /**
   * Capture exception with Sentry-style API
   */
  captureException(error: Error, context?: ErrorContext): void {
    this.logError(error, context || {}, 'medium');
  }

  /**
   * Capture message (non-error logging)
   */
  captureMessage(message: string, context?: ErrorContext, severity: ErrorLogEntry['severity'] = 'low'): void {
    const error = new Error(message);
    this.logError(error, context || {}, severity);
  }

  /**
   * Log booking-specific errors
   */
  logBookingError(
    error: Error,
    step: string,
    component: string,
    additionalContext?: Record<string, any>
  ): void {
    this.logError(
      error,
      {
        component,
        step,
        action: 'booking',
        metadata: additionalContext,
      },
      'high'
    );
  }

  /**
   * Log payment errors (critical)
   */
  logPaymentError(
    error: Error,
    paymentIntentId?: string,
    additionalContext?: Record<string, any>
  ): void {
    this.logError(
      error,
      {
        component: 'PaymentService',
        step: 'payment',
        action: 'process_payment',
        metadata: {
          paymentIntentId,
          ...additionalContext,
        },
      },
      'critical'
    );
  }

  /**
   * Log API errors
   */
  logApiError(
    error: Error,
    endpoint: string,
    method: string,
    additionalContext?: Record<string, any>
  ): void {
    this.logError(
      error,
      {
        component: 'APIService',
        action: `${method} ${endpoint}`,
        metadata: additionalContext,
      },
      'high'
    );
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, email?: string, username?: string): void {
    if (!this.isEnabled) return;

    // In production, set Sentry user context:
    // Sentry.setUser({
    //   id: userId,
    //   email,
    //   username,
    // });

    if (import.meta.env.DEV) {
      console.log('[ErrorLogging] User context set:', { userId, email, username });
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    if (!this.isEnabled) return;

    // In production:
    // Sentry.setUser(null);

    if (import.meta.env.DEV) {
      console.log('[ErrorLogging] User context cleared');
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.isEnabled) return;

    // In production:
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   data,
    //   level: 'info',
    //   timestamp: Date.now() / 1000,
    // });

    if (import.meta.env.DEV) {
      console.log('[ErrorLogging] Breadcrumb:', { message, category, data });
    }
  }

  /**
   * Get all logged errors (for testing)
   */
  getErrors(): ErrorLogEntry[] {
    return [...this.errors];
  }

  /**
   * Clear all logged errors (for testing)
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byComponent: Record<string, number>;
    bySeverity: Record<string, number>;
    byStep: Record<string, number>;
  } {
    const stats = {
      total: this.errors.length,
      byComponent: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStep: {} as Record<string, number>,
    };

    this.errors.forEach((entry) => {
      // Count by component
      if (entry.context.component) {
        stats.byComponent[entry.context.component] =
          (stats.byComponent[entry.context.component] || 0) + 1;
      }

      // Count by severity
      stats.bySeverity[entry.severity] = (stats.bySeverity[entry.severity] || 0) + 1;

      // Count by step
      if (entry.context.step) {
        stats.byStep[entry.context.step] = (stats.byStep[entry.context.step] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Send error to Sentry
   */
  private sendToSentry(errorEntry: ErrorLogEntry): void {
    if (!this.sentryInitialized) return;

    // In production:
    // Sentry.captureException(errorEntry.error, {
    //   tags: {
    //     component: errorEntry.context.component,
    //     step: errorEntry.context.step,
    //     severity: errorEntry.severity,
    //   },
    //   extra: {
    //     ...errorEntry.context.metadata,
    //     userId: errorEntry.context.userId,
    //     hotelId: errorEntry.context.hotelId,
    //     bookingId: errorEntry.context.bookingId,
    //   },
    //   level: this.mapSeverityToSentryLevel(errorEntry.severity),
    // });
  }

  /**
   * Alert for critical errors
   */
  private alertCriticalError(errorEntry: ErrorLogEntry): void {
    // In production, this would trigger alerts via:
    // - Slack webhook
    // - PagerDuty
    // - Email notifications
    // - SMS alerts

    console.error('[CRITICAL ERROR]', {
      message: errorEntry.error.message,
      context: errorEntry.context,
      timestamp: new Date(errorEntry.timestamp).toISOString(),
    });
  }

  /**
   * Map severity to Sentry level
   */
  private mapSeverityToSentryLevel(severity: ErrorLogEntry['severity']): string {
    const mapping = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'fatal',
    };
    return mapping[severity];
  }
}

// Export singleton instance
export const errorLoggingService = new ErrorLoggingService();
export default errorLoggingService;
