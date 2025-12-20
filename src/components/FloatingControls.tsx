import { Sliders, Zap } from 'lucide-react';
import { useState } from 'react';

interface FloatingControlsProps {
  onVibeClick: () => void;
  isVibeOpen: boolean;
  instantBookingOnly?: boolean;
  onInstantBookingToggle?: () => void;
}

const FloatingControls = ({
  onVibeClick,
  isVibeOpen,
  instantBookingOnly = false,
  onInstantBookingToggle,
}: FloatingControlsProps) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const buttons = [
    {
      id: 'vibe',
      icon: Sliders,
      label: 'Vibe Controls',
      onClick: onVibeClick,
      isActive: isVibeOpen,
      activeClass: 'bg-primary text-primary-foreground',
      show: true,
    },
    {
      id: 'instant',
      icon: Zap,
      label: instantBookingOnly ? 'Show All Hotels' : 'Instant Booking',
      onClick: onInstantBookingToggle || (() => {}),
      isActive: instantBookingOnly,
      activeClass: 'bg-green-500 text-white',
      show: !!onInstantBookingToggle,
    },
  ].filter(btn => btn.show);

  return (
    <div className="fixed left-8 bottom-8 z-30 flex flex-row gap-2">
      {buttons.map(button => {
        const Icon = button.icon;
        const isHovered = hoveredButton === button.id;

        return (
          <button
            key={button.id}
            onClick={button.onClick}
            onMouseEnter={() => setHoveredButton(button.id)}
            onMouseLeave={() => setHoveredButton(null)}
            className={`
              h-14 rounded-2xl flex items-center justify-center
              transition-all duration-300 ease-in-out
              ${
                button.isActive
                  ? `${button.activeClass} shadow-lg`
                  : 'bg-card/95 backdrop-blur-xl text-card-foreground shadow-md hover:shadow-lg border border-border/50 dark:bg-card/90 dark:border-border/30'
              }
              ${isHovered ? 'px-5' : 'w-14'}
            `}
            aria-label={button.label}
          >
            <div className="flex items-center gap-3 whitespace-nowrap">
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isHovered && <span className="font-medium text-sm">{button.label}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default FloatingControls;
