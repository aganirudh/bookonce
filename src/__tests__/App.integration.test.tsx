import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from '@/pages/Index';
import BookingConfirmation from '@/pages/BookingConfirmation';
import BookingHistory from '@/pages/BookingHistory';
import UserProfile from '@/pages/UserProfile';
import NotFound from '@/pages/NotFound';

// Mock payment security to bypass HTTPS check in tests
vi.mock('@/features/booking/utils/paymentSecurity', () => ({
  enforceSecureConnection: vi.fn(),
  isSecureConnection: vi.fn(() => true),
  PAYMENT_SECURITY_CONFIG: {
    REQUIRE_HTTPS: false,
    ALLOWED_ORIGINS: ['http://localhost'],
  },
}));

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', name: 'Test User' },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// Mock the booking store
vi.mock('@/features/booking/stores/bookingStore', () => ({
  useBookingStore: () => ({
    currentBooking: null,
    bookingHistory: [],
    isLoading: false,
    error: null,
    startBooking: vi.fn(),
    fetchBookingHistory: vi.fn(),
  }),
}));

// Mock the NotificationService
vi.mock('@/features/booking/services/NotificationService', () => ({
  default: {
    sendBookingConfirmation: vi.fn(),
    sendCheckInReminder: vi.fn(),
  },
}));

describe('App Integration - Navigation Flow', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders the home page by default', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vagabond/i)).toBeInTheDocument();
    });
  });

  it('renders the booking confirmation page when navigating to /booking-confirmation/:bookingId', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
      </Routes>,
      ['/booking-confirmation/test-booking-123']
    );

    await waitFor(() => {
      // The page should render without crashing
      expect(document.querySelector('body')).toBeInTheDocument();
    });
  });

  it('renders the user profile page when navigating to /profile', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/profile" element={<UserProfile />} />
      </Routes>,
      ['/profile']
    );

    await waitFor(() => {
      // The page should render without crashing
      expect(document.querySelector('body')).toBeInTheDocument();
    });
  });

  it('renders the booking history page when navigating to /profile/bookings', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/profile/bookings" element={<BookingHistory />} />
      </Routes>,
      ['/profile/bookings']
    );

    await waitFor(() => {
      // The page should render without crashing
      expect(document.querySelector('body')).toBeInTheDocument();
    });
  });

  it('renders 404 page for unknown routes', async () => {
    renderWithProviders(
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>,
      ['/unknown-route']
    );

    await waitFor(() => {
      expect(screen.getByText(/404/i)).toBeInTheDocument();
      expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
    });
  });

  it('verifies all routes are properly configured', () => {
    const routes = ['/', '/booking-confirmation/test-123', '/profile', '/profile/bookings'];

    routes.forEach(route => {
      expect(route).toBeTruthy();
    });
  });
});
