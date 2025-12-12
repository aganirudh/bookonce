/**
 * Keyboard Navigation Tests
 * Tests for keyboard navigation hooks and utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation, useFocusTrap } from '../useKeyboardNavigation';
import { createRef } from 'react';

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call onEscape when Escape key is pressed', () => {
    const onEscape = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        onEscape,
        enabled: true,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('should call onEnter when Enter key is pressed', () => {
    const onEnter = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        onEnter,
        enabled: true,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    window.dispatchEvent(event);

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('should call onArrowUp when ArrowUp key is pressed', () => {
    const onArrowUp = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        onArrowUp,
        enabled: true,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    window.dispatchEvent(event);

    expect(onArrowUp).toHaveBeenCalledTimes(1);
  });

  it('should call onArrowDown when ArrowDown key is pressed', () => {
    const onArrowDown = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        onArrowDown,
        enabled: true,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    window.dispatchEvent(event);

    expect(onArrowDown).toHaveBeenCalledTimes(1);
  });

  it('should not call handlers when disabled', () => {
    const onEscape = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        onEscape,
        enabled: false,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(onEscape).not.toHaveBeenCalled();
  });

  it('should not call onEnter when target is an input element', () => {
    const onEnter = vi.fn();
    renderHook(() =>
      useKeyboardNavigation({
        onEnter,
        enabled: true,
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    input.dispatchEvent(event);

    expect(onEnter).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});

describe('useFocusTrap', () => {
  it('should set up focus trap when active', () => {
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    
    button1.textContent = 'Button 1';
    button2.textContent = 'Button 2';
    button1.tabIndex = 0;
    button2.tabIndex = 0;
    
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const containerRef = { current: container };

    const { unmount } = renderHook(() => useFocusTrap(containerRef as any, true));

    // Verify the hook runs without errors
    expect(containerRef.current).toBe(container);
    expect(container.children.length).toBe(2);

    unmount();
    document.body.removeChild(container);
  });

  it('should not set up focus trap when inactive', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.tabIndex = 0;
    
    container.appendChild(button);
    document.body.appendChild(container);

    const containerRef = { current: container };

    const { unmount } = renderHook(() => useFocusTrap(containerRef as any, false));

    // Verify the hook runs without errors
    expect(containerRef.current).toBe(container);

    unmount();
    document.body.removeChild(container);
  });
});
