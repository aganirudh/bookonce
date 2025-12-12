/**
 * VagabonAIChatModal Component Tests
 * Tests for the main chat modal component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VagabonAIChatModal } from '../VagabonAIChatModal';
import { useChatStore } from '@/stores/chatStore';

// Mock the chat store
vi.mock('@/stores/chatStore', () => ({
  useChatStore: vi.fn(),
}));

describe('VagabonAIChatModal', () => {
  const mockSetOpen = vi.fn();
  const mockClearMessages = vi.fn();
  const mockSendMessage = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (useChatStore as any).mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      isOpen: false,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });
  });

  it('should not render when isOpen is false', () => {
    render(<VagabonAIChatModal />);
    
    // Dialog should not be visible
    expect(screen.queryByText('Vagabond AI Assistant')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    (useChatStore as any).mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    expect(screen.getByText('Vagabond AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Your travel companion powered by AI')).toBeInTheDocument();
  });

  it('should display error message when error exists', () => {
    (useChatStore as any).mockReturnValue({
      messages: [],
      isLoading: false,
      error: 'Test error message',
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display loading indicator when loading', () => {
    (useChatStore as any).mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Test', timestamp: new Date() }],
      isLoading: true,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    // Use getAllByText since "Thinking" appears in both the visible UI and screen reader announcement
    const thinkingElements = screen.getAllByText(/Thinking/i);
    expect(thinkingElements.length).toBeGreaterThan(0);
  });

  it('should call setOpen when close button is clicked', () => {
    (useChatStore as any).mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    const closeButton = screen.getByLabelText('Close chat');
    fireEvent.click(closeButton);
    
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('should clear messages immediately when less than 5 messages', () => {
    (useChatStore as any).mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'Test 1', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Response 1', timestamp: new Date() },
      ],
      isLoading: false,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    const clearButton = screen.getByLabelText('Clear chat history');
    fireEvent.click(clearButton);
    
    expect(mockClearMessages).toHaveBeenCalled();
  });

  it('should show confirmation dialog when clearing more than 5 messages', () => {
    const messages = Array.from({ length: 6 }, (_, i) => ({
      id: `${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
      timestamp: new Date(),
    }));

    (useChatStore as any).mockReturnValue({
      messages,
      isLoading: false,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    const clearButton = screen.getByLabelText('Clear chat history');
    fireEvent.click(clearButton);
    
    // Confirmation dialog should appear
    expect(screen.getByText('Clear chat history?')).toBeInTheDocument();
    expect(mockClearMessages).not.toHaveBeenCalled();
  });

  it('should clear messages after confirmation', async () => {
    const messages = Array.from({ length: 6 }, (_, i) => ({
      id: `${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
      timestamp: new Date(),
    }));

    (useChatStore as any).mockReturnValue({
      messages,
      isLoading: false,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    const clearButton = screen.getByLabelText('Clear chat history');
    fireEvent.click(clearButton);
    
    // Click confirm button
    const confirmButton = screen.getByRole('button', { name: /clear chat/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockClearMessages).toHaveBeenCalled();
    });
  });

  it('should disable clear button when no messages', () => {
    (useChatStore as any).mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    const clearButton = screen.getByLabelText('Clear chat history');
    expect(clearButton).toBeDisabled();
  });

  it('should disable clear button when loading', () => {
    (useChatStore as any).mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Test', timestamp: new Date() }],
      isLoading: true,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    const clearButton = screen.getByLabelText('Clear chat history');
    expect(clearButton).toBeDisabled();
  });

  it('should render ChatMessageList and ChatInput components', () => {
    (useChatStore as any).mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      isOpen: true,
      setOpen: mockSetOpen,
      clearMessages: mockClearMessages,
      sendMessage: mockSendMessage,
      setError: mockSetError,
    });

    render(<VagabonAIChatModal />);
    
    // Check for empty state from ChatMessageList - text is split by emoji role
    expect(screen.getByText(/Welcome to Vagabond AI!/i)).toBeInTheDocument();
    
    // Check for input from ChatInput
    expect(screen.getByPlaceholderText(/Ask me about restaurants/i)).toBeInTheDocument();
  });
});
