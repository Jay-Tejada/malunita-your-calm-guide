import { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Check, Trash2 } from 'lucide-react';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

interface SwipeableEntryProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const SwipeableEntry = ({
  children,
  onComplete,
  onDelete,
  disabled = false,
}: SwipeableEntryProps) => {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const hapticTriggered = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get screen width for threshold calculation
  useEffect(() => {
    const updateWidth = () => setScreenWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 50% of screen width threshold
  const threshold = screenWidth * 0.5;

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (disabled) return;
      
      setIsSwiping(true);
      const deltaX = eventData.deltaX;
      
      // Limit swipe distance
      const maxSwipe = screenWidth * 0.7; // Don't allow more than 70% swipe
      const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
      setSwipeDistance(limitedDelta);

      // Trigger haptic at 40% threshold (once per swipe)
      const hapticThreshold = threshold * 0.8;
      if (Math.abs(limitedDelta) > hapticThreshold && !hapticTriggered.current) {
        hapticLight();
        hapticTriggered.current = true;
      }
    },
    onSwipedLeft: () => {
      if (disabled) return;
      
      if (Math.abs(swipeDistance) > threshold && onDelete) {
        hapticSuccess();
        onDelete();
      }
      
      // Spring back
      resetSwipe();
    },
    onSwipedRight: () => {
      if (disabled) return;
      
      if (swipeDistance > threshold && onComplete) {
        hapticSuccess();
        onComplete();
      }
      
      // Spring back
      resetSwipe();
    },
    preventScrollOnSwipe: true,
    trackMouse: false, // Touch only
    delta: 10, // Minimum delta to start swipe
  });

  const resetSwipe = () => {
    setIsSwiping(false);
    setSwipeDistance(0);
    hapticTriggered.current = false;
  };

  if (disabled) {
    return <>{children}</>;
  }

  // Calculate opacity and scale based on swipe progress
  const swipeProgress = Math.abs(swipeDistance) / threshold;
  const backgroundColor = swipeDistance > 0 
    ? `rgba(34, 197, 94, ${Math.min(swipeProgress, 1) * 0.2})` // Green for complete
    : `rgba(239, 68, 68, ${Math.min(swipeProgress, 1) * 0.2})`; // Red for delete
  
  const actionOpacity = Math.min(swipeProgress * 1.5, 1);
  const actionScale = 0.8 + (swipeProgress * 0.4);

  return (
    <div className="relative overflow-hidden" {...handlers}>
      {/* Background layer with color */}
      <div 
        className="absolute inset-0 transition-colors duration-75"
        style={{ 
          backgroundColor: isSwiping ? backgroundColor : 'transparent',
        }}
      />

      {/* Action indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-8 pointer-events-none">
        {/* Complete action (right swipe) */}
        {onComplete && (
          <div
            className="flex items-center gap-2 text-green-600 transition-all duration-75"
            style={{
              opacity: swipeDistance > 0 ? actionOpacity : 0,
              transform: `scale(${swipeDistance > 0 ? actionScale : 0.8})`,
            }}
          >
            <Check className="w-6 h-6 stroke-[2.5]" />
            <span className="font-semibold text-sm">Done</span>
          </div>
        )}

        <div />

        {/* Delete action (left swipe) */}
        {onDelete && (
          <div
            className="flex items-center gap-2 text-red-600 transition-all duration-75"
            style={{
              opacity: swipeDistance < 0 ? actionOpacity : 0,
              transform: `scale(${swipeDistance < 0 ? actionScale : 0.8})`,
            }}
          >
            <span className="font-semibold text-sm">Delete</span>
            <Trash2 className="w-6 h-6 stroke-[2.5]" />
          </div>
        )}
      </div>

      {/* Swipeable content */}
      <div
        ref={contentRef}
        className="relative bg-background transition-transform duration-75"
        style={{
          transform: `translateX(${swipeDistance}px)`,
          transition: isSwiping ? 'none' : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring back
        }}
      >
        {children}
      </div>
    </div>
  );
};
