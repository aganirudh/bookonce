/**
 * BookingModal Component
 * Main booking interface with multi-step flow and progress tracking
 */

import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingStore } from '../stores/bookingStore';
import { useAvailability } from '../hooks/useAvailability';
import { useKeyboardNavigation, useFocusTrap, useFocusRestore } from '../hooks/useKeyboardNavigation';
import { 
  announceToScreenReader, 
  announceLoading, 
  announceSuccess, 
  announceError,
  announceNavigation,
  getStepDescription 
} from '../utils/screenReaderAnnouncer';
import { bookingAPIService } from '../services/BookingAPIService';
import { paymentAPIService } from '../services/PaymentAPIService';
import { analyticsService } from '../services/AnalyticsService';
import { errorLoggingService } from '../services/ErrorLoggingService';
import { DateSelector } from './DateSelector';
import { RoomSelector } from './RoomSelector';
import { GuestInfoForm } from './GuestInfoForm';
import { PricingSummary } from './PricingSummary';
import { PaymentFormWrapper, PaymentFormLoading } from './PaymentFormWrapper';
import type { Hotel, BookingStep, GuestInfo, RoomOption, BookingRequest } from '@/types/booking';

// ============================================================================
// Component Props
// ============================================================================

interface BookingModalProps {
  hotel: Hotel;
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete?: (bookingId: string, guestInfo?: { email: string; firstName?: string; lastName?: string }) => void;
}

// ============================================================================
// Step Configuration
// ============================================================================

const STEPS: { key: BookingStep; label: string; description: string }[] = [
  {
    key: 'dates',
    label: 'Select Dates',
    description: 'Choose your check-in and check-out dates',
  },
  {
    key: 'rooms',
    label: 'Choose Room',
    description: 'Select your preferred room type',
  },
  {
    key: 'guest-info',
    label: 'Guest Info',
    description: 'Provide your contact information',
  },
  {
    key: 'payment',
    label: 'Payment',
    description: 'Complete your booking securely',
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'Confirming your reservation',
  },
];

// ============================================================================
// Component
// ============================================================================

