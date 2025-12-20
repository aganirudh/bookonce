/**
 * Chat Types for Vagabon AI Assistant
 *
 * This file contains all TypeScript interfaces and types for the chat functionality
 * powered by Google's Gemini API.
 */

/**
 * Represents a single message in the chat conversation
 */
export interface ChatMessage {
  /** Unique identifier for the message (UUID) */
  id: string;

  /** Role of the message sender */
  role: 'user' | 'assistant';

  /** Content of the message */
  content: string;

  /** Timestamp when the message was created */
  timestamp: Date;
}

/**
 * Zustand store interface for managing chat state
 */
export interface ChatStore {
  /** Array of all messages in the current chat session */
  messages: ChatMessage[];

  /** Loading state while waiting for AI response */
  isLoading: boolean;

  /** Error message if something goes wrong */
  error: string | null;

  /** Whether the chat modal is open */
  isOpen: boolean;

  // Actions

  /** Add a new message to the chat */
  addMessage: (message: ChatMessage) => void;

  /** Clear all messages from the chat */
  clearMessages: () => void;

  /** Set the loading state */
  setLoading: (loading: boolean) => void;

  /** Set an error message */
  setError: (error: string | null) => void;

  /** Set whether the chat modal is open */
  setOpen: (open: boolean) => void;

  /** Send a message and get AI response */
  sendMessage: (content: string) => Promise<void>;
}

/**
 * Configuration for the Gemini AI service
 */
export interface GeminiConfig {
  /** Gemini API key from environment variables */
  apiKey: string;

  /** Model to use (default: 'gemini-pro') */
  model: string;

  /** Maximum number of tokens in the response */
  maxTokens?: number;

  /** Temperature for response creativity (0-1) */
  temperature?: number;
}
