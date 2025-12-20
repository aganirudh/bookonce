/**
 * ChatInput Component
 *
 * Text input area for sending messages to the AI assistant.
 * Features:
 * - Auto-resize textarea
 * - Enter to send (Shift+Enter for new line)
 * - Character limit (2000 chars) with indicator
 * - Loading state with disabled input
 * - Send button with loading indicator
 *
 * Requirements: 2.1, 2.2, 2.3
 */

import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Constants
// ============================================================================

const MAX_CHARACTERS = 2000;
const MIN_TEXTAREA_HEIGHT = 80; // matches Textarea min-h-[80px]
const MAX_TEXTAREA_HEIGHT = 200;

// ============================================================================
// Types
// ============================================================================

export interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = 'Ask me anything about travel...',
  className,
}) => {
  // State
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Character count and validation
  const characterCount = message.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const canSend = message.trim().length > 0 && !isOverLimit && !isLoading;

  // ============================================================================
  // Auto-resize functionality
  // ============================================================================

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height based on content
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, MIN_TEXTAREA_HEIGHT),
      MAX_TEXTAREA_HEIGHT
    );

    textarea.style.height = `${newHeight}px`;
  };

  // Adjust height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSend = () => {
    if (!canSend) return;

    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSend(trimmedMessage);
      setMessage('');

      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ============================================================================
  // Character Count Indicator
  // ============================================================================

  const getCharacterCountColor = () => {
    if (isOverLimit) return 'text-destructive';
    if (characterCount > MAX_CHARACTERS * 0.9) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  const showCharacterCount = characterCount > MAX_CHARACTERS * 0.8;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn('flex flex-col gap-2 p-4 border-t bg-background', className)}>
      {/* Character count indicator */}
      {showCharacterCount && (
        <div className="flex justify-end">
          <span
            id="character-count"
            className={cn('text-xs', getCharacterCountColor())}
            role="status"
            aria-live="polite"
          >
            {characterCount} / {MAX_CHARACTERS}
          </span>
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            'resize-none transition-all',
            isOverLimit && 'border-destructive focus-visible:ring-destructive'
          )}
          style={{
            minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
            maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
          }}
          aria-label="Message input"
          aria-describedby={showCharacterCount ? 'character-count helper-text' : 'helper-text'}
          aria-invalid={isOverLimit}
          aria-required="true"
        />

        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className="shrink-0 h-10 w-10 active:scale-95 transition-transform"
          aria-label={isLoading ? 'Sending message' : 'Send message'}
          title={isLoading ? 'Sending...' : 'Send message (Enter)'}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Helper text */}
      <div
        id="helper-text"
        className="flex justify-between items-center text-xs text-muted-foreground"
      >
        <span>Press Enter to send, Shift+Enter for new line</span>
        {isOverLimit && (
          <span className="text-destructive font-medium" role="alert">
            Message is too long
          </span>
        )}
      </div>
    </div>
  );
};
