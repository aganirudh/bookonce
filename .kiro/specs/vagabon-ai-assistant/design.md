# Vagabon AI Assistant - Design Document

## Overview

The Vagabon AI Assistant is a comprehensive travel chatbot that integrates with the existing "Vagabond AI" button in the navigation bar. When clicked, it opens a modal chat interface powered by Google's Gemini API, providing users with intelligent assistance for food recommendations, event discovery, travel planning, accommodation suggestions, and general travel information.

The design follows the existing application architecture using React, TypeScript, and shadcn/ui components, ensuring consistency with the current UI/UX patterns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Navbar                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Vagabond AI Button (existing) → onClick handler     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              VagabonAIChatModal Component                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Chat Interface (Dialog/Modal)                        │   │
│  │  ├─ Header (Title, Clear Chat, Close)                │   │
│  │  ├─ Message List (ScrollArea)                        │   │
│  │  │  ├─ User Messages                                 │   │
│  │  │  └─ AI Messages                                   │   │
│  │  └─ Input Area (TextArea + Send Button)             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              GeminiAIService                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  - Initialize Gemini API                             │   │
│  │  - Send messages with context                        │   │
│  │  - Handle streaming responses                        │   │
│  │  - Error handling & retry logic                      │   │
│  │  - Rate limiting                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Gemini API                               │
│              (External Service)                              │
└─────────────────────────────────────────────────────────────┘
```

### State Management

We'll use Zustand for managing the chat state, following the existing pattern in the application:

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOpen: (open: boolean) => void;
}
```

## Components and Interfaces

### 1. VagabonAIChatModal Component

**Location:** `src/components/VagabonAIChatModal.tsx`

**Purpose:** Main modal component that displays the chat interface

**Props:**
```typescript
interface VagabonAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Key Features:**
- Uses shadcn/ui Dialog component for modal
- Responsive design (full screen on mobile, centered modal on desktop)
- Keyboard navigation support (Escape to close)
- Auto-scroll to latest message
- Loading states and error handling

**Structure:**
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-3xl h-[80vh]">
    <DialogHeader>
      <DialogTitle>Vagabond AI Assistant</DialogTitle>
      <Button onClick={handleClearChat}>Clear Chat</Button>
    </DialogHeader>
    
    <ScrollArea className="flex-1">
      <ChatMessageList messages={messages} />
    </ScrollArea>
    
    <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
  </DialogContent>
</Dialog>
```

### 2. ChatMessageList Component

**Location:** `src/components/chat/ChatMessageList.tsx`

**Purpose:** Renders the list of chat messages with proper styling

**Props:**
```typescript
interface ChatMessageListProps {
  messages: ChatMessage[];
}
```

**Features:**
- Distinct styling for user vs AI messages
- Markdown rendering for AI responses
- Timestamp display
- Empty state with welcome message

### 3. ChatInput Component

**Location:** `src/components/chat/ChatInput.tsx`

**Purpose:** Input area for user messages

**Props:**
```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}
```

**Features:**
- Textarea with auto-resize
- Send button with loading state
- Enter to send (Shift+Enter for new line)
- Character limit indicator
- Disabled state during loading

### 4. GeminiAIService

**Location:** `src/services/GeminiAIService.ts`

**Purpose:** Service layer for interacting with Gemini API

**Interface:**
```typescript
interface GeminiAIService {
  initialize(): void;
  sendMessage(message: string, conversationHistory: ChatMessage[]): Promise<string>;
  isConfigured(): boolean;
}
```

**Key Responsibilities:**
- Initialize Gemini SDK with API key from environment
- Manage conversation context
- Handle API errors and retries
- Implement rate limiting
- Format responses

### 5. useChatStore Hook

**Location:** `src/stores/chatStore.ts`

**Purpose:** Zustand store for chat state management

**Store Interface:**
```typescript
interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOpen: (open: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
}
```

## Data Models

### ChatMessage

```typescript
interface ChatMessage {
  id: string;              // Unique identifier (UUID)
  role: 'user' | 'assistant';  // Message sender
  content: string;         // Message text
  timestamp: Date;         // When message was sent
}
```

### GeminiConfig

```typescript
interface GeminiConfig {
  apiKey: string;
  model: string;           // Default: 'gemini-pro'
  maxTokens?: number;      // Optional token limit
  temperature?: number;    // Creativity level (0-1)
}
```

### ChatSession

