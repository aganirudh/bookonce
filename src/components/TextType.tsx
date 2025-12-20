import React, { useEffect, useState } from 'react';
import './TextType.css';

type TextTypeProps = {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pause?: number;
  loop?: boolean;
  className?: string;
};

const TextType: React.FC<TextTypeProps> = ({
  texts,
  typingSpeed = 80,
  deletingSpeed = 40,
  pause = 1200,
  loop = true,
  className = '',
}) => {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const full = texts[index];

    if (!deleting && display.length < full.length) {
      timer = window.setTimeout(() => setDisplay(full.slice(0, display.length + 1)), typingSpeed);
    } else if (!deleting && display.length === full.length) {
      timer = window.setTimeout(() => setDeleting(true), pause);
    } else if (deleting && display.length > 0) {
      timer = window.setTimeout(() => setDisplay(full.slice(0, display.length - 1)), deletingSpeed);
    } else if (deleting && display.length === 0) {
      setDeleting(false);
      setIndex(i => (i + 1) % texts.length);
      if (!loop && index === texts.length - 1) {
        // stop looping: ensure final text typed and do not continue
        setIndex(texts.length - 1);
        setDeleting(false);
      }
    }

    return () => window.clearTimeout(timer);
  }, [display, deleting, index, texts, typingSpeed, deletingSpeed, pause, loop]);

  return (
    <span className="text-type">
      <span className={`text-type-text ${className}`}>{display}</span>
      <span className="text-type-cursor" aria-hidden />
    </span>
  );
};

export default TextType;
