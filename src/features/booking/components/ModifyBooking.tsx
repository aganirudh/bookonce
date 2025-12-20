/**
 * ModifyBooking Component
 * Allows users to modify booking dates or room type
 */

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Calendar, AlertCircle, DollarSign, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateSelector } from './DateSelector';
import { RoomSelector } from './RoomSelector';
import type {
  BookingConfirmation,
  RoomOption,
  AvailabilityResponse,
  PricingDetails,
} from '@/types/booking';
import { bookingAPIService } from '../services/BookingAPIService';
import { paymentAPIService } from '../services/PaymentAPIService';
import { notificationService } from '../services/NotificationService';
import { useAvailability } from '../hooks/useAvailability';

interface ModifyBookingProps {
  booking: BookingConfirmation;
  isOpen: boolean;
  onClose: () => void;
  onModificationComplete: (updatedBooking: BookingConfirmation) => void;
}

type ModificationStep = 'select' | 'review' | 'processing';

export function ModifyBooking({
  booking,
  isOpen,
  onClose,
  onModificationComplete,
}: ModifyBookingProps) {
  const [step, setStep] = useState<ModificationStep>('select');
  const [modificationType, setModificationType] = useState<'dates' | 'room' | null>(null);

  // New booking details
  const [newCheckInDate, setNewCheckInDate] = useState<Date | null>(null);
  const [newCheckOutDate, setNewCheckOutDate] = useState<Date | null>(null);
  const [newRoom, setNewRoom] = useState<RoomOption | null>(null);

  // Pricing and availability
  const [newPricing, setNewPricing] = useState<PricingDetails | null>(null);
  const [priceDifference, setPriceDifference] = useState<number>(0);
  const [modificationFee] = useState<number>(0); // Could be dynamic based on policy

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use availability hook for checking new dates
  const {
    availability,
    isLoading: isCheckingAvailability,
    error: availabilityError,
    checkAvailability,
  } = useAvailability();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setModificationType(null);
      setNewCheckInDate(null);
      setNewCheckOutDate(null);
      setNewRoom(null);
      setNewPricing(null);
      setPriceDifference(0);
      setError(null);
    }
  }, [isOpen]);

  // Calculate new pricing when dates or room changes
  useEffect(() => {
    const calculateNewPricing = async () => {
      if (!modificationType) return;

      try {
        setIsLoading(true);
        setError(null);

        let checkIn: string;
        let checkOut: string;
        let roomId: string;

        if (modificationType === 'dates') {
          if (!newCheckInDate || !newCheckOutDate) return;
          checkIn = format(newCheckInDate, 'yyyy-MM-dd');
          checkOut = format(newCheckOutDate, 'yyyy-MM-dd');
          roomId = booking.roomDetails.id;
        } else {
          // Room modification
          if (!newRoom) return;
          checkIn = booking.checkInDate;
          checkOut = booking.checkOutDate;
          roomId = newRoom.id;
        }

        const pricing = await bookingAPIService.getPricing(
          booking.hotel.id,
          roomId,
          checkIn,
          checkOut
        );

        setNewPricing(pricing);

        // Calculate price difference
        const difference = pricing.total - booking.pricing.total + modificationFee;
        setPriceDifference(difference);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate new pricing');
      } finally {
        setIsLoading(false);
      }
    };

    if (step === 'review') {
      calculateNewPricing();
    }
  }, [step, modificationType, newCheckInDate, newCheckOutDate, newRoom, booking, modificationFee]);

  // Handle date modification
  const handleDateModification = () => {
    setModificationType('dates');
    setStep('select');
  };

  // Handle room modification
  const handleRoomModification = async () => {
    setModificationType('room');
    setStep('select');

    // Check availability for current dates to get room options
    await checkAvailability({
      hotelId: booking.hotel.id,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
    });
  };

  // Handle date selection
  const handleDateSelect = async (checkIn: Date, checkOut: Date) => {
    setNewCheckInDate(checkIn);
    setNewCheckOutDate(checkOut);

    // Check availability for new dates
    await checkAvailability({
      hotelId: booking.hotel.id,
      checkInDate: format(checkIn, 'yyyy-MM-dd'),
      checkOutDate: format(checkOut, 'yyyy-MM-dd'),
    });
  };

  // Handle room selection
  const handleRoomSelect = (room: RoomOption) => {
    setNewRoom(room);
  };

  // Handle continue to review
  const handleContinueToReview = () => {
    if (modificationType === 'dates' && (!newCheckInDate || !newCheckOutDate)) {
      setError('Please select new dates');
      return;
    }
    if (modificationType === 'room' && !newRoom) {
      setError('Please select a new room');
      return;
    }
    setStep('review');
  };

  // Handle back to selection
  const handleBackToSelection = () => {
    setStep('select');
    setError(null);
  };

  // Handle confirm modification
  const handleConfirmModification = async () => {
    try {
      setStep('processing');
      setIsLoading(true);
      setError(null);

      // Handle payment if price increased
      if (priceDifference > 0) {
        // Create payment intent for the difference
        const paymentIntent = await paymentAPIService.createPaymentIntent(
          Math.round(priceDifference * 100), // Convert to cents
          booking.pricing.currency.toLowerCase(),
          {
            bookingId: booking.bookingId,
            type: 'modification',
            userId: booking.guestInfo.email,
          }
        );

        // In a real implementation, we would collect payment method here
        // For now, we'll use a mock payment method ID
        const mockPaymentMethodId = 'pm_mock_modification';

        // Confirm payment
        const paymentConfirmation = await paymentAPIService.confirmPayment(
          paymentIntent.id,
          mockPaymentMethodId
        );

        if (paymentConfirmation.status !== 'succeeded') {
          throw new Error('Payment failed. Please try again.');
        }
      }

      // Handle refund if price decreased
      if (priceDifference < 0) {
        // In a real implementation, we would process refund here
        // This would use the original payment intent ID
        const mockOriginalPaymentIntentId = 'pi_mock_original';

        await paymentAPIService.processRefund(
          mockOriginalPaymentIntentId,
          Math.round(Math.abs(priceDifference) * 100), // Convert to cents
          'Booking modification - price decrease'
        );
      }

      // Prepare modification request
      const modifications: any = {};

      if (modificationType === 'dates') {
        modifications.checkInDate = format(newCheckInDate!, 'yyyy-MM-dd');
        modifications.checkOutDate = format(newCheckOutDate!, 'yyyy-MM-dd');
      } else if (modificationType === 'room') {
        modifications.roomId = newRoom!.id;
      }

      // Call API to modify booking
      const updatedBooking = await bookingAPIService.modifyBooking(
        booking.bookingId,
        modifications
      );

      // Send modification confirmation email
      try {
        await notificationService.sendModificationConfirmation(
          updatedBooking,
          updatedBooking.guestInfo.email
        );
      } catch (emailError) {
        // Don't fail the modification if email fails
        console.error('Failed to send modification confirmation email:', emailError);
      }

      // Notify parent component
      onModificationComplete(updatedBooking);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to modify booking');
      setStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  // Render modification type selection
  const renderModificationTypeSelection = () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Select what you'd like to modify. Changes may affect the total price.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        <Button
          variant="outline"
          className="h-auto p-6 justify-start"
          onClick={handleDateModification}
        >
          <div className="flex items-start gap-4 text-left">
            <Calendar className="h-6 w-6 mt-1" />
            <div>
              <div className="font-semibold mb-1">Change Dates</div>
              <div className="text-sm text-muted-foreground">
                Current: {format(new Date(booking.checkInDate), 'MMM d')} -{' '}
                {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-6 justify-start"
          onClick={handleRoomModification}
        >
          <div className="flex items-start gap-4 text-left">
            <DollarSign className="h-6 w-6 mt-1" />
            <div>
              <div className="font-semibold mb-1">Change Room Type</div>
              <div className="text-sm text-muted-foreground">
                Current: {booking.roomDetails.name}
              </div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );

  // Render date selection
  const renderDateSelection = () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Select your new check-in and check-out dates. We'll check availability and calculate the
          new price.
        </AlertDescription>
      </Alert>

      <div>
        <h4 className="font-semibold mb-2">Current Dates</h4>
        <div className="text-sm text-muted-foreground">
          {format(new Date(booking.checkInDate), 'EEEE, MMMM d, yyyy')} -{' '}
          {format(new Date(booking.checkOutDate), 'EEEE, MMMM d, yyyy')}
          <span className="ml-2">
            ({differenceInDays(new Date(booking.checkOutDate), new Date(booking.checkInDate))}{' '}
            nights)
          </span>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-semibold mb-3">Select New Dates</h4>
        <DateSelector
          checkInDate={newCheckInDate}
          checkOutDate={newCheckOutDate}
          onDateChange={(checkIn, checkOut) => {
            if (checkIn && checkOut) {
              handleDateSelect(checkIn, checkOut);
            }
          }}
        />
      </div>

      {availabilityError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{availabilityError}</AlertDescription>
        </Alert>
      )}

      {availability && !availability.available && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The hotel is not available for the selected dates. Please choose different dates.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Render room selection
  const renderRoomSelection = () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Select a new room type. The price will be adjusted based on your selection.
        </AlertDescription>
      </Alert>

      <div>
        <h4 className="font-semibold mb-2">Current Room</h4>
        <div className="text-sm">
          <div className="font-medium">{booking.roomDetails.name}</div>
          <div className="text-muted-foreground">{booking.roomDetails.description}</div>
          <div className="text-muted-foreground mt-1">${booking.roomDetails.basePrice}/night</div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-semibold mb-3">Select New Room</h4>
        {isCheckingAvailability ? (
          <div className="text-center py-8 text-muted-foreground">Loading available rooms...</div>
        ) : availability && availability.rooms.length > 0 ? (
          <RoomSelector
            rooms={availability.rooms}
            selectedRoomId={newRoom?.id || null}
            onRoomSelect={handleRoomSelect}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No rooms available. Please try different dates.
          </div>
        )}
      </div>
    </div>
  );

  // Render review and confirmation
  const renderReview = () => {
    if (!newPricing) {
      return (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Calculating new pricing...</div>
        </div>
      );
    }

    const isIncrease = priceDifference > 0;
    const isDecrease = priceDifference < 0;

    return (
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Review your changes before confirming.{' '}
              {isIncrease && 'You will be charged the difference.'}
              {isDecrease && 'You will receive a refund for the difference.'}
            </AlertDescription>
          </Alert>

          {/* Changes Summary */}
          <div>
            <h4 className="font-semibold mb-3">Changes Summary</h4>
            <div className="space-y-2 text-sm">
              {modificationType === 'dates' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Dates:</span>
                    <span>
                      {format(new Date(booking.checkInDate), 'MMM d')} -{' '}
                      {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>New Dates:</span>
                    <span>
                      {format(newCheckInDate!, 'MMM d')} - {format(newCheckOutDate!, 'MMM d, yyyy')}
                    </span>
                  </div>
                </>
              )}
              {modificationType === 'room' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Room:</span>
                    <span>{booking.roomDetails.name}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>New Room:</span>
                    <span>{newRoom!.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing Comparison */}
          <div>
            <h4 className="font-semibold mb-3">Pricing Comparison</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Total:</span>
                <span>${booking.pricing.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Total:</span>
                <span>${newPricing.total.toFixed(2)}</span>
              </div>
              {modificationFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modification Fee:</span>
                  <span>${modificationFee.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div
                className={`flex justify-between font-semibold text-base ${
                  isIncrease ? 'text-red-600' : isDecrease ? 'text-green-600' : ''
                }`}
              >
                <span>
                  {isIncrease && 'Additional Payment:'}
                  {isDecrease && 'Refund Amount:'}
                  {!isIncrease && !isDecrease && 'Price Difference:'}
                </span>
                <span>
                  {isIncrease && '+'}${Math.abs(priceDifference).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* New Pricing Breakdown */}
          <div>
            <h4 className="font-semibold mb-3">New Pricing Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  ${newPricing.baseRate.toFixed(2)} × {newPricing.numberOfNights} nights
                </span>
                <span>${newPricing.subtotal.toFixed(2)}</span>
              </div>
              {newPricing.taxes.map((tax, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {tax.name} {tax.percentage && `(${tax.percentage}%)`}
                  </span>
                  <span>${tax.amount.toFixed(2)}</span>
                </div>
              ))}
              {newPricing.fees.map((fee, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{fee.name}</span>
                  <span>${fee.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  };

  // Render processing state
  const renderProcessing = () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <div className="text-lg font-semibold">Processing Modification...</div>
      <div className="text-sm text-muted-foreground mt-2">
        Please wait while we update your booking
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modify Booking</DialogTitle>
          <DialogDescription>Reference: {booking.referenceNumber}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'select' && !modificationType && renderModificationTypeSelection()}
        {step === 'select' && modificationType === 'dates' && renderDateSelection()}
        {step === 'select' && modificationType === 'room' && renderRoomSelection()}
        {step === 'review' && renderReview()}
        {step === 'processing' && renderProcessing()}

        <DialogFooter>
          {step === 'select' && !modificationType && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          {step === 'select' && modificationType && (
            <>
              <Button variant="outline" onClick={() => setModificationType(null)}>
                Back
              </Button>
              <Button
                onClick={handleContinueToReview}
                disabled={
                  isLoading ||
                  isCheckingAvailability ||
                  (modificationType === 'dates' &&
                    (!newCheckInDate || !newCheckOutDate || !availability?.available)) ||
                  (modificationType === 'room' && !newRoom)
                }
              >
                Continue to Review
              </Button>
            </>
          )}
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={handleBackToSelection} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleConfirmModification} disabled={isLoading}>
                Confirm Modification
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
