import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X, Loader2, Sparkles, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { ChatMessageList } from '@/components/chat/ChatMessageList';


interface BookOnceAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const BookOnceAISidebar: React.FC<BookOnceAISidebarProps> = ({
  isOpen,
  onClose,
  onToggle,
}) => {
  const {
    messages,
    isLoading,
    error,
    clearMessages,
    sendMessage,
    setError,
  } = useChatStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Focus Management
  // ============================================================================

  useEffect(() => {
    if (isOpen && !isMinimized) {
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
  }, [isOpen, isMinimized]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      setError(null);
      await sendMessage(content);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err?.message || 'Failed to send message. Please try again.');
    }
  };

  const handleClearMessages = () => {
    clearMessages();
  };

  return (
    <>
      {/* Chat Widget - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        {/* Chat Button (when closed) */}
        {!isOpen && (
          <div className="group">
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                Get AI help while booking!
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            
            <Button
              onClick={onToggle}
              size="lg"
              className="rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white border-0 h-16 px-6 font-semibold text-base backdrop-blur-sm hover:scale-105"
            >
              <Sparkles className="h-6 w-6 mr-2 animate-pulse" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">BookOnce AI</span>
                <span className="text-xs opacity-90">Travel Assistant</span>
              </div>
            </Button>
          </div>
        )}

        {/* Chat Widget (when open) */}
        {isOpen && (
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-80 h-96 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs">BookOnce AI</h3>
                  <p className="text-xs text-muted-foreground">Travel Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Minimized State */}
            {isMinimized && (
              <div className="p-4 text-center flex-1 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="flex flex-col items-center gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">Expand Chat</span>
                </Button>
              </div>
            )}

            {/* Full Chat Interface */}
            {!isMinimized && (
              <>
                {/* Error Display */}
                {error && (
                  <Alert className="m-2 border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {error}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setError(null)}
                        className="ml-1 h-auto p-0 text-xs underline"
                      >
                        Dismiss
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Chat Messages */}
                <div className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 px-3">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 mb-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-xs mb-1">Hi! I'm your AI Assistant</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Ask me about flights, hotels, or travel tips!
                        </p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <ChatMessageList messages={messages} />
                      </div>
                    )}

                    {/* Loading Indicator */}
                    {isLoading && (
                      <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>AI is thinking...</span>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Chat Input */}
                  <div className="border-t border-border p-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask me about your journey..."
                        className="flex-1 text-xs px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            if (target.value.trim()) {
                              handleSendMessage(target.value);
                              target.value = '';
                            }
                          }
                        }}
                        disabled={isLoading}
                      />
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={isLoading}
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Ask me about your journey..."]') as HTMLInputElement;
                          if (input?.value.trim()) {
                            handleSendMessage(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Send
                      </Button>
                    </div>
                    
                    {messages.length > 0 && (
                      <div className="flex justify-between items-center mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearMessages}
                          className="text-xs text-muted-foreground h-auto p-0"
                        >
                          Clear
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {messages.length} msg{messages.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Screen Reader Announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </>
  );
};