/**
 * BookingConfirmation Page Component
 * Displays booking confirmation with animated success state
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Download,
  Calendar,
  Share2,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { bookingAPIService } from '@/features/booking/services/BookingAPIService';
import { CreateAccountDialog } from '@/features/booking/components/CreateAccountDialog';
import {
  downloadPDFConfirmation,
  addToCalendar,
  addToGoogleCalendar,
  shareBooking,
  getDirectionsUrl,
} from '@/features/booking/utils/confirmationActions';
import type { BookingConfirmation as BookingConfirmationType } from '@/types/booking';

/**
 * BookingConfirmation Page Component
 */
export default function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [confettiShown, setConfettiShown] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  // Get guest booking info from location state
  const guestEmail = location.state?.guestEmail;
  const guestFirstName = location.state?.guestFirstName;
  const guestLastName = location.state?.guestLastName;

  // Fetch booking details
  const {
    data: booking,
    isLoading,
    error,
  } = useQuery<BookingConfirmationType>({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingAPIService.getBooking(bookingId!),
    enabled: !!bookingId,
    retry: 2,
  });

  // Trigger confetti animation on successful load
  useEffect(() => {
    if (booking && !confettiShown) {
      // Fire confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      setConfettiShown(true);

      // Show create account dialog for guest users after confetti
      if (!isAuthenticated && guestEmail) {
        setTimeout(() => {
          setShowCreateAccount(true);
        }, 3500); // Show after confetti animation
      }
    }
  }, [booking, confettiShown, isAuthenticated, guestEmail]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading your booking details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
            <p className="text-muted-foreground text-center mb-6">
              We couldn't find the booking you're looking for. Please check your booking reference
              or contact support.
            </p>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format dates
  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);
  const numberOfNights = booking.pricing.numberOfNights;

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Your reservation has been successfully confirmed
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Details</CardTitle>
              <Badge variant={getStatusVariant(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reference Number */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-primary">{booking.referenceNumber}</p>
            </div>

            <Separator />

            {/* Hotel Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Hotel Information</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <img
                    src={booking.hotel.image}
                    alt={booking.hotel.title}
                    className="w-24 h-24 rounded-lg object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold text-lg">{booking.hotel.title}</p>
                    <p className="text-muted-foreground">{booking.hotel.location}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 text-sm">
                        {booking.hotel.rating} ({booking.hotel.reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stay Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Stay Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-semibold">{format(checkInDate, 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.hotel.checkInTime || '3:00 PM'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-semibold">{format(checkOutDate, 'EEEE, MMMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.hotel.checkOutTime || '11:00 AM'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {numberOfNights} {numberOfNights === 1 ? 'night' : 'nights'}
              </p>
            </div>

            <Separator />

            {/* Room Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Room Details</h3>
              <div className="space-y-2">
                <p className="font-semibold">{booking.roomDetails.name}</p>
                <p className="text-sm text-muted-foreground">{booking.roomDetails.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{booking.roomDetails.bedType}</Badge>
                  <Badge variant="outline">
                    {booking.roomDetails.capacity}{' '}
                    {booking.roomDetails.capacity === 1 ? 'guest' : 'guests'}
                  </Badge>
                  <Badge variant="outline">{booking.roomDetails.size}m²</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Guest Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Guest Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {booking.guestInfo.firstName} {booking.guestInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{booking.guestInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{booking.guestInfo.phone}</p>
                </div>
                {booking.guestInfo.specialRequests && (
                  <div>
                    <p className="text-sm text-muted-foreground">Special Requests</p>
                    <p className="font-medium">{booking.guestInfo.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Pricing Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Pricing Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    ${booking.pricing.baseRate} × {numberOfNights}{' '}
                    {numberOfNights === 1 ? 'night' : 'nights'}
                  </span>
                  <span className="font-medium">${booking.pricing.subtotal.toFixed(2)}</span>
                </div>
                {booking.pricing.taxes.map((tax, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {tax.name} {tax.percentage && `(${tax.percentage}%)`}
                    </span>
                    <span className="font-medium">${tax.amount.toFixed(2)}</span>
                  </div>
                ))}
                {booking.pricing.fees.map((fee, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">{fee.name}</span>
                    <span className="font-medium">${fee.amount.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    ${booking.pricing.total.toFixed(2)} {booking.pricing.currency}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code and Hotel Contact Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* QR Code for Mobile Check-in */}
          <Card>
            <CardHeader>
              <CardTitle>Mobile Check-in</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <QRCodeSVG
                value={JSON.stringify({
                  bookingId: booking.bookingId,
                  referenceNumber: booking.referenceNumber,
                  guestName: `${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`,
                  checkInDate: booking.checkInDate,
                })}
                size={200}
                level="H"
                includeMargin
              />
              <p className="text-sm text-muted-foreground text-center mt-4">
                Show this QR code at the hotel for quick check-in
              </p>
            </CardContent>
          </Card>

          {/* Hotel Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Hotel Contact & Directions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{booking.hotel.location}</p>
                  </div>
                </div>
                {/* Placeholder contact info - would come from hotel data in production */}
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">info@hotel.com</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => window.open(getDirectionsUrl(booking), '_blank')}
                variant="outline"
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => downloadPDFConfirmation(booking)} variant="default">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addToGoogleCalendar(booking)}>
                Google Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addToCalendar(booking)}>
                iCal / Outlook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => shareBooking(booking)} variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share Booking
          </Button>

          <Button onClick={() => navigate('/')} variant="outline">
            Return to Home
          </Button>
        </div>

        {/* Confirmation Email Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to{' '}
            <span className="font-medium">{booking.guestInfo.email}</span>
          </p>
        </div>
      </div>

      {/* Create Account Dialog for Guest Users */}
      {!isAuthenticated && guestEmail && (
        <CreateAccountDialog
          isOpen={showCreateAccount}
          onClose={() => setShowCreateAccount(false)}
          email={guestEmail}
          firstName={guestFirstName}
          lastName={guestLastName}
        />
      )}
    </div>
  );
}
