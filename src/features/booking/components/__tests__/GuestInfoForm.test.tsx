/**
 * GuestInfoForm Component Tests
 * Tests for field validation, email/phone format validation, and required field enforcement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestInfoForm } from '../GuestInfoForm';
import type { GuestInfo } from '@/types/booking';

describe('GuestInfoForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnBack.mockClear();
  });

  describe('Initial Rendering', () => {
    it('should render all required form fields', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });

    it('should render optional fields', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/estimated arrival time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/special requests/i)).toBeInTheDocument();
    });

    it('should display submit button', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
    });

    it('should display back button when onBack is provided', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should not display back button when onBack is not provided', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });
  });

  describe('Initial Data Population', () => {
    it('should populate form with initial data', () => {
      const initialData: Partial<GuestInfo> = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        country: 'United States',
      };

      render(<GuestInfoForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    });
  });

  describe('Required Field Validation', () => {
    it('should show error when first name is empty', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.click(firstNameInput);
      await user.tab(); // Blur the field

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when last name is empty', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.click(lastNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when phone is empty', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.click(phoneInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when country is not selected', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      // Fill all fields except country
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Field Length Validation', () => {
    it('should show error when first name is too short', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'J');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when last name is too short', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'D');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/last name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when phone is too short', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/phone number must be at least 10 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should show error when special requests exceed max length', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const specialRequestsInput = screen.getByLabelText(/special requests/i);
      const longText = 'a'.repeat(501);
      await user.type(specialRequestsInput, longText);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/special requests must be less than 500 characters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Email Format Validation', () => {
    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should accept valid email format', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'john.doe@example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('should accept email with subdomain', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'user@mail.example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Phone Format Validation', () => {
    it('should show error for invalid phone format with letters', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, 'abc123456789');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
      });
    });

    it('should accept phone with country code and dashes', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '+1-555-123-4567');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid phone number/i)).not.toBeInTheDocument();
      });
    });

    it('should accept phone with parentheses', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '+1 (555) 123-4567');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid phone number/i)).not.toBeInTheDocument();
      });
    });

    it('should accept phone with spaces', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '+1 555 123 4567');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid phone number/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button when form is invalid', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all required fields are valid', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      // Fill all required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');

      // Select country
      const countrySelect = screen.getByRole('combobox');
      await user.click(countrySelect);
      await waitFor(() => {
        const option = screen.getByRole('option', { name: /united states/i });
        user.click(option);
      });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should call onSubmit with form data when submitted', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      // Fill all required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');

      // Select country
      const countrySelect = screen.getByRole('combobox');
      await user.click(countrySelect);
      const option = await screen.findByRole('option', { name: /united states/i });
      await user.click(option);

      // Wait for form to be valid
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(submitButton).not.toBeDisabled();
      });

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            country: 'United States',
          })
        );
      });
    });

    it('should include optional fields in submission when provided', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');

      // Select country
      const countrySelect = screen.getByRole('combobox');
      await user.click(countrySelect);
      const option = await screen.findByRole('option', { name: /united states/i });
      await user.click(option);

      // Fill optional fields
      await user.type(screen.getByLabelText(/special requests/i), 'Early check-in please');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(submitButton).not.toBeDisabled();
      });

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            specialRequests: 'Early check-in please',
          })
        );
      });
    });
  });

  describe('Back Button', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should disable all inputs when loading', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByLabelText(/first name/i)).toBeDisabled();
      expect(screen.getByLabelText(/last name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/phone number/i)).toBeDisabled();
    });

    it('should disable submit button when loading', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /processing/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading text on submit button', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
    });
  });

  describe('Character Counter', () => {
    it('should display character count for special requests', async () => {
      const user = userEvent.setup();
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const specialRequestsInput = screen.getByLabelText(/special requests/i);
      await user.type(specialRequestsInput, 'Test request');

      await waitFor(() => {
        expect(screen.getByText(/12\/500 characters/i)).toBeInTheDocument();
      });
    });

    it('should start at 0/500 characters', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/0\/500 characters/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const requiredMarkers = screen.getAllByText('*');
      expect(requiredMarkers.length).toBeGreaterThan(0);
    });

    it('should have appropriate input types for mobile optimization', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');

      const phoneInput = screen.getByLabelText(/phone number/i);
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });

    it('should have appropriate autocomplete attributes', () => {
      render(<GuestInfoForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('autocomplete', 'given-name');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('autocomplete', 'family-name');
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('autocomplete', 'tel');
    });
  });
});
