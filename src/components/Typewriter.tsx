import React, { useEffect, useState } from 'react';
import './Typewriter.css';

type TypewriterProps = {
  texts: string[];
  typingSpeed?: number; // ms per char
  deletingSpeed?: number; // ms per char when deleting
  pause?: number; // pause between typing and deleting
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  onActiveChange?: (active: boolean) => void;
};

const Typewriter: React.FC<TypewriterProps> = ({
  texts,
  typingSpeed = 80,
  deletingSpeed = 40,
  pause = 1500,
  loop = true,
  className = '',
  showCursor = true,
  onActiveChange,
}) => {
  const [textIndex, setTextIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const fullText = texts[textIndex];

    if (!isDeleting && display.length < fullText.length) {
      timer = window.setTimeout(() => {
        setDisplay(fullText.slice(0, display.length + 1));
      }, typingSpeed);
    } else if (isDeleting && display.length > 0) {
      timer = window.setTimeout(() => {
        setDisplay(fullText.slice(0, display.length - 1));
      }, deletingSpeed);
    } else if (!isDeleting && display.length === fullText.length) {
      // pause before deleting or move to next if not deleting
      timer = window.setTimeout(() => {
        if (loop) setIsDeleting(true);
      }, pause);
    } else if (isDeleting && display.length === 0) {
      setIsDeleting(false);
      setTextIndex(prev => (prev + 1) % texts.length);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [display, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pause, loop]);

  // Notify parent whether this typewriter is active (typing/deleting or completed when not looping)
  useEffect(() => {
    if (onActiveChange) {
      const fullText = texts[textIndex];
      const active =
        isDeleting ||
        display.length < fullText.length ||
        (!loop && display.length === fullText.length);
      onActiveChange(active);
    }
  }, [display, isDeleting, textIndex, texts, loop, onActiveChange]);

  return (
    <span className="typewriter" aria-live="polite">
      <span className={`typewriter-text ${className}`}>{display}</span>
      {showCursor !== false ? <span className="typewriter-cursor" aria-hidden /> : null}
    </span>
  );
};

export default Typewriter;
