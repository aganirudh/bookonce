/**
 * Theme Toggle Component Tests
 * Unit tests for the ThemeToggle component functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeToggle } from '../theme-toggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Wrapper component with theme provider
function ThemeToggleWrapper({ children, ...props }: any) {
  return (
    <ThemeProvider>
      <ThemeToggle {...props} />
      {children}
    </ThemeProvider>
  );
}

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Icon Variant', () => {
    it('renders icon toggle button', () => {
      render(<ThemeToggleWrapper variant="icon" />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-label');
    });

    it('cycles through themes on click', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="icon" />);
      
      const toggle = screen.getByRole('button');
      
      // Initial state should be system theme
      expect(toggle.getAttribute('aria-label')).toContain('System');
      
      // Click to cycle to light
      await user.click(toggle);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });

    it('displays correct icon for current theme', () => {
      render(<ThemeToggleWrapper variant="icon" />);
      
      const toggle = screen.getByRole('button');
      const icon = toggle.querySelector('svg');
      
      expect(icon).toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(<ThemeToggleWrapper variant="icon" size={size} />);
        
        const toggle = screen.getByRole('button');
        expect(toggle).toHaveClass(size === 'sm' ? 'h-8' : size === 'md' ? 'h-9' : 'h-10');
        
        unmount();
      });
    });
  });

  describe('Button Variant', () => {
    it('renders button with label', () => {
      render(<ThemeToggleWrapper variant="button" showLabel={true} />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
      expect(toggle.textContent).toBeTruthy();
    });

    it('renders button without label when showLabel is false', () => {
      render(<ThemeToggleWrapper variant="button" showLabel={false} />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toBeInTheDocument();
      // Should only contain icon, no text
      expect(toggle.textContent?.trim()).toBeFalsy();
    });

    it('cycles through themes on click', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="button" showLabel={true} />);
      
      const toggle = screen.getByRole('button');
      
      await user.click(toggle);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Dropdown Variant', () => {
    it('renders dropdown trigger', () => {
      render(<ThemeToggleWrapper variant="dropdown" />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-label');
    });

    it('opens dropdown menu on click', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="dropdown" />);
      
      const trigger = screen.getByRole('button');
      
      await user.click(trigger);
      
      // Should show menu items
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBe(4); // light, dark, high-contrast, system
    });

    it('shows all theme options in dropdown', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="dropdown" />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('High Contrast')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('selects theme from dropdown', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="dropdown" />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      const darkOption = screen.getByRole('menuitem', { name: /dark/i });
      await user.click(darkOption);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'vagabond-theme-preference',
          expect.stringContaining('"theme":"dark"')
        );
      });
    });

    it('shows check mark for current theme', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="dropdown" />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      // System should be selected by default
      const systemOption = screen.getByRole('menuitem', { name: /system/i });
      const checkIcon = systemOption.querySelector('svg[class*="lucide-check"]');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ThemeToggleWrapper variant="icon" />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('aria-label');
      expect(toggle.getAttribute('aria-label')).toContain('Switch theme');
    });

    it('has proper title attributes', () => {
      render(<ThemeToggleWrapper variant="icon" />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveAttribute('title');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="icon" />);
      
      const toggle = screen.getByRole('button');
      
      // Focus with tab
      await user.tab();
      expect(toggle).toHaveFocus();
      
      // Activate with Enter
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });

    it('supports Space key activation', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="icon" />);
      
      const toggle = screen.getByRole('button');
      toggle.focus();
      
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<ThemeToggleWrapper variant="icon" className="custom-class" />);
      
      const toggle = screen.getByRole('button');
      expect(toggle).toHaveClass('custom-class');
    });

    it('supports different alignment for dropdown', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggleWrapper variant="dropdown" align="start" />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      // Menu should be present (alignment is handled by Radix UI)
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles missing theme context gracefully', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<ThemeToggle variant="icon" />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });
});