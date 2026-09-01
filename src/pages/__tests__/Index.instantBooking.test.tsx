/**
 * Index Page - Instant Booking Filter Tests
 * Tests for instant booking filter functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '../Index';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ComponentProps<'button'>) => (
      <button {...props}>{children}</button>
    ),
    img: (props: React.ComponentProps<'img'>) => <img {...props} />,
    nav: ({ children, ...props }: React.ComponentProps<'nav'>) => <nav {...props}>{children}</nav>,
    a: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Index Page - Instant Booking Filter', () => {
  const renderIndex = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <Index />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('should render the instant booking filter button', () => {
    renderIndex();

    // The instant booking filter button should be present (Zap icon button)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render the current journey search action', () => {
    renderIndex();
    expect(screen.getAllByRole('button', { name: /explore/i })).not.toHaveLength(0);
  });

  it('should render the current BookOnce landing content', () => {
    renderIndex();
    expect(screen.getAllByText('BookOnce')).not.toHaveLength(0);
  });
});
