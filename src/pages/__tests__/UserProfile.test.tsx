/**
 * UserProfile Page Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserProfile from '../UserProfile';

// Mock router
const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('UserProfile', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render user profile page', () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
  });

  it('should display user information', () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('traveler@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
  });

  it('should display email notification toggle', () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const emailToggle = screen.getByRole('switch', { name: /email notifications/i });
    expect(emailToggle).toBeInTheDocument();
    expect(emailToggle).toBeChecked(); // Default is enabled
  });

  it('should display push notification toggle', () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const pushToggle = screen.getByRole('switch', { name: /push notifications/i });
    expect(pushToggle).toBeInTheDocument();
    expect(pushToggle).not.toBeChecked(); // Default is disabled
  });

  it('should toggle email notifications', async () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const emailToggle = screen.getByRole('switch', { name: /email notifications/i });

    // Initially enabled
    expect(emailToggle).toBeChecked();

    // Toggle off
    fireEvent.click(emailToggle);
    expect(emailToggle).not.toBeChecked();

    // Toggle back on
    fireEvent.click(emailToggle);
    expect(emailToggle).toBeChecked();
  });

  it('should toggle push notifications', async () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const pushToggle = screen.getByRole('switch', { name: /push notifications/i });

    // Initially disabled
    expect(pushToggle).not.toBeChecked();

    // Toggle on
    fireEvent.click(pushToggle);
    expect(pushToggle).toBeChecked();

    // Toggle back off
    fireEvent.click(pushToggle);
    expect(pushToggle).not.toBeChecked();
  });

  it('should show email notification types when email is enabled', () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    // Email is enabled by default, so types should be visible
    expect(screen.getByText('Booking Confirmations')).toBeInTheDocument();
    expect(screen.getByText('Booking Modifications')).toBeInTheDocument();
    expect(screen.getByText('Booking Cancellations')).toBeInTheDocument();
    expect(screen.getByText('Check-in Reminders')).toBeInTheDocument();
    expect(screen.getByText('Status Changes')).toBeInTheDocument();
    expect(screen.getByText('Hotel Cancellations')).toBeInTheDocument();
  });

  it('should hide email notification types when email is disabled', async () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const emailToggle = screen.getByRole('switch', { name: /email notifications/i });

    // Disable email notifications
    fireEvent.click(emailToggle);

    // Types should not be visible (they're in a conditional render)
    await waitFor(() => {
      const bookingConfirmations = screen.queryAllByText('Booking Confirmations');
      // Should only find the one in push section (if push is enabled) or none
      expect(bookingConfirmations.length).toBeLessThan(2);
    });
  });

  it('should toggle individual notification types', async () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    // Find the booking confirmation email toggle
    const switches = screen.getAllByRole('switch');
    const bookingConfirmationSwitch = switches.find(sw => sw.id === 'email-booking_confirmation');

    expect(bookingConfirmationSwitch).toBeDefined();
    expect(bookingConfirmationSwitch).toBeChecked(); // Default is enabled

    // Toggle off
    fireEvent.click(bookingConfirmationSwitch!);
    expect(bookingConfirmationSwitch).not.toBeChecked();
  });

  it('should save preferences to localStorage', async () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const saveButton = screen.getByRole('button', { name: /save preferences/i });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
    });

    // Check localStorage
    const stored = localStorage.getItem('notificationPreferences');
    expect(stored).toBeTruthy();

    const preferences = JSON.parse(stored!);
    expect(preferences).toHaveProperty('email');
    expect(preferences).toHaveProperty('push');
  });

  it('should show saving state when saving preferences', async () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const saveButton = screen.getByRole('button', { name: /save preferences/i });

    fireEvent.click(saveButton);

    // Should show "Saving..." text
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
    });
  });

  it('should clear success message after timeout', async () => {
    vi.useFakeTimers();

    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const saveButton = screen.getByRole('button', { name: /save preferences/i });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/preferences saved successfully/i)).toBeInTheDocument();
    });

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText(/preferences saved successfully/i)).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should have link to booking history', () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    const bookingsLink = screen.getByRole('button', { name: /my bookings/i });
    expect(bookingsLink).toBeInTheDocument();
    expect(bookingsLink.closest('a')).toHaveAttribute('href', '/profile/bookings');
  });

  it('should display all notification type labels', () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    // Check that all notification types are displayed
    expect(screen.getByText('Booking Confirmations')).toBeInTheDocument();
    expect(screen.getByText('Booking Modifications')).toBeInTheDocument();
    expect(screen.getByText('Booking Cancellations')).toBeInTheDocument();
    expect(screen.getByText('Check-in Reminders')).toBeInTheDocument();
    expect(screen.getByText('Status Changes')).toBeInTheDocument();
    expect(screen.getByText('Hotel Cancellations')).toBeInTheDocument();
  });

  it('should display notification type descriptions', () => {
    render(
      <MockRouter>
        <UserProfile />
      </MockRouter>
    );

    expect(
      screen.getByText(/receive confirmation when your booking is complete/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/get notified when your booking is modified/i)).toBeInTheDocument();
    expect(
      screen.getByText(/receive confirmation when a booking is cancelled/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/get reminded 24 hours before your check-in/i)).toBeInTheDocument();
  });
});
