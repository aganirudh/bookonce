/**
 * BookingDetails Component
 * Full booking information display with modification and cancellation options
 */

import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  Globe,
  Clock,
  CreditCard,
  FileText,
  Download,
  Share2,
  Edit,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BookingConfirmation } from '@/types/booking';
import { ModifyBooking } from './ModifyBooking';
import { CancelBooking } from './CancelBooking';

interface BookingDetailsProps {
  booking: BookingConfirmation;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdate?: () => void;
}

export function BookingDetails({ booking, isOpen, onClose, onBookingUpdate }: BookingDetailsProps) {
  const [isModifying, setIsModifying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<BookingConfirmation>(booking);

  const {
    hotel,
    checkInDate,
    checkOutDate,
    status,
    referenceNumber,
    roomDetails,
    guestInfo,
    pricing,
    confirmationSentAt,
  } = currentBooking;

  // Calculate number of nights
  const numberOfNights = differenceInDays(new Date(checkOutDate), new Date(checkInDate));

  // Check if booking can be modified
  const canModify = status === 'confirmed' && new Date(checkInDate) > new Date();

  // Check if booking can be cancelled
  const canCancel = status === 'confirmed' && new Date(checkInDate) > new Date();

  // Check if booking is cancelled
  const isCancelled = status === 'cancelled';

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Handle modify booking
  const handleModify = () => {
    setIsModifying(true);
  };

  // Handle modification complete
  const handleModificationComplete = (updatedBooking: BookingConfirmation) => {
    setCurrentBooking(updatedBooking);
    setIsModifying(false);
    if (onBookingUpdate) {
      onBookingUpdate();
    }
  };

  // Handle cancel booking
  const handleCancel = () => {
    setIsCancelling(true);
  };

  // Handle cancellation complete
  const handleCancellationComplete = () => {
    // Update booking status to cancelled
    setCurrentBooking({
      ...currentBooking,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
    setIsCancelling(false);
    if (onBookingUpdate) {
      onBookingUpdate();
    }
  };

  // Handle re-booking
  const handleRebook = () => {
    // TODO: Implement re-booking flow
    console.log('Re-booking:', currentBooking);
  };

  // Handle download confirmation
  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log('Download confirmation:', booking);
  };

  // Handle share booking
  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share booking:', booking);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Booking Details</DialogTitle>
              <DialogDescription>
                Reference: {referenceNumber}
              </DialogDescription>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Cancelled Alert */}
            {isCancelled && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This booking has been cancelled. You can re-book this hotel if you'd like.
                </AlertDescription>
              </Alert>
            )}

            {/* Hotel Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Hotel Information</h3>
              <div className="flex gap-4">
                <img
                  src={hotel.image}
                  alt={hotel.title}
                  className="w-32 h-32 object-cover rounded-md"
                />
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-xl">{hotel.title}</h4>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{hotel.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      Check-in: {hotel.checkInTime || '15:00'} | Check-out: {hotel.checkOutTime || '11:00'}
                    </span>
                  </div>
                  {hotel.rating && (
                    <div className="flex items-center text-sm">
                      <span className="font-semibold mr-1">★ {hotel.rating}</span>
                      <span className="text-muted-foreground">
                        ({hotel.reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Booking Dates */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Booking Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Check-in</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {format(new Date(checkInDate), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Check-out</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {format(new Date(checkOutDate), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {numberOfNights} night{numberOfNights > 1 ? 's' : ''}
              </div>
            </div>

            <Separator />

            {/* Room Details */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Room Details</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{roomDetails.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {roomDetails.description}
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground mr-2">Capacity:</span>
                  <span>{roomDetails.capacity} guests</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground mr-2">Bed Type:</span>
                  <span>{roomDetails.bedType}</span>
                </div>
                {roomDetails.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {roomDetails.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Guest Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Guest Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">
                    {guestInfo.firstName} {guestInfo.lastName}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{guestInfo.email}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{guestInfo.phone}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Country</div>
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{guestInfo.country}</span>
                  </div>
                </div>
              </div>
              {guestInfo.specialRequests && (
                <div className="mt-4 space-y-1">
                  <div className="text-sm text-muted-foreground">Special Requests</div>
                  <div className="text-sm bg-muted p-3 rounded-md">
                    {guestInfo.specialRequests}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Pricing Breakdown */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Pricing Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${pricing.baseRate.toFixed(2)} × {pricing.numberOfNights} nights
                  </span>
                  <span>${pricing.subtotal.toFixed(2)}</span>
                </div>
                {pricing.taxes.map((tax, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {tax.name} {tax.percentage && `(${tax.percentage}%)`}
                    </span>
                    <span>${tax.amount.toFixed(2)}</span>
                  </div>
                ))}
                {pricing.fees.map((fee, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{fee.name}</span>
                    <span>${fee.amount.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${pricing.total.toFixed(2)} {pricing.currency}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cancellation Policy */}
            {hotel.cancellationPolicy && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Cancellation Policy</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <Badge variant="outline">{hotel.cancellationPolicy.type}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hotel.cancellationPolicy.description}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Details */}
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                <span>
                  Confirmation sent on {format(new Date(confirmationSentAt), 'MMM d, yyyy \'at\' h:mm a')}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          {canModify && (
            <Button variant="outline" onClick={handleModify}>
              <Edit className="h-4 w-4 mr-2" />
              Modify Booking
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancel}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Booking
            </Button>
          )}
          {isCancelled && (
            <Button onClick={handleRebook}>
              <CreditCard className="h-4 w-4 mr-2" />
              Re-book Hotel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Modify Booking Modal */}
    <ModifyBooking
      booking={currentBooking}
      isOpen={isModifying}
      onClose={() => setIsModifying(false)}
      onModificationComplete={handleModificationComplete}
    />

    {/* Cancel Booking Modal */}
    <CancelBooking
      booking={currentBooking}
      isOpen={isCancelling}
      onClose={() => setIsCancelling(false)}
      onCancellationComplete={handleCancellationComplete}
    />
  </>
  );
}
