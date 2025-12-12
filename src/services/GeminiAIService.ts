/**
 * GeminiAIService
 * 
 * Service layer for interacting with Google's Gemini API.
 * Handles message sending, error handling, retry logic, and rate limiting.
 */

import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { ChatMessage } from '../types/chat';

/**
 * System prompt that defines the AI assistant's behavior and context
 */
const SYSTEM_PROMPT = `You are Vagabond AI, a helpful travel assistant integrated into the Vagabond travel platform. 

Your role is to help users with:
- Restaurant and food recommendations
- Local events and activities
- Travel planning and itinerary suggestions
- Accommodation recommendations
- General travel tips and information
- Cultural insights and local customs

Guidelines:
- Be friendly, concise, and helpful
- Provide specific, actionable recommendations when possible
- Ask clarifying questions if needed
- Acknowledge when you don't have information
- Focus on travel-related topics
- Suggest using the platform's booking features when relevant

Keep responses conversational and under 200 words unless more detail is specifically requested.`;

/**
 * Configuration constants
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Initial delay, will be multiplied for exponential backoff
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10;

/**
 * Custom error types for better error handling
 */
export class GeminiAPIError extends Error {
  constructor(message: string, public readonly type: 'network' | 'rate_limit' | 'api' | 'timeout' | 'config') {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

/**
 * Service class for managing Gemini AI interactions
 */
class GeminiAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string | null = null;
  private requestTimestamps: number[] = [];

  /**
   * Initialize the Gemini SDK with API key from environment
   */
  initialize(): void {
    // Get API key from environment variables
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    console.log('🔑 API Key (first 10 chars):', this.apiKey?.substring(0, 10) + '...');

    // Debug: Log environment check
    console.log('🔍 Checking Gemini API Key:', this.apiKey ? '✅ Found' : '❌ Not Found');

    if (!this.apiKey) {
      console.error('❌ Gemini API key not found');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);

      // Use the stable Gemini model that works with v1beta API
      const modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-pro';
      const maxTokens = parseInt(import.meta.env.VITE_GEMINI_MAX_TOKENS) || 2048;
      const temperature = parseFloat(import.meta.env.VITE_GEMINI_TEMPERATURE) || 0.7;

      console.log('🤖 Using Gemini model:', modelName);

      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });


      console.log('Gemini AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini AI Service:', error);
      throw new GeminiAPIError('Failed to initialize Gemini AI Service', 'config');
    }
  }

  /**
   * Check if the service is properly configured with an API key
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.model !== null;
  }

  /**
   * Check if rate limit has been exceeded
   */
  private checkRateLimit(): void {
    const now = Date.now();
    
    // Remove timestamps older than the rate limit window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    // Check if we've exceeded the rate limit
    if (this.requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
      throw new GeminiAPIError(
        'Too many requests. Please wait a moment and try again.',
        'rate_limit'
      );
    }

    // Add current timestamp
    this.requestTimestamps.push(now);
  }

  /**
   * Format conversation history for Gemini API
   */
  private formatConversationHistory(messages: ChatMessage[]): string {
    if (messages.length === 0) {
      return SYSTEM_PROMPT;
    }

    const history = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    return `${SYSTEM_PROMPT}\n\nConversation History:\n${history}`;
  }

  /**
   * Send a message to Gemini API with retry logic and error handling
   */
  async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    if (!this.isConfigured()) {
      throw new GeminiAPIError(
        'AI Assistant is not configured. Please contact support.',
        'config'
      );
    }

    // Check rate limit before making request
    this.checkRateLimit();

    // Sanitize input
    const sanitizedMessage = message.trim().slice(0, 2000);
    if (!sanitizedMessage) {
      throw new GeminiAPIError('Message cannot be empty', 'api');
    }

    // Attempt to send message with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.sendMessageWithTimeout(sanitizedMessage, conversationHistory);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on rate limit or config errors
        if (error instanceof GeminiAPIError && 
            (error.type === 'rate_limit' || error.type === 'config')) {
          throw error;
        }

        // If this isn't the last attempt, wait before retrying with exponential backoff
        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    throw new GeminiAPIError(
      lastError?.message || 'Failed to get response from AI assistant. Please try again.',
      'api'
    );
  }

  /**
   * Send message with timeout handling
   */
  private async sendMessageWithTimeout(
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new GeminiAPIError('Request timed out. Please try again.', 'timeout'));
      }, REQUEST_TIMEOUT_MS);
    });

    const sendPromise = this.sendMessageInternal(message, conversationHistory);

    return Promise.race([sendPromise, timeoutPromise]);
  }

  /**
   * Internal method to send message to Gemini API
   */
  private async sendMessageInternal(
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    if (!this.model) {
      throw new GeminiAPIError('Model not initialized', 'config');
    }

    try {
      // Format the prompt with conversation history
      const context = this.formatConversationHistory(conversationHistory);
      const fullPrompt = `${context}\n\nUser: ${message}\n\nAssistant:`;

      console.log('🚀 Sending to Gemini API...');

      // Send message to Gemini
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      console.log('✅ Received response from Gemini');

      if (!text) {
        throw new GeminiAPIError('Received empty response from AI', 'api');
      }

      return text;
    } catch (error: any) {
      // Log full error for debugging
      console.error('🔴 Gemini API Error:', error);
      console.error('🔴 Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        type: error.constructor.name
      });

      // Handle specific error types
      if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID') || error.message?.includes('403')) {
        throw new GeminiAPIError(
          'Invalid API key. Please check your Gemini API key configuration.',
          'config'
        );
      }

      if (error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        throw new GeminiAPIError(
          'API quota exceeded. Please try again later.',
          'rate_limit'
        );
      }

      if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        throw new GeminiAPIError(
          'Unable to connect to Gemini API. Please check your internet connection.',
          'network'
        );
      }

      if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
        throw new GeminiAPIError(
          'Content was blocked by safety filters. Please try rephrasing your message.',
          'api'
        );
      }

      // Generic API error with more details
      throw new GeminiAPIError(
        error.message || 'Something went wrong with the AI service. Please try again.',
        'api'
      );
    }
  }

  /**
   * Utility function to sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset rate limit tracking (useful for testing)
   */
  resetRateLimit(): void {
    this.requestTimestamps = [];
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();
export default geminiAIService;