export function BookingModal({
  hotel,
  isOpen,
  onClose,
  onBookingComplete,
}: BookingModalProps) {
  const { user, isAuthenticated } = useAuth();
  const {
    currentBooking,
    startBooking,
    updateBookingStep,
    cancelCurrentBooking,
    setDates,
    selectRoom,
    setGuestInfo,
    setAvailability,
    setPricing,
    error,
    clearError,
  } = useBookingStore();

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [guestBookingEmail, setGuestBookingEmail] = useState<string | null>(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  
  // Refs for accessibility
  const modalRef = useRef<HTMLDivElement>(null);

  // Availability checking hook
  const {
    availability,
    isLoading: isCheckingAvailability,
    error: availabilityError,
    checkAvailability,
  } = useAvailability();

  // Keyboard navigation: Escape to close modal
  useKeyboardNavigation({
    onEscape: () => {
      if (isOpen && currentBooking?.step !== 'processing') {
        handleClose();
      }
    },
    enabled: isOpen,
  });

  // Focus trap within modal
  useFocusTrap(modalRef, isOpen);

  // Restore focus when modal closes
  useFocusRestore(isOpen);

  // Initialize booking when modal opens
  useEffect(() => {
    if (isOpen && !currentBooking) {
      startBooking(hotel);
      // Track booking started
      analyticsService.trackBookingStarted({
        hotelId: hotel.id,
        source: 'hotel_card',
      });
      // Announce to screen readers
      announceToScreenReader(`Booking modal opened for ${hotel.title}. ${getStepDescription('dates', 1, STEPS.length)}`);
    }
  }, [isOpen, hotel, currentBooking, startBooking]);

  // Update availability in store when it changes
  useEffect(() => {
    if (availability) {
      setAvailability(availability);
      // Announce availability results
      if (availability.available && availability.rooms.length > 0) {
        announceSuccess(`${availability.rooms.length} room type${availability.rooms.length > 1 ? 's' : ''} available`);
      } else {
        announceError('No rooms available for selected dates');
      }
    }
  }, [availability, setAvailability]);

  // Handle date selection and trigger availability check
  const handleDateChange = async (checkIn: Date | null, checkOut: Date | null) => {
    if (checkIn && checkOut) {
      setDates(checkIn, checkOut);

      // Track dates selected
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      analyticsService.trackDatesSelected({
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        nights,
      });

      // Announce checking availability
      announceLoading('Checking availability');

      // Check availability
      await checkAvailability({
        hotelId: hotel.id,
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
      });
    }
  };

  // Handle room selection and fetch pricing
  const handleRoomSelect = async (room: RoomOption) => {
    selectRoom(room);

    // Announce room selection
    announceSuccess(`Selected ${room.name}`);

    // Track room selected
    analyticsService.trackRoomSelected({
      roomId: room.id,
      price: room.basePrice,
    });

    // Fetch pricing for selected room
    if (currentBooking?.checkInDate && currentBooking?.checkOutDate) {
      try {
        announceLoading('Loading pricing details');
        const pricing = await bookingAPIService.getPricing(
          hotel.id,
          room.id,
          currentBooking.checkInDate.toISOString().split('T')[0],
          currentBooking.checkOutDate.toISOString().split('T')[0]
        );
        setPricing(pricing);
        announceSuccess('Pricing loaded');
      } catch (err) {
        console.error('Failed to fetch pricing:', err);
        const error = err instanceof Error ? err : new Error('Unknown error');
        analyticsService.trackBookingError({
          step: 'rooms',
          errorType: 'pricing_fetch_failed',
          errorMessage: error.message,
          component: 'BookingModal',
        });
        errorLoggingService.logError(error, {
          component: 'BookingModal',
          step: 'rooms',
          hotelId: hotel.id,
          action: 'fetch_pricing',
        }, 'high');
      }
    }
  };

  // Handle guest info submission
  const handleGuestInfoSubmit = async (info: GuestInfo) => {
    setGuestInfo(info);
    
    // Track guest info completed
    analyticsService.trackGuestInfoCompleted({
      hasAccount: false, // TODO: Check if user is authenticated
    });
    
    // Create payment intent when moving to payment step
    if (currentBooking?.pricing) {
      setIsCreatingPaymentIntent(true);
      announceLoading('Preparing payment form');
      try {
        const paymentIntent = await paymentAPIService.createPaymentIntent(
          Math.round(currentBooking.pricing.total * 100), // Convert to cents
          currentBooking.pricing.currency.toLowerCase(),
          {
            hotelId: hotel.id.toString(),
            hotelName: hotel.title,
            guestEmail: info.email,
            guestName: `${info.firstName} ${info.lastName}`,
          }
        );
        setPaymentClientSecret(paymentIntent.clientSecret);
        updateBookingStep('payment');
        announceSuccess('Payment form ready');
      } catch (err) {
        console.error('Failed to create payment intent:', err);
        const error = err instanceof Error ? err : new Error('Unknown error');
        analyticsService.trackBookingError({
          step: 'guest-info',
          errorType: 'payment_intent_creation_failed',
          errorMessage: error.message,
          component: 'BookingModal',
        });
        errorLoggingService.logPaymentError(error, undefined, {
          hotelId: hotel.id,
          step: 'payment_intent_creation',
        });
        // Show error but still allow proceeding (for demo purposes)
        updateBookingStep('payment');
      } finally {
        setIsCreatingPaymentIntent(false);
      }
    } else {
      updateBookingStep('payment');
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!currentBooking) return;

    // Track payment submitted
    analyticsService.trackPaymentSubmitted({
      paymentMethod: 'card', // TODO: Get actual payment method type
    });

    // Move to processing step
    updateBookingStep('processing');
    announceLoading('Processing your booking');

    const bookingStartTime = Date.now();

    try {
      // Validate all required data
      if (
        !currentBooking.checkInDate ||
        !currentBooking.checkOutDate ||
        !currentBooking.selectedRoom ||
        !currentBooking.guestInfo.firstName ||
        !currentBooking.guestInfo.email
      ) {
        throw new Error('Missing required booking information');
      }

      // Store guest email for account creation offer
      if (!isAuthenticated) {
        setGuestBookingEmail(currentBooking.guestInfo.email);
      }

      // Create booking request
      const bookingRequest: BookingRequest = {
        hotelId: hotel.id,
        roomId: currentBooking.selectedRoom.id,
        checkInDate: currentBooking.checkInDate.toISOString().split('T')[0],
        checkOutDate: currentBooking.checkOutDate.toISOString().split('T')[0],
        guestInfo: currentBooking.guestInfo as GuestInfo,
        paymentMethodId: paymentIntentId,
        specialRequests: currentBooking.guestInfo.specialRequests,
        userId: user?.userId, // Include userId if authenticated
      };

      // Submit booking
      const confirmation = await bookingAPIService.createBooking(bookingRequest);

      // Track booking completed
      const bookingCompletionTime = Date.now() - bookingStartTime;
      analyticsService.trackBookingCompleted({
        bookingId: confirmation.bookingId,
        totalPrice: currentBooking.pricing?.total,
        currency: currentBooking.pricing?.currency,
      });
      analyticsService.trackBookingCompletionTime(bookingCompletionTime);

      // Announce success
      announceSuccess('Booking confirmed successfully');

      // Success - navigate to confirmation page
      if (onBookingComplete) {
        const guestInfo = !isAuthenticated ? {
          email: currentBooking.guestInfo.email,
          firstName: currentBooking.guestInfo.firstName,
          lastName: currentBooking.guestInfo.lastName,
        } : undefined;
        onBookingComplete(confirmation.bookingId, guestInfo);
      }

      // Close modal
      handleClose();
    } catch (err) {
      console.error('Booking submission failed:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      analyticsService.trackBookingError({
        step: 'payment',
        errorType: 'booking_submission_failed',
        errorMessage: error.message,
        component: 'BookingModal',
      });
      errorLoggingService.logBookingError(error, 'payment', 'BookingModal', {
        hotelId: hotel.id,
        paymentIntentId,
      });
      // Announce error
      announceError('Booking failed. Please try again.');
      // Move back to payment step to allow retry
      updateBookingStep('payment');
    }
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    console.error('Payment error:', errorMessage);
    const error = new Error(errorMessage);
    analyticsService.trackBookingError({
      step: 'payment',
      errorType: 'payment_failed',
      errorMessage,
      component: 'BookingModal',
    });
    errorLoggingService.logPaymentError(error, paymentClientSecret || undefined, {
      hotelId: hotel.id,
    });
    // Error is displayed in PaymentForm, no need to do anything here
  };

  // Cleanup on close
  const handleClose = () => {
    cancelCurrentBooking();
    clearError();
    onClose();
  };

  // Get current step index
  const currentStepIndex = STEPS.findIndex(
    (step) => step.key === currentBooking?.step
  );

  // Calculate progress percentage
  const progressPercentage = currentStepIndex >= 0
    ? ((currentStepIndex + 1) / STEPS.length) * 100
    : 0;

  // Step navigation
  const canGoBack = currentStepIndex > 0 && currentBooking?.step !== 'processing';
  const currentStepConfig = STEPS[currentStepIndex];

  const handleBack = () => {
    if (canGoBack && currentStepIndex > 0) {
      const previousStep = STEPS[currentStepIndex - 1];
      updateBookingStep(previousStep.key);
      clearError();
      // Announce navigation
      announceNavigation(getStepDescription(previousStep.key, currentStepIndex, STEPS.length));
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentStepIndex + 1];
      updateBookingStep(nextStep.key);
      clearError();
      // Announce navigation
      announceNavigation(getStepDescription(nextStep.key, currentStepIndex + 2, STEPS.length));
    }
  };

  // Swipe gesture handlers for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe && canGoBack) {
      handleBack();
    } else if (isLeftSwipe && currentStepIndex < STEPS.length - 2) {
      // Don't allow swiping to processing step
      handleNext();
    }
  };

  // Validate current step before proceeding
  const canProceedToNextStep = (): boolean => {
    if (!currentBooking) return false;

    switch (currentBooking.step) {
      case 'dates':
        return !!(currentBooking.checkInDate && currentBooking.checkOutDate);
      case 'rooms':
        return !!currentBooking.selectedRoom;
      case 'guest-info':
        return !!(
          currentBooking.guestInfo.firstName &&
          currentBooking.guestInfo.lastName &&
          currentBooking.guestInfo.email &&
          currentBooking.guestInfo.phone &&
          currentBooking.guestInfo.country
        );
      case 'payment':
        return false; // Payment step handles its own submission
      case 'processing':
        return false; // Processing step is automatic
      default:
        return false;
    }
  };

  // Show loading state while initializing
  if (!currentBooking) {
    console.log('BookingModal: No current booking, showing loading state', { isOpen });
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Initializing Booking</DialogTitle>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Initializing booking...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  console.log('BookingModal: Rendering with booking', { 
    isOpen, 
    step: currentBooking.step,
    hotel: currentBooking.hotel.title 
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        ref={modalRef}
        className={cn(
          // Desktop: large centered modal with flex layout
          'max-w-5xl max-h-[90vh] overflow-hidden p-0 flex flex-col',
          // Mobile: full screen
          'w-full h-full sm:w-auto sm:h-auto',
          'rounded-none sm:rounded-lg',
          // Hide default close button (we have our own in the header)
          '[&>button]:hidden'
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        aria-labelledby="booking-modal-title"
        aria-describedby="booking-modal-description"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <DialogTitle id="booking-modal-title" className="text-xl">
                  {currentStepConfig?.label || 'Booking'}
                </DialogTitle>
                <p id="booking-modal-description" className="text-sm text-muted-foreground mt-1">
                  {currentStepConfig?.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="hidden sm:flex items-center justify-between mt-4 gap-2">
            {STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 text-center',
                    'transition-opacity',
                    isFuture && 'opacity-40'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      'text-xs font-medium transition-colors',
                      isActive && 'bg-primary text-primary-foreground',
                      isCompleted && 'bg-primary/20 text-primary',
                      isFuture && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isActive && 'text-foreground',
                      !isActive && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="px-6 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearError();
                    // Retry logic based on current step
                    if (currentBooking?.step === 'payment' && currentBooking.guestInfo.firstName) {
                      handleGuestInfoSubmit(currentBooking.guestInfo as GuestInfo);
                    }
                  }}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentBooking.step === 'dates' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      When would you like to stay?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select your check-in and check-out dates
                    </p>
                  </div>
                  <DateSelector
                    checkInDate={currentBooking.checkInDate}
                    checkOutDate={currentBooking.checkOutDate}
                    onDateChange={handleDateChange}
                    unavailableDates={[]}
                  />
                  {isCheckingAvailability && (
                    <div className="text-sm text-muted-foreground">
                      Checking availability...
                    </div>
                  )}
                  {availabilityError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{availabilityError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {currentBooking.step === 'rooms' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Choose your room
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select from available room types
                    </p>
                  </div>
                  {currentBooking.availability?.rooms && (
                    <RoomSelector
                      rooms={currentBooking.availability.rooms}
                      selectedRoomId={currentBooking.selectedRoom?.id || null}
                      onRoomSelect={handleRoomSelect}
                      currency={currentBooking.pricing?.currency || 'USD'}
                    />
                  )}
                  {!currentBooking.availability?.rooms && (
                    <div className="text-center py-12 text-muted-foreground">
                      No rooms available. Please select different dates.
                    </div>
                  )}
                </div>
              )}

              {currentBooking.step === 'guest-info' && (
                <GuestInfoForm
                  initialData={currentBooking.guestInfo}
                  onSubmit={handleGuestInfoSubmit}
                  onBack={handleBack}
                />
              )}

              {currentBooking.step === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Complete Your Booking
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your payment details to confirm your reservation
                    </p>
                    {hotel.instantBooking && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Instant Confirmation - Get confirmed within 30 seconds
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hotel</span>
                      <span className="font-medium">{hotel.title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Room</span>
                      <span className="font-medium">{currentBooking.selectedRoom?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dates</span>
                      <span className="font-medium">
                        {currentBooking.checkInDate?.toLocaleDateString()} -{' '}
                        {currentBooking.checkOutDate?.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Guest</span>
                      <span className="font-medium">
                        {currentBooking.guestInfo.firstName} {currentBooking.guestInfo.lastName}
                      </span>
                    </div>
                  </div>

                  {/* Payment Form */}
                  {isCreatingPaymentIntent && <PaymentFormLoading />}
                  {!isCreatingPaymentIntent && paymentClientSecret && currentBooking.pricing && (
                    <PaymentFormWrapper
                      amount={Math.round(currentBooking.pricing.total * 100)}
                      currency={currentBooking.pricing.currency.toLowerCase()}
                      clientSecret={paymentClientSecret}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  )}
                  {!isCreatingPaymentIntent && !paymentClientSecret && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to initialize payment. Please try again or go back to review your booking.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {currentBooking.step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  <h3 className="text-lg font-semibold">Processing your booking</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {hotel.instantBooking 
                      ? 'Instant confirmation in progress...' 
                      : 'Please wait while we confirm your reservation...'}
                  </p>
                  {hotel.instantBooking && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-medium">Instant Booking - Confirmation within 30 seconds</span>
                    </div>
                  )}
                  {!hotel.instantBooking && (
                    <div className="text-xs text-muted-foreground">
                      Estimated confirmation time: 2-5 minutes
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - Pricing Summary */}
            <div className="lg:col-span-1">
              <PricingSummary
                pricing={currentBooking.pricing}
                cancellationPolicy={hotel.cancellationPolicy}
                isLoading={isCheckingAvailability}
                sticky={true}
              />
            </div>
          </div>
        </div>

        {/* Footer - Navigation Buttons */}
        {currentBooking.step !== 'processing' && (
          <div className="border-t px-6 py-4">
            <div className="flex justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                {hotel.title}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {canGoBack && (
                  <Button 
                    variant="outline" 
                    onClick={handleBack}
                    className="flex-1 sm:flex-none min-h-[44px]"
                  >
                    Back
                  </Button>
                )}
                {currentBooking.step !== 'payment' && (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToNextStep()}
                    className="flex-1 sm:flex-none min-h-[44px]"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
