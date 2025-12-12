/**
 * CancelBooking Component
 * Handle booking cancellation with policy enforcement
 */

import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { XCircle, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { BookingConfirmation, CancellationRule } from '@/types/booking';

interface CancelBookingProps {
  booking: BookingConfirmation;
  isOpen: boolean;
  onClose: () => void;
  onCancellationComplete: () => void;
}

const CANCELLATION_REASONS = [
  'Change of plans',
  'Found alternative accommodation',
  'Travel dates changed',
  'Emergency situation',
  'Price concerns',
  'Other',
];

export function CancelBooking({
  booking,
  isOpen,
  onClose,
  onCancellationComplete,
}: CancelBookingProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { hotel, checkInDate, pricing, referenceNumber } = booking;

  // Calculate days until check-in
  const daysUntilCheckIn = differenceInDays(new Date(checkInDate), new Date());

  // Calculate refund amount based on cancellation policy
  const calculateRefund = (): { amount: number; percentage: number; fee: number } => {
    if (!hotel.cancellationPolicy) {
      return { amount: 0, percentage: 0, fee: 0 };
    }

    // Find applicable rule based on days until check-in
    const applicableRule = hotel.cancellationPolicy.rules
      .sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
      .find((rule) => daysUntilCheckIn >= rule.daysBeforeCheckIn);

    if (!applicableRule) {
      // No rule found, use the most restrictive (0 days)
      const mostRestrictive = hotel.cancellationPolicy.rules.find(
        (rule) => rule.daysBeforeCheckIn === 0
      );
      const percentage = mostRestrictive?.refundPercentage || 0;
      const fee = mostRestrictive?.fee || 0;
      const amount = (pricing.total * percentage) / 100 - fee;
      return { amount: Math.max(0, amount), percentage, fee };
    }

    const percentage = applicableRule.refundPercentage;
    const fee = applicableRule.fee || 0;
    const amount = (pricing.total * percentage) / 100 - fee;

    return { amount: Math.max(0, amount), percentage, fee };
  };

  const refundDetails = calculateRefund();

  // Get policy description for current timing
  const getPolicyDescription = (): string => {
    if (!hotel.cancellationPolicy) {
      return 'No cancellation policy available';
    }

    const { type, description } = hotel.cancellationPolicy;
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Policy: ${description}`;
  };

  // Handle cancellation submission
  const handleSubmit = () => {
    if (!selectedReason) {
      return;
    }
    setShowConfirmation(true);
  };

  // Handle final confirmation
  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      // Import booking API service
      const { bookingAPIService } = await import('../services/BookingAPIService');

      // Call API to cancel booking
      // Note: In a real implementation, we would need to pass the paymentIntentId
      // For now, we'll pass undefined and the service will handle it gracefully
      await bookingAPIService.cancelBooking(
        booking.bookingId,
        selectedReason,
        undefined // paymentIntentId would come from booking data in production
      );

      onCancellationComplete();
      onClose();
    } catch (error) {
      console.error('Cancellation failed:', error);
      // Show error to user
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to cancel booking. Please try again or contact support.'
      );
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      setShowConfirmation(false);
      setSelectedReason('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Review the cancellation policy and refund details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{hotel.title}</h3>
                <p className="text-sm text-muted-foreground">{hotel.location}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Reference</div>
                <div className="font-mono text-sm">{referenceNumber}</div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(checkInDate), 'MMM d, yyyy')} - {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Total Paid:</span>{' '}
              <span className="font-semibold">
                ${pricing.total.toFixed(2)} {pricing.currency}
              </span>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div>
            <h3 className="font-semibold mb-2">Cancellation Policy</h3>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{getPolicyDescription()}</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-1">
                  {hotel.cancellationPolicy?.rules
                    .sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
                    .map((rule: CancellationRule, index: number) => (
                      <div key={index} className="text-sm">
                        • {rule.daysBeforeCheckIn > 0 ? (
                          <>
                            {rule.daysBeforeCheckIn}+ days before check-in: {rule.refundPercentage}% refund
                            {rule.fee && ` (minus $${rule.fee} fee)`}
                          </>
                        ) : (
                          <>
                            Less than 1 day before check-in: {rule.refundPercentage}% refund
                            {rule.fee && ` (minus $${rule.fee} fee)`}
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Refund Calculation */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Refund Calculation</h3>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days until check-in:</span>
                <span className="font-medium">{daysUntilCheckIn} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original amount:</span>
                <span>${pricing.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refund percentage:</span>
                <span>{refundDetails.percentage}%</span>
              </div>
              {refundDetails.fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancellation fee:</span>
                  <span className="text-destructive">-${refundDetails.fee.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Refund amount:</span>
                <span className={refundDetails.amount > 0 ? 'text-green-600' : 'text-destructive'}>
                  ${refundDetails.amount.toFixed(2)} {pricing.currency}
                </span>
              </div>
            </div>
            {refundDetails.amount === 0 && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This booking is non-refundable based on the cancellation policy and timing.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Reason Selection */}
          {!showConfirmation && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for cancellation *</Label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Final Confirmation Warning */}
          {showConfirmation && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Are you absolutely sure?</AlertTitle>
              <AlertDescription>
                This action cannot be undone. Your booking will be cancelled and you will receive a
                refund of ${refundDetails.amount.toFixed(2)} {pricing.currency} within 5-10 business days.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!showConfirmation ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Go Back
              </Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
