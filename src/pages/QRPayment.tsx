import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

/**
 * QR Payment Demo Page
 * Displays a demo QR code for payment simulation
 * After 3 seconds, auto-confirms and redirects to dashboard
 */
export default function QRPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Get payment details from URL params
  const amount = searchParams.get('amount') || '0';
  const description = searchParams.get('description') || 'Payment';
  const type = searchParams.get('type') || 'booking'; // 'booking' or 'journey'

  // Auto-confirm payment after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsProcessing(true);

      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentComplete(true);

        // Confirm pending booking
        const pending = localStorage.getItem('pendingBooking');
        if (pending) {
          const booking = JSON.parse(pending);
          booking.status = 'confirmed';

          // Add to permanent bookings list
          const existing = JSON.parse(localStorage.getItem('user_bookings') || '[]');
          localStorage.setItem('user_bookings', JSON.stringify([booking, ...existing]));

          // Clean up pending
          localStorage.removeItem('pendingBooking');
        }

        // Clear pending data
        if (type === 'booking') {
          sessionStorage.removeItem('pendingBooking');
        } else if (type === 'journey') {
          sessionStorage.removeItem('pendingJourney');
        }

        // Show success notification
        toast.success('🎉 Booking Confirmed!', {
          description: 'Check My Bookings to view your reservation',
          duration: 4000,
        });

        setTimeout(() => {
          navigate('/booking-history?newBooking=true');
        }, 2000);
      }, 1500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, type]);

  // QR code data
  const qrData = JSON.stringify({
    amount,
    description,
    type,
    timestamp: new Date().toISOString(),
    demoPayment: true,
  });

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground text-center mb-4">
              Redirecting to your bookings...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold text-center mb-2">Processing Payment...</h2>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we confirm your payment
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Scan to Pay</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <QRCodeSVG
              value={qrData}
              size={250}
              level="H"
              includeMargin
              className="mx-auto"
            />
          </div>

          {/* Payment Details */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold text-primary">₹{amount}</span>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-base">{description}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="w-full space-y-3 border-t pt-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Demo Payment</p>
                <p className="text-xs text-muted-foreground">
                  This is a demonstration. Payment will be auto-confirmed in a few seconds.
                </p>
              </div>
            </div>
          </div>

          {/* Manual Confirm Button (optional) */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/booking-history')}
          >
            Cancel Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