```typescript
interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Integration Points

### 1. Navbar Integration

**File:** `src/components/Navbar.tsx`

**Changes Required:**
- Add `onClick` handler to the existing "Vagabond AI" button
- Import and use the chat store to toggle modal visibility
- Update button styling to show active state when chat is open

```typescript
const { isOpen, setOpen } = useChatStore();

// Update the Vagabond AI nav item
{
  icon: Sparkles,
  label: "Vagabond AI",
  onClick: () => setOpen(true),
  highlight: true,
  isActive: isOpen
}
```

### 2. App-Level Integration

**File:** `src/App.tsx`

**Changes Required:**
- Import VagabonAIChatModal component
- Render modal at app level (outside routes)
- Modal state managed by Zustand store

```tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <VagabonAIChatModal />  {/* Add this */}
      <BrowserRouter>
        {/* Routes */}
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
</QueryClientProvider>
```

### 3. Environment Configuration

**File:** `.env`

**Required Variables:**
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

The API key is already configured in `.env.example`, so users just need to add their actual key.

## Error Handling

### Error Types and Handling Strategy

1. **API Key Missing/Invalid**
   - Detection: Check on service initialization
   - User Message: "AI Assistant is not configured. Please contact support."
   - Action: Disable send button, show error banner

2. **Network Errors**
   - Detection: Catch network failures
   - User Message: "Unable to connect. Please check your internet connection."
   - Action: Retry up to 3 times with exponential backoff

3. **Rate Limiting**
   - Detection: 429 status code from API
   - User Message: "Too many requests. Please wait a moment and try again."
   - Action: Implement client-side rate limiting (max 10 requests/minute)

4. **API Errors**
   - Detection: Non-200 response codes
   - User Message: "Something went wrong. Please try again."
   - Action: Log error details, show retry option

5. **Timeout**
   - Detection: Request takes longer than 30 seconds
   - User Message: "Request timed out. Please try again."
   - Action: Cancel request, allow retry

### Error Display

```tsx
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

## Testing Strategy

### Unit Tests

1. **GeminiAIService Tests**
   - Test API initialization
   - Test message sending with mocked API
   - Test error handling scenarios
   - Test rate limiting logic

2. **ChatStore Tests**
   - Test message addition
   - Test message clearing
   - Test loading states
   - Test error states

3. **Component Tests**
   - ChatInput: Test input handling, send functionality
   - ChatMessageList: Test message rendering, empty state
   - VagabonAIChatModal: Test open/close, keyboard navigation

### Integration Tests

1. **End-to-End Chat Flow**
   - Open modal from navbar
   - Send message
   - Receive AI response
   - Clear chat
   - Close modal

2. **Error Scenarios**
   - Test with invalid API key
   - Test network failure handling
   - Test rate limiting behavior

### Accessibility Tests

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Escape to close modal
   - Enter to send message

2. **Screen Reader**
   - Proper ARIA labels
   - Message announcements
   - Loading state announcements

## Performance Considerations

### 1. Message Rendering Optimization

- Use `React.memo` for message components
- Virtualize message list for long conversations (if needed)
- Lazy load markdown renderer

### 2. API Call Optimization

- Debounce rapid message sends
- Implement request cancellation for pending requests
- Cache API responses (optional for future enhancement)

### 3. Bundle Size

- Lazy load the chat modal component
- Use dynamic imports for Gemini SDK
- Minimize markdown renderer bundle size

### 4. State Management

- Persist chat history in sessionStorage (optional)
- Clear old messages after threshold (e.g., 100 messages)
- Optimize re-renders with proper memoization

## Security Considerations

### 1. API Key Protection

- Store API key in environment variables
- Never expose key in client-side code
- Consider moving API calls to backend (future enhancement)

### 2. Input Sanitization

- Sanitize user input before sending to API
- Prevent XSS in rendered markdown
- Limit message length (max 2000 characters)

### 3. Rate Limiting

- Client-side: Max 10 requests per minute
- Track request timestamps
- Show cooldown timer to user

### 4. Content Filtering

- Rely on Gemini's built-in safety filters
- Handle inappropriate content responses gracefully
- Log and report abuse (future enhancement)

## UI/UX Design

### Visual Design

**Modal Dimensions:**
- Desktop: 800px width, 80vh height
- Mobile: Full screen

**Color Scheme:**
- User messages: Light blue background (`bg-blue-50`)
- AI messages: Light gray background (`bg-gray-50`)
- Accent: Gradient from existing theme (`gradient-accent`)

