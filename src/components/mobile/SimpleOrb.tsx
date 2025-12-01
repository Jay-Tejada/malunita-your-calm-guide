import { useState } from 'react';

interface SimpleOrbProps {
  onTap?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  onSwipeUp?: () => void;
}

/**
 * SimpleOrb - Large, thumb-optimized orb button with gradient
 * Clean and minimal - no 3D, just beautiful gradients
 */
export const SimpleOrb = ({ 
  onTap, 
  isRecording = false,
  isProcessing = false,
  onSwipeUp
}: SimpleOrbProps) => {
  const [swipeStart, setSwipeStart] = useState<number | null>(null);

  const getOrbClass = () => {
    if (isRecording) return 'meditation-orb-recording';
    if (isProcessing) return 'meditation-orb-processing';
    return 'meditation-orb';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStart === null) return;
    const swipeEnd = e.changedTouches[0].clientY;
    const diff = swipeStart - swipeEnd;
    
    if (diff > 50 && onSwipeUp) {
      // Swiped up
      onSwipeUp();
      e.preventDefault();
    } else if (Math.abs(diff) < 10 && onTap) {
      // Just a tap
      onTap();
    }
    setSwipeStart(null);
  };

  return (
    <div 
      className={getOrbClass()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        // Fallback for non-touch devices
        if (!('ontouchstart' in window) && onTap) {
          onTap();
        }
      }}
    >
    </div>
  );
};
