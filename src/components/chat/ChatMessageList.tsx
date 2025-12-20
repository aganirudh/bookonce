/**
 * ChatMessageList Component
 *
 * Displays the list of chat messages with proper styling and formatting.
 * Features:
 * - Chronological message ordering
 * - Distinct styling for user vs AI messages
 * - Timestamp display
 * - Empty state with welcome message
 * - Auto-scroll to latest message
 *
 * Requirements: 3.4, 4.1, 4.2, 4.3
 */

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessageListProps {
  messages: ChatMessage[];
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format timestamp for display
 */
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const messageDate = new Date(date);

  // Check if message is from today
  const isToday =
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();

  if (isToday) {
    // Show time only for today's messages
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    // Show date and time for older messages
    return messageDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
};

// ============================================================================
// Empty State Component
// ============================================================================

const EmptyState: React.FC = () => {
  return (
    <div
      className="flex flex-col items-center justify-center h-full p-8 text-center"
      role="region"
      aria-label="Welcome message"
    >
      <div
        className="mb-4 p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
        aria-hidden="true"
      >
        <Bot className="h-8 w-8 text-white" />
      </div>

      <h3 className="text-xl font-semibold mb-2">
        <span role="img" aria-label="Waving hand">
          👋
        </span>{' '}
        Welcome to BookOnce AI!
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md">I can help you with:</p>

      <ul
        className="text-sm text-muted-foreground space-y-2 text-left max-w-md"
        aria-label="Available assistance topics"
      >
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5" aria-hidden="true">
            •
          </span>
          <span>Restaurant recommendations</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5" aria-hidden="true">
            •
          </span>
          <span>Local events and activities</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5" aria-hidden="true">
            •
          </span>
          <span>Travel planning and tips</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5" aria-hidden="true">
            •
          </span>
          <span>Accommodation suggestions</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5" aria-hidden="true">
            •
          </span>
          <span>General travel information</span>
        </li>
      </ul>

      <p className="text-sm text-muted-foreground mt-6 font-medium">Ask me anything!</p>
    </div>
  );
};

// ============================================================================
// Message Component
// ============================================================================

interface MessageItemProps {
  message: ChatMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-all',
        'animate-in slide-in-from-bottom-2 fade-in duration-300',
        isUser
          ? 'bg-primary/10 border border-primary/20 ml-8 dark:bg-primary/20 dark:border-primary/30'
          : 'bg-secondary/50 border border-border mr-8 dark:bg-secondary dark:border-border'
      )}
      role="article"
      aria-label={`${isUser ? 'Your' : 'BookOnce AI'} message at ${formatTimestamp(message.timestamp)}`}
    >
      {/* Avatar */}
      <div
        className={cn(
          'shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold" id={`message-${message.id}-sender`}>
            {isUser ? 'You' : 'BookOnce AI'}
          </span>
          <time
            className="text-xs text-muted-foreground"
            dateTime={new Date(message.timestamp).toISOString()}
            aria-label={`Sent at ${formatTimestamp(message.timestamp)}`}
          >
            {formatTimestamp(message.timestamp)}
          </time>
        </div>

        <div
          className="text-sm whitespace-pre-wrap break-words"
          aria-labelledby={`message-${message.id}-sender`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, className }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Auto-scroll to latest message
  // ============================================================================

  const scrollToBottom = () => {
    // Check if scrollIntoView is available (not available in some test environments)
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col h-full overflow-y-auto', className)}
      role="region"
      aria-label="Chat conversation"
    >
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {messages.map(message => (
            <MessageItem key={message.id} message={message} />
          ))}

          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
