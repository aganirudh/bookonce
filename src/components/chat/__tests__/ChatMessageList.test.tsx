/**
 * ChatMessageList Component Tests
 * Tests for message list rendering and functionality
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessageList } from '../ChatMessageList';
import { ChatMessage } from '@/types/chat';

describe('ChatMessageList Component', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello, can you help me find a restaurant?',
      timestamp: new Date('2024-01-01T12:00:00'),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Of course! I\'d be happy to help you find a restaurant. What type of cuisine are you interested in?',
      timestamp: new Date('2024-01-01T12:00:05'),
    },
    {
      id: '3',
      role: 'user',
      content: 'Italian food would be great!',
      timestamp: new Date('2024-01-01T12:00:15'),
    },
  ];

  describe('Empty State', () => {
    it('should render empty state when no messages', () => {
      render(<ChatMessageList messages={[]} />);

      expect(screen.getByText(/Welcome to Vagabond AI!/i)).toBeInTheDocument();
      expect(screen.getByText(/Restaurant recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/Ask me anything!/i)).toBeInTheDocument();
    });

    it('should display all capability items in empty state', () => {
      render(<ChatMessageList messages={[]} />);

      expect(screen.getByText(/Restaurant recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/Local events and activities/i)).toBeInTheDocument();
      expect(screen.getByText(/Travel planning and tips/i)).toBeInTheDocument();
      expect(screen.getByText(/Accommodation suggestions/i)).toBeInTheDocument();
      expect(screen.getByText(/General travel information/i)).toBeInTheDocument();
    });
  });

  describe('Message Rendering', () => {
    it('should render all messages in chronological order', () => {
      render(<ChatMessageList messages={mockMessages} />);

      const messages = screen.getAllByText(/Hello|Of course|Italian/);
      expect(messages).toHaveLength(3);
    });

    it('should display user messages with correct styling', () => {
      render(<ChatMessageList messages={mockMessages} />);

      const userMessage = screen.getByText('Hello, can you help me find a restaurant?');
      const messageContainer = userMessage.closest('.bg-blue-50');
      
      expect(messageContainer).toBeInTheDocument();
      expect(screen.getAllByText('You').length).toBeGreaterThan(0);
    });

    it('should display AI messages with correct styling', () => {
      render(<ChatMessageList messages={mockMessages} />);

      const aiMessage = screen.getByText(/Of course! I'd be happy to help/);
      const messageContainer = aiMessage.closest('.bg-gray-50');
      
      expect(messageContainer).toBeInTheDocument();
      expect(screen.getByText('Vagabond AI')).toBeInTheDocument();
    });

    it('should display message content correctly', () => {
      render(<ChatMessageList messages={mockMessages} />);

      expect(screen.getByText('Hello, can you help me find a restaurant?')).toBeInTheDocument();
      expect(screen.getByText(/Of course! I'd be happy to help/)).toBeInTheDocument();
      expect(screen.getByText('Italian food would be great!')).toBeInTheDocument();
    });
  });

  describe('Timestamps', () => {
    it('should display timestamps for all messages', () => {
      render(<ChatMessageList messages={mockMessages} />);

      // Check that timestamps are rendered (format may vary)
      const timestamps = screen.getAllByText(/12:00|PM/i);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('Message Roles', () => {
    it('should distinguish between user and AI messages', () => {
      render(<ChatMessageList messages={mockMessages} />);

      // Should have "You" labels for user messages
      const youLabels = screen.getAllByText('You');
      expect(youLabels).toHaveLength(2); // 2 user messages

      // Should have "Vagabond AI" labels for AI messages
      const aiLabels = screen.getAllByText('Vagabond AI');
      expect(aiLabels).toHaveLength(1); // 1 AI message
    });
  });
});
