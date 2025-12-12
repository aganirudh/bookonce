import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '@/components/Navbar';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

describe('Navbar Integration', () => {
  const mockProps = {
    onSafetyClick: vi.fn(),
    isOffline: false,
    onContextClick: vi.fn(),
  };

  it('shows all navigation items when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar {...mockProps} />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stays').length).toBeGreaterThan(0);
    expect(screen.getAllByText('My Bookings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Profile').length).toBeGreaterThan(0);
  });

  it('hides authenticated navigation items when user is not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar {...mockProps} />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stays').length).toBeGreaterThan(0);
    expect(screen.queryByText('My Bookings')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('renders route links correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <Navbar {...mockProps} />
      </BrowserRouter>
    );

    const homeLinks = container.querySelectorAll('a[href="/"]');
    expect(homeLinks.length).toBeGreaterThan(0);

    const bookingsLinks = container.querySelectorAll('a[href="/profile/bookings"]');
    expect(bookingsLinks.length).toBeGreaterThan(0);

    const profileLinks = container.querySelectorAll('a[href="/profile"]');
    expect(profileLinks.length).toBeGreaterThan(0);
  });

  it('shows offline indicator when offline', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <Navbar {...mockProps} isOffline={true} />
      </BrowserRouter>
    );

    const shieldButton = container.querySelector('button[class*="bg-destructive"]');
    expect(shieldButton).toBeInTheDocument();
  });
});
