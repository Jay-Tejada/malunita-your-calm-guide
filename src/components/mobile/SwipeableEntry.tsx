import { useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

interface SwipeableEntryProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 100; // pixels to trigger action
const HAPTIC_THRESHOLD = 60; // pixels to trigger haptic feedback

export const SwipeableEntry = ({
  children,
  onComplete,
  onDelete,
  disabled = false,
}: SwipeableEntryProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const hapticTriggered = useRef({ left: false, right: false });

  // Transform swipe distance to background opacity and scale
  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const rightScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1.2]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.2, 0.8]);

  const handleDragStart = () => {
    setIsDragging(true);
    hapticTriggered.current = { left: false, right: false };
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;

    // Trigger haptic at threshold (only once per direction)
    if (offset > HAPTIC_THRESHOLD && !hapticTriggered.current.right && onComplete) {
      hapticLight();
      hapticTriggered.current.right = true;
    } else if (offset < -HAPTIC_THRESHOLD && !hapticTriggered.current.left && onDelete) {
      hapticLight();
      hapticTriggered.current.left = true;
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Check if swipe meets threshold or has enough velocity
    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      // Swipe right - complete
      if (onComplete) {
        hapticSuccess();
        onComplete();
      }
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      // Swipe left - delete
      if (onDelete) {
        hapticSuccess();
        onDelete();
      }
    }

    // Reset position
    x.set(0);
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        {/* Complete action (right swipe) */}
        {onComplete && (
          <motion.div
            style={{ opacity: rightOpacity, scale: rightScale }}
            className="flex items-center gap-2 text-green-500"
          >
            <Check className="w-6 h-6" />
            <span className="font-medium">Complete</span>
          </motion.div>
        )}

        <div />

        {/* Delete action (left swipe) */}
        {onDelete && (
          <motion.div
            style={{ opacity: leftOpacity, scale: leftScale }}
            className="flex items-center gap-2 text-destructive"
          >
            <span className="font-medium">Delete</span>
            <Trash2 className="w-6 h-6" />
          </motion.div>
        )}
      </div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: onDelete ? -150 : 0, right: onComplete ? 150 : 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`relative bg-background ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {children}
      </motion.div>
    </div>
  );
};
