import { useState, useRef } from 'react';

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
  const touchStartTime = useRef<number>(0);

  const getOrbClass = () => {
    if (isRecording) return 'meditation-orb-recording';
    if (isProcessing) return 'meditation-orb-processing';
    return 'meditation-orb';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStart(e.touches[0].clientY);
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStart === null) return;
    
    const swipeEnd = e.changedTouches[0].clientY;
    const diff = swipeStart - swipeEnd;
    const touchDuration = Date.now() - touchStartTime.current;
    
    // Swipe up detection: moved up more than 50px
    if (diff > 50 && onSwipeUp) {
      onSwipeUp();
      e.preventDefault();
    } 
    // Tap detection: less than 30px movement AND less than 300ms duration
    else if (Math.abs(diff) < 30 && touchDuration < 300 && onTap) {
      onTap();
    }
    
    setSwipeStart(null);
  };

  const handleClick = () => {
    // Handle click for non-touch (desktop) devices
    if (onTap) {
      onTap();
    }
  };

  return (
    <div 
      className={getOrbClass()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={isRecording ? "Recording..." : isProcessing ? "Processing..." : "Tap to capture"}
    />
  );
};
