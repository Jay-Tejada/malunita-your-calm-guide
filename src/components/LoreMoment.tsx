import { useEffect, useState } from 'react';

interface LoreMomentProps {
  text: string | null;
  onDismiss: () => void;
}

export const LoreMoment = ({ text, onDismiss }: LoreMomentProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (text) {
      // Slight delay before fade in
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [text]);

  if (!text) return null;

  return (
    <div
      className={`
        absolute top-8 left-1/2 -translate-x-1/2 z-30
        max-w-xs px-6 py-3
        text-sm text-center
        text-foreground/70
        pointer-events-auto cursor-pointer
        transition-all duration-1000 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
      onClick={onDismiss}
      style={{
        textShadow: '0 2px 12px hsl(var(--background) / 0.6)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 300,
        letterSpacing: '0.02em',
        lineHeight: '1.6',
      }}
    >
      {text}
    </div>
  );
};
