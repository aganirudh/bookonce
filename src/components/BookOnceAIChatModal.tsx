import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trash2, X, Loader2 } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { cn } from '@/lib/utils';

// ============================================================================
// Component
// ============================================================================

export const BookOnceAIChatModal: React.FC = () => {
  const {
    messages,
    isLoading,
    error,
    isOpen,
    setOpen,
    clearMessages,
    sendMessage,
    setError,
  } = useChatStore();

  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Focus Management
  // ============================================================================

  useEffect(() => {
    if (isOpen) {
      // Focus the input when modal opens
      // Small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        const input = document.querySelector<HTMLTextAreaElement>(
          '[aria-label="Message input"]'
        );
        if (input) {
          input.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ============================================================================
  // Screen Reader Announcements
  // ============================================================================

  useEffect(() => {
    // Announce new messages to screen readers
    if (messages.length > 0 && announcementRef.current) {
      const lastMessage = messages[messages.length - 1];
      const announcement = lastMessage.role === 'user' 
        ? `You said: ${lastMessage.content}`
        : `BookOnce AI replied: ${lastMessage.content}`;
      
      announcementRef.current.textContent = announcement;
    }
  }, [messages]);

  useEffect(() => {
    // Announce loading state
    if (isLoading && announcementRef.current) {
      announcementRef.current.textContent = 'BookOnce AI is thinking...';
    }
  }, [isLoading]);

  useEffect(() => {
    // Announce errors
    if (error && announcementRef.current) {
      announcementRef.current.textContent = `Error: ${error}`;
    }
  }, [error]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleClose = () => {
    setOpen(false);
    // Clear error when closing
    if (error) {
      setError(null);
    }
  };

  const handleClearChat = () => {
    // Show confirmation dialog if there are more than 5 messages
    if (messages.length > 5) {
      setShowClearConfirmation(true);
    } else {
      clearMessages();
    }
  };

  const handleConfirmClear = () => {
    clearMessages();
    setShowClearConfirmation(false);
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  // ============================================================================
  // Keyboard Navigation
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close modal on Escape key
      if (e.key === 'Escape' && isOpen && !showClearConfirmation) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showClearConfirmation]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Screen reader announcements - visually hidden but accessible */}
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            'flex flex-col p-0 gap-0',
            // Desktop: centered modal with fixed size
            'sm:max-w-3xl sm:h-[80vh]',
            // Mobile: full screen
            'h-screen max-h-screen w-screen max-w-full sm:w-auto',
            // Animation classes
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            // Hide the default close button
            '[&>button]:hidden'
          )}
          aria-describedby="chat-description"
          aria-label="BookOnce AI Chat Assistant"
          role="dialog"
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold gradient-text">
                  BookOnce AI Assistant
                </DialogTitle>
                <p id="chat-description" className="text-sm text-muted-foreground mt-1">
                  Your travel companion powered by AI
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Clear chat button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearChat}
                  disabled={messages.length === 0 || isLoading}
                  className="shrink-0"
                  aria-label="Clear chat history"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="shrink-0"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Error Display */}
          {error && (
            <div className="px-6 pt-4 shrink-0" role="alert" aria-live="assertive">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Loading Indicator (when waiting for response) */}
          {isLoading && messages.length > 0 && (
            <div className="px-6 pt-4 pb-2 shrink-0" role="status" aria-label="AI is thinking">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary mr-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-accent flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">Thinking</span>
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Message List */}
          <ScrollArea className="flex-1 min-h-0" role="log" aria-label="Chat messages">
            <ChatMessageList messages={messages} />
          </ScrollArea>

          {/* Input Area */}
          <div className="shrink-0">
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isLoading}
              placeholder="Ask me about restaurants, events, travel tips..."
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Chat Confirmation Dialog */}
      <AlertDialog
        open={showClearConfirmation}
        onOpenChange={setShowClearConfirmation}
      >
        <AlertDialogContent role="alertdialog" aria-labelledby="clear-dialog-title" aria-describedby="clear-dialog-description">
          <AlertDialogHeader>
            <AlertDialogTitle id="clear-dialog-title">Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription id="clear-dialog-description">
              This will delete all messages in your current conversation. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel aria-label="Cancel clearing chat">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClear} aria-label="Confirm clear chat">
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};