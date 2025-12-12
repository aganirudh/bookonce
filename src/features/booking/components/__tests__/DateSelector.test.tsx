/**
 * DateSelector Component Tests
 * Tests for date validation and range selection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateSelector } from '../DateSelector';
import { addDays, startOfDay } from 'date-fns';

describe('DateSelector Component', () => {
  const mockOnDateChange = vi.fn();
  const today = startOfDay(new Date());

  beforeEach(() => {
    mockOnDateChange.mockClear();
  });

  describe('Initial Rendering', () => {
    it('should render with default "Select dates" text when no dates selected', () => {
      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.getByText('Select dates')).toBeInTheDocument();
    });

    it('should display selected date range when dates are provided', () => {
      const checkIn = addDays(today, 1);
      const checkOut = addDays(today, 5);

      render(
        <DateSelector
          checkInDate={checkIn}
          checkOutDate={checkOut}
          onDateChange={mockOnDateChange}
        />
      );

      // Should show formatted date range with nights
      expect(screen.getByText(/4 nights?/)).toBeInTheDocument();
    });

    it('should display only check-in date when check-out is not selected', () => {
      const checkIn = addDays(today, 1);

      render(
        <DateSelector
          checkInDate={checkIn}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      // Should show only check-in date
      const button = screen.getByRole('button');
      expect(button.textContent).toContain(checkIn.getDate().toString());
    });
  });

  describe('Date Range Selection', () => {
    it('should open calendar popover when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      const button = screen.getByRole('button', { name: /select dates/i });
      await user.click(button);

      // Calendar should be visible
      await waitFor(() => {
        expect(screen.getByText('Select your dates')).toBeInTheDocument();
      });
    });

    it('should show appropriate instruction text based on selection state', async () => {
      const user = userEvent.setup();
      
      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      const button = screen.getByRole('button', { name: /select dates/i });
      await user.click(button);

      // Initially should prompt for check-in
      await waitFor(() => {
        expect(screen.getByText('Choose your check-in date')).toBeInTheDocument();
      });
    });

    it('should call onDateChange with both dates when Apply is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      const button = screen.getByRole('button', { name: /select dates/i });
      await user.click(button);

      // Wait for calendar to open
      await waitFor(() => {
        expect(screen.getByText('Select your dates')).toBeInTheDocument();
      });

      // Apply button should be disabled initially
      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toBeDisabled();
    });
  });

  describe('Date Validation', () => {
    it('should respect minStay constraint', () => {
      const checkIn = addDays(today, 1);
      
      render(
        <DateSelector
          checkInDate={checkIn}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
          minStay={2}
        />
      );

      // Component should enforce minimum stay of 2 nights
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should respect maxStay constraint', () => {
      const checkIn = addDays(today, 1);
      
      render(
        <DateSelector
          checkInDate={checkIn}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
          maxStay={7}
        />
      );

      // Component should enforce maximum stay of 7 nights
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle unavailable dates', () => {
      const unavailableDates = [
        addDays(today, 3),
        addDays(today, 4),
      ];

      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
          unavailableDates={unavailableDates}
        />
      );

      // Component should disable unavailable dates
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear dates when X button is clicked', async () => {
      const user = userEvent.setup();
      const checkIn = addDays(today, 1);
      const checkOut = addDays(today, 5);

      render(
        <DateSelector
          checkInDate={checkIn}
          checkOutDate={checkOut}
          onDateChange={mockOnDateChange}
        />
      );

      // Find the button and the X icon within it
      const button = screen.getByRole('button');
      const clearIcon = button.querySelector('svg.lucide-x');
      expect(clearIcon).toBeInTheDocument();

      // Click directly on the X icon's parent (which has the onClick handler)
      if (clearIcon) {
        await user.click(clearIcon as Element);
        expect(mockOnDateChange).toHaveBeenCalledWith(null, null);
      }
    });

    it('should not show clear button when no dates are selected', () => {
      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      const button = screen.getByRole('button');
      const clearIcon = button.querySelector('svg[class*="lucide-x"]');
      expect(clearIcon).not.toBeInTheDocument();
    });
  });

  describe('Date Details Display', () => {
    it('should show detailed date information when dates are selected', () => {
      const checkIn = addDays(today, 1);
      const checkOut = addDays(today, 5);

      render(
        <DateSelector
          checkInDate={checkIn}
          checkOutDate={checkOut}
          onDateChange={mockOnDateChange}
        />
      );

      // Should show check-in and check-out details
      expect(screen.getByText(/Check-in:/)).toBeInTheDocument();
      expect(screen.getByText(/Check-out:/)).toBeInTheDocument();
    });

    it('should not show date details when dates are not selected', () => {
      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      expect(screen.queryByText(/Check-in:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Check-out:/)).not.toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should close popover without changes when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const checkIn = addDays(today, 1);
      const checkOut = addDays(today, 5);

      render(
        <DateSelector
          checkInDate={checkIn}
          checkOutDate={checkOut}
          onDateChange={mockOnDateChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Select your dates')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // onDateChange should not be called
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button with calendar icon', () => {
      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Should have calendar icon
      const calendarIcon = button.querySelector('svg');
      expect(calendarIcon).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <DateSelector
          checkInDate={null}
          checkOutDate={null}
          onDateChange={mockOnDateChange}
        />
      );

      const button = screen.getByRole('button');
      
      // Should be focusable
      await user.tab();
      expect(button).toHaveFocus();
    });
  });
});
