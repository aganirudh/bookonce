/**
 * ChatInput Component Tests
 * Basic tests for ChatInput functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';

describe('ChatInput Component', () => {
  const mockOnSend = vi.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  describe('Rendering', () => {
    it('should render textarea and send button', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      const sendButton = screen.getByRole('button', { name: /send message/i });

      expect(textarea).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <ChatInput
          onSend={mockOnSend}
          isLoading={false}
          placeholder="Custom placeholder"
        />
      );

      const textarea = screen.getByPlaceholderText('Custom placeholder');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should update textarea value when user types', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      await user.type(textarea, 'Hello AI');

      expect(textarea).toHaveValue('Hello AI');
    });

    it('should call onSend when send button is clicked with valid message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, 'Test message');
      await user.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
      expect(mockOnSend).toHaveBeenCalledTimes(1);
    });

    it('should clear textarea after sending message', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, 'Test message');
      await user.click(sendButton);

      expect(textarea).toHaveValue('');
    });
  });

  describe('Keyboard Handling', () => {
    it('should send message when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });

      await user.type(textarea, 'Test message{Enter}');

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should add new line when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });

      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(textarea).toHaveValue('Line 1\nLine 2');
      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable textarea when loading', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={true} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i });
      expect(textarea).toBeDisabled();
    });

    it('should disable send button when loading', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={true} />);

      // When loading, the aria-label changes to "Sending message"
      const sendButton = screen.getByRole('button', { name: /sending message/i });
      expect(sendButton).toBeDisabled();
    });

    it('should show loading spinner when loading', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={true} />);

      // Loader2 icon should be present
      const sendButton = screen.getByRole('button', { name: /sending message/i });
      expect(sendButton.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Character Limit', () => {
    it('should show character count when approaching limit', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i }) as HTMLTextAreaElement;
      
      // Use fireEvent to properly trigger React's onChange
      // Use 1601 to be above the 80% threshold (1600)
      const longMessage = 'a'.repeat(1601);
      fireEvent.change(textarea, { target: { value: longMessage } });

      expect(screen.getByText(/1601 \/ 2000/)).toBeInTheDocument();
    });

    it('should disable send button when over character limit', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i }) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Use fireEvent to properly trigger React's onChange
      const tooLongMessage = 'a'.repeat(2001);
      fireEvent.change(textarea, { target: { value: tooLongMessage } });

      expect(sendButton).toBeDisabled();
      expect(screen.getByText(/message is too long/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should disable send button when message is empty', () => {
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when message is only whitespace', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /message input/i }) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Use paste instead of type for whitespace
      await user.click(textarea);
      await user.paste('   ');

      expect(sendButton).toBeDisabled();
    });

    it('should not call onSend when message is empty', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={mockOnSend} isLoading={false} />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });
});
