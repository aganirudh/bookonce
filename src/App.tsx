import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { lazy, Suspense, useEffect } from 'react'; // Added useEffect here
import '@/features/booking/styles/accessibility.css';
import 'leaflet/dist/leaflet.css';
import { BookOnceAIChatModal } from '@/components/BookOnceAIChatModal';

// Lenis Imports
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Lazy load pages for code splitting
const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth'));
const Stays = lazy(() => import('./pages/Stays'));
const TravelUtilities = lazy(() => import('./pages/TravelUtilities'));
const JourneyPlanner = lazy(() => import('./pages/JourneyPlanner'));
const RoutePlanning = lazy(() => import('./pages/RoutePlanning'));
const QRPayment = lazy(() => import('./pages/QRPayment'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const BookingHistory = lazy(() => import('./pages/BookingHistory'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

const App = () => {
  // --- LENIS SMOOTH SCROLL SETUP ---
  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis();

    // Listen for the scroll event (optional, useful for debugging)
    lenis.on('scroll', e => {
      // You can remove this console log if it gets annoying
      // console.log(e);
    });

    // Use requestAnimationFrame to continuously update the scroll
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup function to prevent memory leaks if App unmounts
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            {/* Skip to main content link for keyboard navigation */}
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>

            <Toaster />
            <Sonner />
            <BookOnceAIChatModal />

            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <main id="main-content">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/stays" element={<Stays />} />
                    <Route path="/utilities" element={<TravelUtilities />} />
                    <Route path="/journey" element={<JourneyPlanner />} />
                    <Route path="/journey/plan" element={<RoutePlanning />} />
                    <Route path="/qr-payment" element={<QRPayment />} />
                    <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
                    <Route path="/booking-history" element={<BookingHistory />} />

                    {/* Protected Routes - Require Authentication */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <UserProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/bookings"
                      element={
                        <ProtectedRoute>
                          <BookingHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
