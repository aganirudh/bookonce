/**
 * BookingDetails Component
 * Full booking information display with modification and cancellation options
 */

import { useState, useEffect } from 'react';
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
  AlertTriangle,
  MessageCircle,
  Shield,
  CloudSun,
  Plane,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BookingConfirmation } from '@/types/booking';
import { ModifyBooking } from './ModifyBooking';
import { CancelBooking } from './CancelBooking';
import { DisruptionRecovery } from './DisruptionRecovery';
import LocalShadowWidget from '@/components/LocalShadowWidget';
import SafetyMesh from '@/components/SafetyMesh';

interface BookingDetailsProps {
  booking: BookingConfirmation;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdate?: () => void;
}

export function BookingDetails({ booking, isOpen, onClose, onBookingUpdate }: BookingDetailsProps) {
  const [isModifying, setIsModifying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showLocalSupport, setShowLocalSupport] = useState(false);
  const [showSafetyMesh, setShowSafetyMesh] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<BookingConfirmation>(booking);
  const [isPushing, setIsPushing] = useState(false);

  const [simulationStep, setSimulationStep] = useState<0 | 1 | 2 | 3>(0);

  // Handle simulated business disruption (Flight Delay)
  const handleSimulateDisruption = () => {
    setIsPushing(true);
    setSimulationStep(1); // Step 1: Detection

    // Step 1: Detect Delay
    toast('⚠️ Flight Delay Detected', {
      description: 'AI-202 is delayed by 4 hours. Assessing impact...',
      duration: 2000,
    });

    setTimeout(() => {
      setSimulationStep(2); // Step 2: Optimization
      // Step 2: Auto-adjustment
      toast.info('🤖 Auto-Optimizing Trip', {
        description: 'Arrival now 18:30. Hotel check-in window notified.',
        duration: 2000,
      });

      // Step 3: Urgent reallocation (Simulated)
      setTimeout(() => {
        setSimulationStep(3); // Step 3: Resolution
        // Update local storage
        const existing = JSON.parse(localStorage.getItem('user_bookings') || '[]');
        const updated = existing.map((b: any) => {
          if (b.id === booking.bookingId || b.id === (booking as any).id) {
            return { ...b, status: 'market_listed', soldTo: 'Auto-Reallocated to Urgent Queue' };
          }
          return b;
        });
        localStorage.setItem('user_bookings', JSON.stringify(updated));

        setIsPushing(false);

        toast.success('⚡ Urgent Match Found', {
          description: 'Room re-allocated to urgent traveler @business_user_01. Full credit applied to your wallet.',
          duration: 5000,
        });

        setTimeout(() => {
          onClose();
          if (onBookingUpdate) onBookingUpdate();
          setSimulationStep(0); // Reset
        }, 1500);

      }, 3000);
    }, 3000);
  };

  const [weather, setWeather] = useState<{ temp: number; description: string } | null>(null);

  // Fetch real weather data
  useEffect(() => {
    // Access hotel from currentBooking directly
    if (currentBooking.hotel.coordinates && currentBooking.hotel.coordinates.length === 2 && currentBooking.hotel.coordinates[0] !== 0) {
      const [lat, lng] = currentBooking.hotel.coordinates;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`)
        .then(res => res.json())
        .then(data => {
          if (!data.current) return;
          const code = data.current.weather_code;
          let description = 'Clear sky';
          if (code > 0 && code <= 3) description = 'Partly cloudy';
          if (code > 3 && code <= 48) description = 'Foggy';
          if (code > 50) description = 'Rainy';

          setWeather({
            temp: Math.round(data.current.temperature_2m),
            description
          });
        })
        .catch(err => console.error('Failed to fetch weather', err));
    }
  }, [currentBooking.hotel.coordinates]);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen]);

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

  // ... rest of logic


  // Calculate number of nights
  const numberOfNights = differenceInDays(new Date(checkOutDate), new Date(checkInDate));

  // Check if booking can be modified (pending or confirmed, and future date)
  const canModify = status === 'confirmed' || status === 'pending';

  // Check if booking can be cancelled (pending or confirmed, and future date)
  const canCancel = status === 'confirmed' || status === 'pending';

  // Check if booking is cancelled
  const isCancelled = status === 'cancelled';

  // Debug log
  console.log('Booking status:', status, 'canModify:', canModify, 'canCancel:', canCancel, 'checkInDate:', checkInDate);

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="default" className="bg-green-500">
            Confirmed
          </Badge>
        );
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

  // Handle disruption recovery
  const handleDisruptionRecovery = () => {
    setIsRecovering(true);
  };

  // Handle recovery complete
  const handleRecoveryComplete = (updatedBooking: BookingConfirmation) => {
    setCurrentBooking(updatedBooking);
    setIsRecovering(false);
    if (onBookingUpdate) {
      onBookingUpdate();
    }
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
        <DialogContent
          className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-lg">Booking Details</DialogTitle>
                <DialogDescription className="text-xs">Reference: {referenceNumber}</DialogDescription>
              </div>
              {getStatusBadge()}
            </div>
          </DialogHeader>

          {/* Simulation Overlay */}
          {simulationStep > 0 && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-xl font-bold">Disruption Detected</h3>
                  <p className="text-muted-foreground">Flight AI-202 Delayed (4h)</p>
                </div>

                <div className="space-y-6">
                  {/* Flow Diagram */}
                  <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gray-200 -z-10" />

                    {/* Step 1: Disruption */}
                    <div className={`flex items-start gap-4 transition-all duration-500 ${simulationStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`mt-1 h-10 w-10 rounded-full flex flex-col items-center justify-center border-2 bg-white z-10 ${simulationStep >= 1 ? 'border-red-500 text-red-500' : 'border-gray-200'}`}>
                        <Plane className="h-5 w-5 transform rotate-45" />
                      </div>
                      <div className={`bg-white p-3 rounded-lg border flex-1 shadow-sm ${simulationStep === 1 ? 'ring-2 ring-red-500/20' : ''}`}>
                        <p className="font-bold text-sm text-red-900">Flight Delayed (4hr)</p>
                        <p className="text-xs text-muted-foreground">Arrival pushed to 18:30. Connection missed.</p>
                      </div>
                    </div>

                    {/* Spacer Arrow */}
                    <div className="h-6" />

                    {/* Step 2: Optimization */}
                    <div className={`flex items-start gap-4 transition-all duration-500 ${simulationStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`mt-1 h-10 w-10 rounded-full flex flex-col items-center justify-center border-2 bg-white z-10 ${simulationStep >= 2 ? 'border-blue-500 text-blue-500' : 'border-gray-200'}`}>
                        <RefreshCw className={`h-5 w-5 ${simulationStep === 2 ? 'animate-spin' : ''}`} />
                      </div>
                      <div className={`bg-white p-3 rounded-lg border flex-1 shadow-sm ${simulationStep === 2 ? 'ring-2 ring-blue-500/20' : ''}`}>
                        <p className="font-bold text-sm text-blue-900">AI Re-Booking</p>
                        <p className="text-xs text-muted-foreground">Original hotel room marked as 'Vacant'.</p>
                      </div>
                    </div>

                    {/* Spacer Arrow */}
                    <div className="h-6" />

                    {/* Step 3: Marketplace */}
                    <div className={`flex items-start gap-4 transition-all duration-500 ${simulationStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`mt-1 h-10 w-10 rounded-full flex flex-col items-center justify-center border-2 bg-white z-10 ${simulationStep >= 3 ? 'border-green-500 text-green-500' : 'border-gray-200'}`}>
                        <Users className="h-5 w-5" />
                      </div>
                      <div className={`bg-white p-3 rounded-lg border flex-1 shadow-sm ${simulationStep === 3 ? 'ring-2 ring-green-500/20' : ''}`}>
                        <p className="font-bold text-sm text-green-900">Urgent Match Found</p>
                        <p className="text-xs text-muted-foreground">@urgent_traveler_01 purchased your room.</p>
                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded w-fit">
                          <span>💰 You saved $120</span>
                          <span>•</span>
                          <span>🏨 Hotel saved revenue</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {simulationStep === 3 && (
                  <div className="text-center animate-in fade-in zoom-in duration-500">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-sm">
                      <Zap className="h-4 w-4 fill-green-800" /> Resolution Actioned
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-4 pr-4 pb-2">
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
                <h3 className="font-semibold text-base mb-2">Hotel Information</h3>
                <div className="flex gap-3">
                  <img
                    src={hotel.image}
                    alt={hotel.title}
                    className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <h4 className="font-semibold text-base truncate">{hotel.title}</h4>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{hotel.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        Check-in: {hotel.checkInTime || '15:00'} | Check-out:{' '}
                        {hotel.checkOutTime || '11:00'}
                      </span>
                    </div>
                    {hotel.rating && (
                      <div className="flex items-center text-sm">
                        <span className="font-semibold mr-1">★ {hotel.rating}</span>
                        <span className="text-muted-foreground">({hotel.reviews} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Live Trip Context */}
              <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" /> Live Trip Context
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CloudSun className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">Weather Forecast</p>
                      <p className="text-sm">{weather ? `${weather.temp}°C, ${weather.description}` : 'Loading...'}</p>
                      <p className="text-[10px] text-muted-foreground">{weather ? 'Live data' : 'Fetching...'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plane className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">Flight Status</p>
                      <p className="text-sm text-green-600">On Time</p>
                      <p className="text-[10px] text-muted-foreground">AI-202 arriving 14:30</p>
                    </div>
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
                  <div className="text-sm text-muted-foreground">{roomDetails.description}</div>
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
                    <span>
                      ${pricing.total.toFixed(2)} {pricing.currency}
                    </span>
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
                    Confirmation sent on{' '}
                    {format(new Date(confirmationSentAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 pt-3 border-t mt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-3 w-3 mr-1" />
                <span className="text-xs">Download</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-3 w-3 mr-1" />
                <span className="text-xs">Share</span>
              </Button>

              {/* Local Support Chat */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocalSupport(true)}
                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                <span className="text-xs">Local Support</span>
              </Button>

              {/* Safety Mesh */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSafetyMesh(true)}
                className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <Shield className="h-3 w-3 mr-1" />
                <span className="text-xs">Safety Mesh</span>
              </Button>

              {canModify && (
                <Button variant="outline" size="sm" onClick={handleModify}>
                  <Edit className="h-3 w-3 mr-1" />
                  <span className="text-xs">Modify</span>
                </Button>
              )}

              {/* Simulation Mode: Trigger Disruption */}
              {!isCancelled && !isPushing && (
                <Button
                  onClick={handleSimulateDisruption}
                  className="col-span-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 border-0"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span className="text-xs">
                    Simulate Flight Delay (Demo)
                  </span>
                </Button>
              )}
              {isPushing && (
                <Button disabled className="col-span-2">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  <span className="text-xs">AI Optimizing Trip...</span>
                </Button>
              )}

              {canModify && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisruptionRecovery}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span className="text-xs">Report Issue</span>
                </Button>
              )}
              {canCancel && (
                <Button variant="destructive" size="sm" onClick={handleCancel} className="col-span-2">
                  <XCircle className="h-3 w-3 mr-1" />
                  <span className="text-xs">Cancel Booking</span>
                </Button>
              )}
              {isCancelled && (
                <Button onClick={handleRebook} size="sm" className="col-span-2">
                  <CreditCard className="h-3 w-3 mr-1" />
                  <span className="text-xs">Re-book Hotel</span>
                </Button>
              )}
            </div>
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

      {/* Disruption Recovery Modal */}
      <DisruptionRecovery
        booking={currentBooking}
        isOpen={isRecovering}
        onClose={() => setIsRecovering(false)}
        onRecoveryComplete={handleRecoveryComplete}
      />

      {/* Local Support Chat */}
      {showLocalSupport && <LocalShadowWidget />}

      {/* Safety Mesh */}
      <SafetyMesh
        isOpen={showSafetyMesh}
        onClose={() => setShowSafetyMesh(false)}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
      />
    </>
  );
}
