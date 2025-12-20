/**
 * Chat Store Unit Tests
 * Tests for chat state management actions and state updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../chatStore';
import type { ChatMessage } from '@/types/chat';
import { bookOnceAIService } from '@/features/journey/services/BookOnceAIService';

// Mock the BookOnceAIService
vi.mock('@/features/journey/services/BookOnceAIService', () => ({
  bookOnceAIService: {
    answerQuestionWithHistory: vi.fn(),
  },
}));

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useChatStore.getState();
    store.clearMessages();
    store.setError(null);
    store.setLoading(false);
    store.setOpen(false);
    vi.clearAllMocks();
  });

  describe('addMessage', () => {
    it('should add a message to the store', () => {
      const { addMessage } = useChatStore.getState();

      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage(message);

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(message);
    });

    it('should add multiple messages in order', () => {
      const { addMessage } = useChatStore.getState();

      const message1: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'First',
        timestamp: new Date(),
      };

      const message2: ChatMessage = {
        id: '2',
        role: 'assistant',
        content: 'Second',
        timestamp: new Date(),
      };

      addMessage(message1);
      addMessage(message2);

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].content).toBe('First');
      expect(state.messages[1].content).toBe('Second');
    });

    it('should clear error when adding a message', () => {
      const { addMessage, setError } = useChatStore.getState();

      setError('Previous error');

      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage(message);

      const state = useChatStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      const { addMessage, clearMessages } = useChatStore.getState();

      const message1: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'First',
        timestamp: new Date(),
      };

      const message2: ChatMessage = {
        id: '2',
        role: 'assistant',
        content: 'Second',
        timestamp: new Date(),
      };

      addMessage(message1);
      addMessage(message2);
      clearMessages();

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(0);
    });

    it('should clear error when clearing messages', () => {
      const { clearMessages, setError } = useChatStore.getState();

      setError('Some error');
      clearMessages();

      const state = useChatStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      const { setLoading } = useChatStore.getState();

      setLoading(true);

      const state = useChatStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set loading state to false', () => {
      const { setLoading } = useChatStore.getState();

      setLoading(true);
      setLoading(false);

      const state = useChatStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useChatStore.getState();

      setError('Test error');

      const state = useChatStore.getState();
      expect(state.error).toBe('Test error');
    });

    it('should clear error message', () => {
      const { setError } = useChatStore.getState();

      setError('Test error');
      setError(null);

      const state = useChatStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setOpen', () => {
    it('should set modal open state to true', () => {
      const { setOpen } = useChatStore.getState();

      setOpen(true);

      const state = useChatStore.getState();
      expect(state.isOpen).toBe(true);
    });

    it('should set modal open state to false', () => {
      const { setOpen } = useChatStore.getState();

      setOpen(true);
      setOpen(false);

      const state = useChatStore.getState();
      expect(state.isOpen).toBe(false);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockResolvedValue('AI response');
    });

    it('should add user message immediately', async () => {
      const { sendMessage } = useChatStore.getState();

      const promise = sendMessage('Hello');

      // Check state before promise resolves
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[0].content).toBe('Hello');

      await promise;
    });

    it('should set loading state while waiting for response', async () => {
      const { sendMessage } = useChatStore.getState();

      let loadingDuringCall = false;

      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockImplementation(async () => {
        loadingDuringCall = useChatStore.getState().isLoading;
        return 'AI response';
      });

      await sendMessage('Hello');

      expect(loadingDuringCall).toBe(true);
      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it('should add AI response after receiving it', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('Hello');

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(2);
      expect(state.messages[1].role).toBe('assistant');
      expect(state.messages[1].content).toBe('AI response');
    });

    it('should call vagabond AI service', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('Hello');

      expect(bookOnceAIService.answerQuestionWithHistory).toHaveBeenCalled();
    });

    it('should pass conversation history to service', async () => {
      const { sendMessage, addMessage } = useChatStore.getState();

      // Add some existing messages
      const existingMessage: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Previous message',
        timestamp: new Date(),
      };
      addMessage(existingMessage);

      await sendMessage('New message');

      expect(bookOnceAIService.answerQuestionWithHistory).toHaveBeenCalledWith(
        'New message',
        expect.any(Object),
        expect.arrayContaining([expect.objectContaining({ content: 'Previous message' })])
      );
    });

    it('should handle empty message', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('');

      const state = useChatStore.getState();
      expect(state.error).toBe('Message cannot be empty');
      expect(state.messages).toHaveLength(0);
      expect(bookOnceAIService.answerQuestionWithHistory).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only message', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('   ');

      const state = useChatStore.getState();
      expect(state.error).toBe('Message cannot be empty');
      expect(state.messages).toHaveLength(0);
      expect(bookOnceAIService.answerQuestionWithHistory).not.toHaveBeenCalled();
    });

    it('should trim message content', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('  Hello  ');

      expect(bookOnceAIService.answerQuestionWithHistory).toHaveBeenCalledWith(
        'Hello',
        expect.any(Object),
        expect.any(Array)
      );
    });

    it('should clear previous error before sending', async () => {
      const { sendMessage, setError } = useChatStore.getState();

      setError('Previous error');
      await sendMessage('Hello');

      const state = useChatStore.getState();
      expect(state.error).toBeNull();
    });

    it('should handle API errors', async () => {
      const { sendMessage } = useChatStore.getState();

      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockRejectedValue(
        new Error('API error')
      );

      await sendMessage('Hello');

      const state = useChatStore.getState();
      expect(state.error).toBe('API error');
      expect(state.isLoading).toBe(false);
      expect(state.messages).toHaveLength(1); // Only user message
    });

    it('should handle errors without message', async () => {
      const { sendMessage } = useChatStore.getState();

      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockRejectedValue({});

      await sendMessage('Hello');

      const state = useChatStore.getState();
      expect(state.error).toContain('Unable to connect');
    });

    it('should clear loading state after error', async () => {
      const { sendMessage } = useChatStore.getState();

      vi.mocked(bookOnceAIService.answerQuestionWithHistory).mockRejectedValue(
        new Error('API error')
      );

      await sendMessage('Hello');

      const state = useChatStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should generate unique IDs for messages', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('Hello');

      const state = useChatStore.getState();
      expect(state.messages[0].id).toBeTruthy();
      expect(state.messages[1].id).toBeTruthy();
      expect(state.messages[0].id).not.toBe(state.messages[1].id);
    });

    it('should set timestamps for messages', async () => {
      const { sendMessage } = useChatStore.getState();

      const beforeTime = new Date();
      await sendMessage('Hello');
      const afterTime = new Date();

      const state = useChatStore.getState();
      expect(state.messages[0].timestamp).toBeInstanceOf(Date);
      expect(state.messages[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(state.messages[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('state persistence', () => {
    it('should maintain messages across multiple actions', () => {
      const { addMessage, setLoading, setError } = useChatStore.getState();

      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage(message);
      setLoading(true);
      setError('Some error');

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe('Some error');
    });
  });

  describe('selectors', () => {
    it('should select messages', async () => {
      const { addMessage } = useChatStore.getState();

      const message: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage(message);

      const { selectMessages } = await import('../chatStore');
      const messages = selectMessages(useChatStore.getState());
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });

    it('should select loading state', async () => {
      const { setLoading } = useChatStore.getState();

      setLoading(true);

      const { selectIsLoading } = await import('../chatStore');
      const isLoading = selectIsLoading(useChatStore.getState());
      expect(isLoading).toBe(true);
    });

    it('should select error', async () => {
      const { setError } = useChatStore.getState();

      setError('Test error');

      const { selectError } = await import('../chatStore');
      const error = selectError(useChatStore.getState());
      expect(error).toBe('Test error');
    });

    it('should select open state', async () => {
      const { setOpen } = useChatStore.getState();

      setOpen(true);

      const { selectIsOpen } = await import('../chatStore');
      const isOpen = selectIsOpen(useChatStore.getState());
      expect(isOpen).toBe(true);
    });

    it('should select last message', async () => {
      const { addMessage } = useChatStore.getState();

      const message1: ChatMessage = {
        id: '1',
        role: 'user',
        content: 'First',
        timestamp: new Date(),
      };

      const message2: ChatMessage = {
        id: '2',
        role: 'assistant',
        content: 'Second',
        timestamp: new Date(),
      };

      addMessage(message1);
      addMessage(message2);

      const { selectLastMessage } = await import('../chatStore');
      const lastMessage = selectLastMessage(useChatStore.getState());
      expect(lastMessage).toEqual(message2);
    });

    it('should return null for last message when no messages', async () => {
      const { selectLastMessage } = await import('../chatStore');
      const lastMessage = selectLastMessage(useChatStore.getState());
      expect(lastMessage).toBeNull();
    });
  });
});
