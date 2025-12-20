/**
 * Theme Toggle Component
 * Provides UI for switching between light, dark, and system themes
 */

import * as React from 'react';
import { Moon, Sun, Monitor, Check, Contrast } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Theme option configuration
 */
interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

/**
 * Available theme options
 */
const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Light theme with bright backgrounds',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Dark theme with dark backgrounds',
  },
  {
    value: 'high-contrast',
    label: 'High Contrast',
    icon: Contrast,
    description: 'High contrast theme for accessibility',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follow system preference',
  },
];

/**
 * Props for ThemeToggle component
 */
interface ThemeToggleProps {
  /** Display mode for the toggle */
  variant?: 'icon' | 'dropdown' | 'button' | 'preview';
  /** Size of the toggle */
  size?: 'sm' | 'md' | 'lg';
  /** Show labels alongside icons */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Alignment for dropdown content */
  align?: 'start' | 'center' | 'end';
  /** Enable theme preview on hover */
  enablePreview?: boolean;
  /** Show loading state */
  showLoadingState?: boolean;
}

/**
 * Get icon for current theme
 */
function getThemeIcon(theme: Theme, resolvedTheme: 'light' | 'dark' | 'high-contrast') {
  if (theme === 'system') {
    return Monitor;
  }
  if (theme === 'high-contrast' || resolvedTheme === 'high-contrast') {
    return Contrast;
  }
  return resolvedTheme === 'dark' ? Moon : Sun;
}

/**
 * Get theme display info
 */
function getThemeInfo(theme: Theme, resolvedTheme: 'light' | 'dark' | 'high-contrast') {
  const option = themeOptions.find(opt => opt.value === theme);
  if (!option) return themeOptions[0];

  return {
    ...option,
    icon: getThemeIcon(theme, resolvedTheme),
  };
}

/**
 * Icon-only theme toggle button
 */
