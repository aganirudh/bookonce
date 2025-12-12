# Implementation Plan

- [x] 1. Install dependencies and set up core infrastructure





  - Install @google/generative-ai package using npm
  - Create types file at `src/types/chat.ts` with ChatMessage, ChatStore, and GeminiConfig interfaces
  - _Requirements: 5.1, 5.2_

- [x] 2. Implement Gemini AI Service






  - [x] 2.1 Create GeminiAIService class at `src/services/GeminiAIService.ts`

    - Implement initialize() method to set up Gemini SDK with API key from environment
    - Implement sendMessage() method that accepts message and conversation history
    - Implement isConfigured() method to check if API key is present
    - Add system prompt configuration for travel assistant context
    - _Requirements: 3.1, 5.1, 5.2_
  

  - [x] 2.2 Add error handling and retry logic to GeminiAIService





    - Implement try-catch blocks for API calls
    - Add exponential backoff retry logic (max 3 attempts)
    - Handle specific error types (network, rate limit, API errors)
    - Add timeout handling (30 seconds max)
    - _Requirements: 3.5, 5.5_

  
  - [x] 2.3 Implement rate limiting in GeminiAIService





    - Track request timestamps
    - Enforce max 10 requests per minute limit
    - Return appropriate error when rate limit exceeded
    - _Requirements: 5.4_

- [x] 3. Create chat state management with Zustand

  - [x] 3.1 Create chat store at `src/stores/chatStore.ts`
    - Define ChatStore interface with messages, isLoading, error, isOpen states
    - Implement addMessage action
    - Implement clearMessages action
    - Implement setLoading, setError, setOpen actions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.2, 7.3_

  
  - [x] 3.2 Implement sendMessage action in chat store

    - Integrate with GeminiAIService
    - Add user message to store immediately
    - Set loading state while waiting for response
    - Add AI response to store when received
    - Handle errors and update error state
    - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.3, 3.5_

- [x] 4. Build ChatInput component




  - Create ChatInput component at `src/components/chat/ChatInput.tsx`
  - Add textarea with auto-resize functionality
  - Implement send button with loading state
  - Add Enter to send (Shift+Enter for new line) keyboard handling
  - Add character limit (2000 chars) with indicator
  - Disable input during loading state
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Build ChatMessageList component





  - Create ChatMessageList component at `src/components/chat/ChatMessageList.tsx`
  - Render messages in chronological order
  - Apply distinct styling for user vs AI messages (user: blue background, AI: gray background)
  - Display timestamps for each message
  - Implement empty state with welcome message listing capabilities
  - Add auto-scroll to latest message functionality
  - _Requirements: 3.4, 4.1, 4.2, 4.3_

- [x] 6. Build VagabonAIChatModal component




  - [x] 6.1 Create main modal component at `src/components/VagabonAIChatModal.tsx`


    - Use shadcn/ui Dialog component
    - Implement responsive design (full screen on mobile, centered on desktop)
    - Add header with title and clear chat button
    - Integrate ChatMessageList in ScrollArea
    - Integrate ChatInput at bottom
    - Connect to chat store for state management
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.4_
  
  - [x] 6.2 Add modal interactions and error handling


    - Implement close functionality (close button and Escape key)
    - Add loading indicator display
    - Add error message display with Alert component
    - Implement clear chat confirmation dialog (when >5 messages)
    - _Requirements: 1.5, 3.5, 7.1, 7.5_
  
  - [x] 6.3 Add animations and polish


    - Add modal entrance animation (fade + scale)
    - Add message appearance animations (slide up + fade)
    - Add loading dots animation
    - Add send button scale animation on click
    - _Requirements: 6.1, 6.2_

- [x] 7. Integrate with Navbar



  - Update Navbar component at `src/components/Navbar.tsx`
  - Import useChatStore hook
  - Add onClick handler to existing "Vagabond AI" button to call setOpen(true)
  - Update button styling to show active state when isOpen is true
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 8. Integrate modal at app level





  - Update App.tsx to import VagabonAIChatModal
  - Render VagabonAIChatModal component at app level (outside BrowserRouter)
  - Ensure modal state is managed by Zustand store
  - _Requirements: 1.3, 1.4_

- [x] 9. Add accessibility features





  - Add ARIA labels to all interactive elements in chat components
  - Implement keyboard navigation (Tab, Escape, Enter)
  - Add focus management (focus input when modal opens)
  - Add screen reader announcements for new messages
  - Ensure proper contrast ratios for all text
  - Test with keyboard-only navigation
  - _Requirements: 6.2, 6.3_

- [x] 10. Write tests for core functionality





  - [x] 10.1 Write unit tests for GeminiAIService


    - Test API initialization with valid/invalid keys
    - Test sendMessage with mocked API responses
    - Test error handling scenarios
    - Test rate limiting logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  

  - [x] 10.2 Write unit tests for chat store

    - Test addMessage action
    - Test clearMessages action
    - Test sendMessage action with mocked service
    - Test loading and error states
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  

  - [x] 10.3 Write component tests

    - Test ChatInput send functionality and keyboard handling
    - Test ChatMessageList rendering and empty state
    - Test VagabonAIChatModal open/close and interactions
    - _Requirements: 1.5, 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_
  

  - [x] 10.4 Write integration test for end-to-end chat flow

    - Test opening modal from navbar
    - Test sending message and receiving response
    - Test clearing chat
    - Test error scenarios
    - _Requirements: 1.1, 1.2, 2.3, 2.4, 3.1, 3.2, 3.3, 7.1, 7.2_
