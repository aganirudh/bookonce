# Theme System Design Document

## Overview

The theme system will provide a comprehensive dark/light mode implementation across the entire travel planning website. The system will be built using React Context for state management, CSS custom properties for theming, and localStorage for persistence. The design leverages the existing CSS variable structure while adding proper theme switching functionality and enhanced dark mode support.

## Architecture

### Core Components

1. **ThemeProvider**: React context provider that manages theme state and switching logic
2. **ThemeToggle**: UI component for switching between themes
3. **useTheme**: Custom hook for accessing theme functionality
4. **Theme Detection**: System preference detection and monitoring
5. **Theme Persistence**: localStorage integration for user preferences

### Theme States

- `light`: Light theme with bright backgrounds and dark text
- `dark`: Dark theme with dark backgrounds and light text  
- `system`: Automatically follows system preference
- `high-contrast`: Accessibility-focused high contrast mode (future enhancement)

## Components and Interfaces

### ThemeProvider Interface

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  systemTheme: 'light' | 'dark';
}
```

### ThemeProvider Implementation

The ThemeProvider will:
- Manage theme state using React useState
- Detect system preference using `window.matchMedia('(prefers-color-scheme: dark)')`
- Listen for system theme changes
- Apply theme classes to document root
- Persist user preferences to localStorage
- Provide theme context to all child components

### ThemeToggle Component

A flexible toggle component that will:
- Display current theme state with appropriate icons (Sun/Moon/System)
- Support multiple display modes (icon-only, with labels, dropdown)
- Provide smooth transitions between states
- Be accessible with proper ARIA labels
- Integrate seamlessly with existing UI components

### CSS Variable Enhancement

Extend the existing CSS variable system:
- Enhance dark mode variables for better coverage
- Add transition properties for smooth theme switching
- Ensure all components use CSS variables consistently
- Add theme-specific shadows, borders, and effects

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  name: string;
  displayName: string;
  cssClass: string;
  variables: Record<string, string>;
}

interface ThemePreference {
  theme: 'light' | 'dark' | 'system';
  timestamp: number;
}
```

### Storage Schema

```typescript
// localStorage key: 'vagabond-theme-preference'
{
  theme: 'light' | 'dark' | 'system',
  timestamp: number
}
```

## Error Handling

### Theme Detection Fallbacks

1. If `matchMedia` is not supported, default to light theme
2. If localStorage is not available, use session-only theme switching
3. If CSS custom properties are not supported, provide graceful degradation

### Error Recovery

- Invalid localStorage data will be cleared and reset to system preference
- Failed theme applications will revert to previous working theme
- Console warnings for debugging without breaking functionality

## Testing Strategy

### Unit Tests

1. **ThemeProvider Tests**
   - Theme state management
   - System preference detection
   - localStorage persistence
   - Context value provision

2. **ThemeToggle Tests**
   - Theme switching functionality
   - UI state updates
   - Accessibility compliance
   - Keyboard navigation

3. **useTheme Hook Tests**
   - Hook return values
   - Theme change handling
   - Error boundary behavior

### Integration Tests

1. **Theme Application Tests**
   - CSS class application to document
   - CSS variable updates
   - Component re-rendering on theme change

2. **Persistence Tests**
   - localStorage read/write operations
   - Theme restoration on page reload
   - System preference override behavior

3. **Cross-Component Tests**
   - Theme consistency across all pages
   - Modal and overlay theming
   - Third-party component integration

### Visual Regression Tests

1. **Component Theming**
   - All major components in both themes
   - Interactive states (hover, focus, active)
   - Form elements and inputs

2. **Page-Level Theming**
   - All main pages in both themes
   - Modal dialogs and overlays
   - Loading states and animations

## Implementation Details

### Theme Application Flow

1. **Initialization**
   - Read stored preference from localStorage
   - Detect system preference
   - Apply initial theme class to document
   - Set up system preference listener

2. **Theme Switching**
   - Update theme state
   - Apply new CSS class to document
   - Store preference in localStorage
   - Trigger re-render of theme-dependent components

3. **System Preference Handling**
   - Listen for `prefers-color-scheme` changes
   - Update system theme state
   - Apply system theme if user preference is 'system'

### CSS Variable Strategy

Enhance existing CSS variables with:
- Complete dark mode color palette
- Smooth transition properties
- Component-specific theming variables
- Accessibility-compliant contrast ratios

### Component Integration

1. **Navbar Integration**
   - Add ThemeToggle to navbar
   - Ensure navbar theming consistency
   - Handle mobile menu theming

2. **Modal and Overlay Theming**
   - Apply theme classes to portal elements
   - Ensure backdrop theming
   - Handle z-index and layering

3. **Third-Party Component Theming**
   - Leaflet map theming
   - Calendar component theming
   - Toast and notification theming

## Accessibility Considerations

### WCAG Compliance

- Maintain AA contrast ratios in both themes
- Provide high contrast mode option
- Ensure focus indicators are visible in both themes
- Support reduced motion preferences

### Screen Reader Support

- Proper ARIA labels for theme toggle
- Announce theme changes to screen readers
- Maintain semantic structure in both themes

### Keyboard Navigation

- Theme toggle accessible via keyboard
- Maintain tab order in both themes
- Provide keyboard shortcuts for theme switching

## Performance Considerations

### Optimization Strategies

1. **CSS Loading**
   - Use CSS custom properties for instant theme switching
   - Avoid loading separate theme stylesheets
   - Minimize CSS recalculation on theme change

2. **JavaScript Performance**
   - Debounce system preference changes
   - Minimize re-renders on theme change
   - Use React.memo for theme-independent components

3. **Storage Efficiency**
   - Minimal localStorage usage
   - Efficient serialization/deserialization
   - Cleanup of outdated preferences

## Browser Support

### Modern Browser Features

- CSS Custom Properties (required)
- matchMedia API (with fallback)
- localStorage (with fallback)
- CSS transitions (progressive enhancement)

### Fallback Strategy

- Graceful degradation for older browsers
- Basic theme switching without transitions
- Default to light theme if features unavailable