function IconToggle({
  size = 'md',
  className,
  enablePreview = false,
  showLoadingState = true,
}: Pick<ThemeToggleProps, 'size' | 'className' | 'enablePreview' | 'showLoadingState'>) {
  const { theme, resolvedTheme, setTheme, isThemeSwitching, previewTheme } = useTheme();
  const currentTheme = getThemeInfo(theme, resolvedTheme);

  const handleToggle = () => {
    // Cycle through themes: light -> dark -> high-contrast -> system -> light
    const currentIndex = themeOptions.findIndex(opt => opt.value === theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex].value);
  };

  const handlePreview = (previewThemeValue: Theme) => {
    if (enablePreview) {
      previewTheme(previewThemeValue);
    }
  };

  const handlePreviewEnd = () => {
    if (enablePreview) {
      previewTheme(null);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      onMouseEnter={() =>
        enablePreview &&
        handlePreview(
          themeOptions[
            (themeOptions.findIndex(opt => opt.value === theme) + 1) % themeOptions.length
          ].value
        )
      }
      onMouseLeave={handlePreviewEnd}
      className={cn(sizeClasses[size], 'focus-ring interactive-hover touch-target', className)}
      aria-label={`Switch theme. Current: ${currentTheme.label}`}
      title={`Current theme: ${currentTheme.label}. Click to cycle themes.`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <currentTheme.icon className={iconSizes[size]} />
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}

/**
 * Theme preview component with all options
 */
function PreviewToggle({
  size = 'md',
  className,
  align = 'end',
}: Pick<ThemeToggleProps, 'size' | 'className' | 'align'>) {
  const { theme, resolvedTheme, setTheme, previewTheme, previewedTheme, isThemeSwitching } =
    useTheme();
  const currentTheme = getThemeInfo(theme, resolvedTheme);

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4',
  };

  const handlePreview = (previewThemeValue: Theme) => {
    previewTheme(previewThemeValue);
  };

  const handlePreviewEnd = () => {
    previewTheme(null);
  };

  const handleApplyPreview = () => {
    if (previewedTheme) {
      setTheme(previewedTheme);
      previewTheme(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
        {themeOptions.map(option => (
          <Button
            key={option.value}
            variant={theme === option.value ? 'default' : 'ghost'}
            size="sm"
            onMouseEnter={() => handlePreview(option.value)}
            onMouseLeave={handlePreviewEnd}
            onClick={() => setTheme(option.value)}
            disabled={isThemeSwitching}
            className={cn(
              'h-8 w-8 p-0 theme-transition-enhanced',
              previewedTheme === option.value && 'ring-2 ring-primary ring-offset-2',
              isThemeSwitching && 'animate-pulse opacity-50'
            )}
            aria-label={`${option.label} theme`}
            title={option.description}
          >
            <option.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {previewedTheme && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center gap-2"
        >
          <Button size="sm" onClick={handleApplyPreview} className="h-8 px-3 text-xs">
            Apply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewEnd}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Button with label theme toggle
 */
function ButtonToggle({
  size = 'md',
  showLabel = true,
  className,
  enablePreview = false,
  showLoadingState = true,
}: Pick<
  ThemeToggleProps,
  'size' | 'showLabel' | 'className' | 'enablePreview' | 'showLoadingState'
>) {
  const { theme, resolvedTheme, setTheme, isThemeSwitching, previewTheme } = useTheme();
  const currentTheme = getThemeInfo(theme, resolvedTheme);

  const handleToggle = () => {
    // Cycle through themes: light -> dark -> high-contrast -> system -> light
    const currentIndex = themeOptions.findIndex(opt => opt.value === theme);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextIndex].value);
  };

  const handlePreview = (previewThemeValue: Theme) => {
    if (enablePreview) {
      previewTheme(previewThemeValue);
    }
  };

  const handlePreviewEnd = () => {
    if (enablePreview) {
      previewTheme(null);
    }
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4',
  };

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      onMouseEnter={() =>
        enablePreview &&
        handlePreview(
          themeOptions[
            (themeOptions.findIndex(opt => opt.value === theme) + 1) % themeOptions.length
          ].value
        )
      }
      onMouseLeave={handlePreviewEnd}
      className={cn(sizeClasses[size], 'focus-ring interactive-hover gap-2', className)}
      aria-label={`Switch theme. Current: ${currentTheme.label}`}
      title={currentTheme.description}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <currentTheme.icon className={iconSizes[size]} />
        </motion.div>
      </AnimatePresence>
      {showLabel && <span className="font-medium">{currentTheme.label}</span>}
    </Button>
  );
}

/**
 * Dropdown theme selector with preview functionality
 */
function DropdownToggle({
  size = 'md',
  className,
  align = 'end',
  enablePreview = false,
  showLoadingState = true,
}: Pick<ThemeToggleProps, 'size' | 'className' | 'align' | 'enablePreview' | 'showLoadingState'>) {
  const { theme, resolvedTheme, setTheme, isThemeSwitching, previewTheme } = useTheme();
  const currentTheme = getThemeInfo(theme, resolvedTheme);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const handlePreview = (previewThemeValue: Theme) => {
    if (enablePreview) {
      previewTheme(previewThemeValue);
    }
  };

  const handlePreviewEnd = () => {
    if (enablePreview) {
      previewTheme(null);
    }
  };

  return (
    <DropdownMenu onOpenChange={open => !open && handlePreviewEnd()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(sizeClasses[size], 'focus-ring interactive-hover touch-target', className)}
          aria-label={`Theme selector. Current: ${currentTheme.label}`}
          title="Select theme"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <currentTheme.icon className={iconSizes[size]} />
            </motion.div>
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="dropdown min-w-[180px]" sideOffset={8}>
        {themeOptions.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              handlePreviewEnd();
              setTheme(option.value);
            }}
            onMouseEnter={() => handlePreview(option.value)}
            onMouseLeave={handlePreviewEnd}
            className={cn(
              'flex items-center gap-3 px-3 py-2 cursor-pointer focus-ring',
              'hover:bg-hover-overlay active:bg-active-overlay'
            )}
            aria-label={`Switch to ${option.label} theme`}
          >
            <div className="flex items-center gap-3 flex-1">
              <option.icon className="h-4 w-4 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </div>
            {theme === option.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="h-4 w-4 text-primary" />
              </motion.div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Main ThemeToggle component
 */
export function ThemeToggle({
  variant = 'dropdown',
  size = 'md',
  showLabel = false,
  className,
  align = 'end',
  enablePreview = false,
  showLoadingState = true,
}: ThemeToggleProps) {
  switch (variant) {
    case 'icon':
      return (
        <IconToggle
          size={size}
          className={className}
          enablePreview={enablePreview}
          showLoadingState={showLoadingState}
        />
      );
    case 'button':
      return (
        <ButtonToggle
          size={size}
          showLabel={showLabel}
          className={className}
          enablePreview={enablePreview}
          showLoadingState={showLoadingState}
        />
      );
    case 'preview':
      return <PreviewToggle size={size} className={className} align={align} />;
    case 'dropdown':
    default:
      return (
        <DropdownToggle
          size={size}
          className={className}
          align={align}
          enablePreview={enablePreview}
          showLoadingState={showLoadingState}
        />
      );
  }
}

/**
 * Export theme options for external use
 */
export { themeOptions, type ThemeOption };
