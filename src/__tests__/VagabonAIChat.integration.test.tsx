/**
 * Vagabon AI Chat Integration Tests
 * End-to-end tests for the complete chat flow
 *
 * Tests:
 * - Opening modal from navbar
 * - Sending message and receiving response
 * - Clearing chat
 * - Error scenarios
 *
 * Requirements: 1.1, 1.2, 2.3, 2.4, 3.1, 3.2, 3.3, 7.1, 7.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { BookOnceAIChatModal } from '@/components/BookOnceAIChatModal';
import { useChatStore } from '@/stores/chatStore';
import { bookOnceAIService } from '@/features/journey/services/BookOnceAIService';

// Mock the BookOnceAIService
vi.mock('@/features/journey/services/BookOnceAIService', () => ({
  bookOnceAIService: {
    answerQuestionWithHistory: vi.fn(),
  },
}));

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

describe('Vagabon AI Chat - Integration Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Navbar />
          <BookOnceAIChatModal />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset chat store
    const store = useChatStore.getState();
    store.clearMessages();
    store.setError(null);
    store.setLoading(false);
    store.setOpen(false);

    // Setup default mock behavior
    vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockResolvedValue('AI response');
  });

  describe('Opening modal from navbar', () => {
    it('should open chat modal when Vagabond AI button is clicked', async () => {
      const user = userEvent.setup();
      renderApp();

      // Find and click the Vagabond AI button
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });
    });

    it('should display welcome message when modal opens with no messages', async () => {
      const user = userEvent.setup();
      renderApp();

      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Vagabond AI!/i)).toBeInTheDocument();
        expect(screen.getByText(/Restaurant recommendations/i)).toBeInTheDocument();
      });
    });

    it('should focus input when modal opens', async () => {
      const user = userEvent.setup();
      renderApp();

      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(
        () => {
          const input = screen.getByRole('textbox', { name: /message input/i });
          expect(input).toHaveFocus();
        },
        { timeout: 500 }
      );
    });
  });

  describe('Sending message and receiving response', () => {
    it('should send message and display AI response', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Type and send message
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'Hello AI');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // User message should appear immediately
      expect(screen.getByText('Hello AI')).toBeInTheDocument();

      // Wait for AI response
      await waitFor(() => {
        expect(screen.getByText('AI response')).toBeInTheDocument();
      });

      // Verify service was called
      expect(bookOnceAIService.answerQuestionWithHistory).toHaveBeenCalled();
    });

    it('should show loading indicator while waiting for response', async () => {
      const user = userEvent.setup();

      // Make the API call take some time
      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('Delayed response'), 100))
      );

      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Send message
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Loading indicator should appear
      await waitFor(() => {
        expect(screen.getByText(/Thinking/i)).toBeInTheDocument();
      });

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Delayed response')).toBeInTheDocument();
      });
    });

    it('should maintain conversation history across multiple messages', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Send first message
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'First message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByText('AI response')).toBeInTheDocument();
      });

      // Send second message
      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockResolvedValue('Second response');
      await user.type(input, 'Second message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByText('Second response')).toBeInTheDocument();
      });

      // Verify both messages are visible
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();

      // Verify conversation history was passed to service
      expect(bookOnceAIService.answerQuestionWithHistory).toHaveBeenLastCalledWith(
        'Second message',
        expect.any(Object),
        expect.arrayContaining([expect.objectContaining({ content: 'First message' })])
      );
    });

    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Type and send message
      const input = screen.getByRole('textbox', { name: /message input/i }) as HTMLTextAreaElement;
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      // Input should be cleared
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Clearing chat', () => {
    it('should clear messages when clear button is clicked (less than 5 messages)', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Send a message
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByLabelText('Clear chat history');
      await user.click(clearButton);

      // Messages should be cleared and welcome message should appear
      await waitFor(() => {
        expect(screen.queryByText('Test message')).not.toBeInTheDocument();
        expect(screen.getByText(/Welcome to Vagabond AI!/i)).toBeInTheDocument();
      });
    });

    it('should show confirmation dialog when clearing more than 5 messages', async () => {
      const user = userEvent.setup();

      // Pre-populate store with messages
      const store = useChatStore.getState();
      for (let i = 0; i < 6; i++) {
        store.addMessage({
          id: `${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByLabelText('Clear chat history');
      await user.click(clearButton);

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByText('Clear chat history?')).toBeInTheDocument();
      });

      // Messages should still be visible
      expect(screen.getByText('Message 0')).toBeInTheDocument();
    });

    it('should clear messages after confirmation', async () => {
      const user = userEvent.setup();

      // Pre-populate store with messages
      const store = useChatStore.getState();
      for (let i = 0; i < 6; i++) {
        store.addMessage({
          id: `${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByLabelText('Clear chat history');
      await user.click(clearButton);

      // Confirm clearing
      await waitFor(() => {
        expect(screen.getByText('Clear chat history?')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /clear chat/i });
      await user.click(confirmButton);

      // Messages should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Message 0')).not.toBeInTheDocument();
        expect(screen.getByText(/Welcome to Vagabond AI!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error scenarios', () => {
    it('should display error message when API call fails', async () => {
      const user = userEvent.setup();

      // Mock API error
      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockRejectedValue(
        new Error('API error occurred')
      );

      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Send message
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByText('API error occurred')).toBeInTheDocument();
      });

      // User message should still be visible
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock network error
      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockRejectedValue(
        new Error('Unable to connect. Please check your internet connection.')
      );

      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Send message
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      // Network error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Unable to connect/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();

      // First call fails, second succeeds
      vi.mocked(bookOnceAIService.answerQuestionWithHistory)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('Success after retry');

      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Send message (will fail)
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'First attempt');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByText('Temporary error')).toBeInTheDocument();
      });

      // Try again (will succeed)
      await user.type(input, 'Second attempt');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      // Success response should appear
      await waitFor(() => {
        expect(screen.getByText('Success after retry')).toBeInTheDocument();
      });
    });

    it('should handle service not configured error', async () => {
      const user = userEvent.setup();

      // Mock service not configured
      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockRejectedValue(
        new Error(
          'AI service is not configured. Please add VITE_SAMBANOVA_API_KEY to your .env file.'
        )
      );

      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Send message
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      // Configuration error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/not configured/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal interactions', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByLabelText('Close chat');
      await user.click(closeButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('Vagabond AI Assistant')).not.toBeInTheDocument();
      });
    });

    it('should preserve messages when reopening modal', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open modal
      const aiButton = screen.getByRole('button', { name: /vagabond ai/i });
      await user.click(aiButton);

      await waitFor(() => {
        expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
      });

      // Send message
      const input = screen.getByRole('textbox', { name: /message input/i });
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByLabelText('Close chat');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Vagabond AI Assistant')).not.toBeInTheDocument();
      });

      // Reopen modal
      await user.click(aiButton);

      // Message should still be there
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });
  });
});
