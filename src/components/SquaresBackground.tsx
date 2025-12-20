import React, { useMemo } from 'react';
import './SquaresBackground.css';

type Square = {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  bg: string;
};

const COLORS = [
  'rgba(99,102,241,0.12)', // indigo-ish
  'rgba(236,72,153,0.10)', // pink-ish
  'rgba(139,92,246,0.09)', // purple-ish
  'rgba(99,102,241,0.08)',
  'rgba(59,130,246,0.07)',
];

const SquaresBackground: React.FC<{ count?: number }> = ({ count = 28 }) => {
  // Generate a stable list once per mount to avoid re-render jitter/hydration issues
  const squares = useMemo<Square[]>(() => {
    return Array.from({ length: count }).map(() => {
      const left = Math.random() * 100;
      // start across and slightly below/within the viewport so some squares are visible
      const top = 30 + Math.random() * 90; // 30% -> 120%
      const size = Math.round(Math.random() * 72) + 12;
      const delay = -(Math.random() * 14);
      const duration = 10 + Math.random() * 14;
      // slightly higher opacity so squares are visible on dark backgrounds
      const opacity = 0.04 + Math.random() * 0.12;
      const bg = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        left: `${left}%`,
        top: `${top}%`,
        size,
        delay,
        duration,
        opacity,
        bg,
      };
    });
  }, [count]);

  return (
    <div className="squares-bg-container" aria-hidden>
      {squares.map((s, i) => (
        <span
          key={i}
          className="squares-bg-square"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            opacity: s.opacity,
            background: s.bg,
          }}
        />
      ))}
    </div>
  );
};

export default SquaresBackground;
