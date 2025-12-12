/**
 * Chat Store - Zustand state management for Vagabon AI Assistant
 * Manages chat messages, loading states, and AI interactions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatMessage, ChatStore } from '@/types/chat';
import { geminiAIService } from '@/services/GeminiAIService';

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  messages: [] as ChatMessage[],
  isLoading: false,
  error: null as string | null,
  isOpen: false,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Add a new message to the chat
      addMessage: (message: ChatMessage) => {
        const { messages } = get();
        set(
          {
            messages: [...messages, message],
            error: null, // Clear any previous errors when adding a message
          },
          false,
          'addMessage'
        );
      },

      // Clear all messages from the chat
      clearMessages: () => {
        set(
          {
            messages: [],
            error: null,
          },
          false,
          'clearMessages'
        );
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, 'setLoading');
      },

      // Set error message
      setError: (error: string | null) => {
        set({ error }, false, 'setError');
      },

      // Set whether the chat modal is open
      setOpen: (open: boolean) => {
        set({ isOpen: open }, false, 'setOpen');
      },

      // Send a message and get AI response
      sendMessage: async (content: string) => {
        const { messages, addMessage, setLoading, setError } = get();

        // Validate input
        const trimmedContent = content.trim();
        if (!trimmedContent) {
          setError('Message cannot be empty');
          return;
        }

        // Clear any previous errors
        setError(null);

        // Create user message
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content: trimmedContent,
          timestamp: new Date(),
        };

        // Add user message immediately
        addMessage(userMessage);

        // Set loading state
        setLoading(true);

        try {
          // Initialize service if not already done
          if (!geminiAIService.isConfigured()) {
            geminiAIService.initialize();
          }

          // Send message to Gemini API with conversation history
          const response = await geminiAIService.sendMessage(
            trimmedContent,
            messages
          );

          // Create AI response message
          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          };

          // Add AI response to messages
          addMessage(aiMessage);
        } catch (error: any) {
          // Handle errors
          const errorMessage = error?.message || 'Something went wrong. Please try again.';
          setError(errorMessage);
          console.error('Error sending message:', error);
        } finally {
          // Clear loading state
          setLoading(false);
        }
      },
    }),
    {
      name: 'chat-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectMessages = (state: ChatStore) => state.messages;
export const selectIsLoading = (state: ChatStore) => state.isLoading;
export const selectError = (state: ChatStore) => state.error;
export const selectIsOpen = (state: ChatStore) => state.isOpen;
export const selectLastMessage = (state: ChatStore) => 
  state.messages.length > 0 ? state.messages[state.messages.length - 1] : null;
