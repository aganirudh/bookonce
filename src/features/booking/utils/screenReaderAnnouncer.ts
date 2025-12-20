/**
 * Screen Reader Announcer Utility
 * Provides utilities for announcing dynamic content to screen readers
 */

/**
 * Announce a message to screen readers using ARIA live regions
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Find or create the live region
  let liveRegion = document.getElementById(`aria-live-${priority}`);

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = `aria-live-${priority}`;
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Clear previous message
  liveRegion.textContent = '';

  // Announce new message after a brief delay to ensure screen readers pick it up
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);

  // Clear message after it's been announced
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = '';
    }
  }, 5000);
}

/**
 * Announce loading state
 */
export function announceLoading(message: string = 'Loading'): void {
  announceToScreenReader(`${message}...`, 'polite');
}

/**
 * Announce success
 */
export function announceSuccess(message: string): void {
  announceToScreenReader(message, 'polite');
}

/**
 * Announce error
 */
export function announceError(message: string): void {
  announceToScreenReader(`Error: ${message}`, 'assertive');
}

/**
 * Announce navigation
 */
export function announceNavigation(message: string): void {
  announceToScreenReader(message, 'polite');
}

/**
 * Get descriptive text for booking step
 */
export function getStepDescription(step: string, stepNumber: number, totalSteps: number): string {
  const stepNames: Record<string, string> = {
    dates: 'Select Dates',
    rooms: 'Choose Room',
    'guest-info': 'Guest Information',
    payment: 'Payment',
    processing: 'Processing',
  };

  const stepName = stepNames[step] || step;
  return `Step ${stepNumber} of ${totalSteps}: ${stepName}`;
}

/**
 * Format price for screen readers
 */
export function formatPriceForScreenReader(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);

  // Make it more natural for screen readers
  return formatted.replace('$', 'dollars ').replace('€', 'euros ').replace('£', 'pounds ');
}

/**
 * Format date range for screen readers
 */
export function formatDateRangeForScreenReader(checkIn: Date, checkOut: Date): string {
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const checkInStr = checkIn.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const checkOutStr = checkOut.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `Check-in: ${checkInStr}. Check-out: ${checkOutStr}. ${nights} night${nights > 1 ? 's' : ''}.`;
}
