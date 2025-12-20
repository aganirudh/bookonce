/**
 * CreateAccountDialog Tests
 * Tests for account creation dialog after guest booking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateAccountDialog } from '../CreateAccountDialog';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

import { useAuth } from '@/contexts/AuthContext';

describe('CreateAccountDialog', () => {
  const mockRegister = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      updateProfile: vi.fn(),
    });
  });

  const renderDialog = (props = {}) => {
    return render(
      <CreateAccountDialog
        isOpen={true}
        onClose={mockOnClose}
        email="guest@example.com"
        firstName="Guest"
        lastName="User"
        {...props}
      />
    );
  };

  it('should render dialog with pre-filled email', () => {
    renderDialog();

    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByDisplayValue('guest@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('guest@example.com')).toBeDisabled();
  });

  it('should allow user to enter password', async () => {
    const user = userEvent.setup();
    renderDialog();

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    renderDialog();

    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'short');
    await user.type(confirmInput, 'short');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should validate password match', async () => {
    const user = userEvent.setup();
    renderDialog();

    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'password123');
    await user.type(confirmInput, 'different456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should create account successfully', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    renderDialog();

    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'password123');
    await user.type(confirmInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'guest@example.com',
        'password123',
        'Guest',
        'User'
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Account Created!')).toBeInTheDocument();
    });
  });

  it('should handle registration error', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error('Registration failed'));
    renderDialog();

    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'password123');
    await user.type(confirmInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  it('should allow skipping account creation', async () => {
    const user = userEvent.setup();
    renderDialog();

    const skipButton = screen.getByRole('button', { name: /skip for now/i });
    await user.click(skipButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should close dialog after successful registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);

    renderDialog();

    const passwordInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'password123');
    await user.type(confirmInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Account Created!')).toBeInTheDocument();
    });

    // Wait for auto-close timeout
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });
});