**Typography:**
- Message text: `text-sm` (14px)
- Timestamps: `text-xs text-muted-foreground` (12px)
- Input: `text-base` (16px)

### Animations

- Modal entrance: Fade in + scale up (200ms)
- Message appearance: Slide up + fade in (150ms)
- Loading indicator: Pulsing dots animation
- Send button: Scale on click

### Responsive Behavior

**Desktop (≥768px):**
- Centered modal with backdrop
- Fixed width (800px)
- Scrollable message area

**Mobile (<768px):**
- Full screen modal
- Bottom-fixed input area
- Optimized touch targets (min 44px)

### Empty State

```
┌─────────────────────────────────────┐
│   👋 Welcome to Vagabond AI!        │
│                                     │
│   I can help you with:              │
│   • Restaurant recommendations      │
│   • Local events and activities     │
│   • Travel planning and tips        │
│   • Accommodation suggestions       │
│   • General travel information      │
│                                     │
│   Ask me anything!                  │
└─────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. Install Gemini SDK dependency
2. Create GeminiAIService
3. Set up chat store with Zustand
4. Create basic data models and types

### Phase 2: UI Components
1. Create VagabonAIChatModal component
2. Create ChatMessageList component
3. Create ChatInput component
4. Style components with Tailwind

### Phase 3: Integration
1. Connect Navbar button to modal
2. Wire up service to store
3. Implement message sending flow
4. Add error handling

### Phase 4: Polish & Testing
1. Add animations and transitions
2. Implement accessibility features
3. Write unit and integration tests
4. Performance optimization

## Future Enhancements

1. **Message History Persistence**
   - Save conversations to localStorage
   - Allow users to view past conversations
   - Export chat history

2. **Rich Media Support**
   - Display images in responses
   - Support for location maps
   - Embedded booking links

3. **Voice Input**
   - Speech-to-text for message input
   - Text-to-speech for AI responses

4. **Contextual Awareness**
   - Pass current page context to AI
   - Suggest relevant queries based on user location
   - Integration with booking system

5. **Multi-language Support**
   - Detect user language
   - Translate responses
   - Support for multiple locales

6. **Backend Integration**
   - Move API calls to backend for security
   - Implement user-specific chat history
   - Advanced analytics and monitoring

## Dependencies

### New Dependencies to Install

```json
{
  "@google/generative-ai": "^0.21.0"
}
```

### Existing Dependencies Used

- `@radix-ui/react-dialog` - Modal component
- `@radix-ui/react-scroll-area` - Scrollable message list
- `lucide-react` - Icons
- `zustand` - State management
- `framer-motion` - Animations
- `react-hook-form` - Form handling (optional)
- `zod` - Input validation (optional)

## Configuration

### Environment Variables

```bash
# Required
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional (with defaults)
VITE_GEMINI_MODEL=gemini-pro
VITE_GEMINI_MAX_TOKENS=2048
VITE_GEMINI_TEMPERATURE=0.7
```

### Gemini API Configuration

```typescript
const config = {
  model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-pro',
  generationConfig: {
    maxOutputTokens: parseInt(import.meta.env.VITE_GEMINI_MAX_TOKENS) || 2048,
    temperature: parseFloat(import.meta.env.VITE_GEMINI_TEMPERATURE) || 0.7,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // Additional safety settings...
  ],
};
```

### System Prompt

The AI assistant will be initialized with a system prompt to guide its behavior:

```typescript
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
```

## Monitoring and Analytics

### Metrics to Track

1. **Usage Metrics**
   - Number of chat sessions opened
   - Messages sent per session
   - Average session duration
   - Most common query types

2. **Performance Metrics**
   - API response time
   - Error rate
   - Rate limit hits
   - Modal load time

3. **User Engagement**
   - Repeat usage rate
   - Messages per user
   - Feature discovery rate
   - Conversion to bookings (future)

### Implementation

Use existing AnalyticsService pattern:

```typescript
// Track chat opened
AnalyticsService.trackEvent('chat_opened', {
  source: 'navbar',
  timestamp: new Date().toISOString(),
});

// Track message sent
AnalyticsService.trackEvent('chat_message_sent', {
  messageLength: message.length,
  responseTime: responseTime,
});
```

## Conclusion

This design provides a comprehensive, production-ready implementation of the Vagabon AI Assistant. It follows the existing application patterns, ensures security and performance, and provides a solid foundation for future enhancements. The modular architecture allows for easy testing and maintenance while delivering a seamless user experience.
