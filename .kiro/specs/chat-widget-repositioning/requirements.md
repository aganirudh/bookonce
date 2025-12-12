# Requirements Document

## Introduction

Improve the user interface layout by repositioning the AI chat component from its current large overlay position to a compact, scrollable widget in the bottom right corner, allowing the map to be the primary focus of the interface.

## Glossary

- **AI_Chat_Widget**: The BookOnce AI Travel Assistant chat interface component
- **Map_Component**: The interactive map display showing travel routes and locations
- **Main_Interface**: The primary application layout containing both map and chat components
- **Chat_Container**: The scrollable container that holds chat messages and input

## Requirements

### Requirement 1

**User Story:** As a user, I want the map to be the main focus of the interface, so that I can easily view and interact with travel routes without the chat blocking my view.

#### Acceptance Criteria

1. THE Map_Component SHALL occupy the majority of the viewport space
2. THE AI_Chat_Widget SHALL be positioned in the bottom right corner of the interface
3. THE AI_Chat_Widget SHALL have a maximum width of 350 pixels
4. THE AI_Chat_Widget SHALL have a maximum height of 400 pixels
5. THE Map_Component SHALL remain fully interactive when the AI_Chat_Widget is visible

### Requirement 2

**User Story:** As a user, I want the AI chat to be compact and scrollable, so that I can access chat history without it dominating the screen.

#### Acceptance Criteria

1. THE Chat_Container SHALL implement vertical scrolling for message overflow
2. THE AI_Chat_Widget SHALL maintain a fixed position during map interactions
3. THE Chat_Container SHALL display a maximum of 6 messages before requiring scroll
4. THE AI_Chat_Widget SHALL have rounded corners and subtle shadow for visual separation
5. THE Chat_Container SHALL automatically scroll to the latest message when new messages arrive

### Requirement 3

**User Story:** As a user, I want to be able to minimize or expand the chat widget, so that I can control how much screen space it uses.

#### Acceptance Criteria

1. THE AI_Chat_Widget SHALL include a minimize/expand toggle button
2. WHEN minimized, THE AI_Chat_Widget SHALL show only a small chat icon
3. WHEN expanded, THE AI_Chat_Widget SHALL display the full chat interface
4. THE AI_Chat_Widget SHALL remember its expanded/minimized state during the session
5. THE minimize/expand animation SHALL complete within 300 milliseconds