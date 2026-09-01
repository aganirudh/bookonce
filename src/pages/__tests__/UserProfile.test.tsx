import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserProfile from '../UserProfile';

const authState = vi.hoisted(() => ({
  user: {
    uid: 'user-1',
    email: 'traveler@example.com',
    displayName: 'Jane Doe',
    photoURL: null,
    phoneNumber: '+1 (555) 123-4567',
    emailVerified: true,
  } as Record<string, unknown> | null,
  logout: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user, logout: authState.logout }),
}));

const renderProfile = () => render(<BrowserRouter><UserProfile /></BrowserRouter>);

describe('UserProfile dashboard', () => {
  beforeEach(() => {
    authState.user = {
      uid: 'user-1', email: 'traveler@example.com', displayName: 'Jane Doe',
      photoURL: null, phoneNumber: '+1 (555) 123-4567', emailVerified: true,
    };
    authState.logout.mockClear();
  });

  it('renders the authenticated user and dashboard statistics', () => {
    renderProfile();
    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getAllByText('traveler@example.com')).not.toHaveLength(0);
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    expect(screen.getAllByText('Upcoming Trips').length).toBeGreaterThan(0);
  });

  it('shows current dashboard sections', () => {
    renderProfile();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Travel Insights')).toBeInTheDocument();
  });

  it('logs out through the authentication context', () => {
    renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(authState.logout).toHaveBeenCalledOnce();
  });

  it('renders nothing for an unauthenticated user', () => {
    authState.user = null;
    const { container } = renderProfile();
    expect(container).toBeEmptyDOMElement();
  });
});
