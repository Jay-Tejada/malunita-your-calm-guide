import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Check, Trash2, Calendar, Star } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface SwipeableTaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSchedule: (id: string) => void;
  onStar: (id: string) => void;
  children: React.ReactNode;
}

export const SwipeableTaskRow = ({ 
  task, 
  onComplete, 
  onDelete, 
  onSchedule,
  onStar,
  children
}: SwipeableTaskRowProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  
  const ACTION_THRESHOLD = 80; // px to trigger action reveal
  const FULL_SWIPE_THRESHOLD = 150; // px to trigger instant action
  
  const handlers = useSwipeable({
    onSwiping: (e) => {
      // Limit swipe distance
      const maxSwipe = 160;
      const offset = Math.max(-maxSwipe, Math.min(maxSwipe, e.deltaX));
      setSwipeOffset(offset);
    },
    onSwipedLeft: (e) => {
      if (Math.abs(e.deltaX) > FULL_SWIPE_THRESHOLD) {
        // Full swipe left = delete
        onDelete(task.id);
        resetSwipe();
      } else if (Math.abs(e.deltaX) > ACTION_THRESHOLD) {
        // Reveal right actions (delete, schedule)
        setIsRevealed('left');
        setSwipeOffset(-ACTION_THRESHOLD);
      } else {
        // Snap back
        resetSwipe();
      }
    },
    onSwipedRight: (e) => {
      if (e.deltaX > FULL_SWIPE_THRESHOLD) {
        // Full swipe right = complete
        onComplete(task.id);
        resetSwipe();
      } else if (e.deltaX > ACTION_THRESHOLD) {
        // Reveal left actions (complete, star)
        setIsRevealed('right');
        setSwipeOffset(ACTION_THRESHOLD);
      } else {
        // Snap back
        resetSwipe();
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  const resetSwipe = () => {
    setSwipeOffset(0);
    setIsRevealed(null);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left actions (revealed on swipe right) - Complete, Star */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button
          onClick={(e) => { 
            e.stopPropagation();
            onComplete(task.id); 
            resetSwipe(); 
          }}
          className="h-full w-20 bg-green-500/20 flex items-center justify-center"
        >
          <Check className="w-5 h-5 text-green-600" />
        </button>
        <button
          onClick={(e) => { 
            e.stopPropagation();
            onStar(task.id); 
            resetSwipe(); 
          }}
          className="h-full w-20 bg-amber-500/20 flex items-center justify-center"
        >
          <Star className="w-5 h-5 text-amber-600" />
        </button>
      </div>
      
      {/* Right actions (revealed on swipe left) - Schedule, Delete */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={(e) => { 
            e.stopPropagation();
            onSchedule(task.id); 
            resetSwipe(); 
          }}
          className="h-full w-20 bg-blue-500/20 flex items-center justify-center"
        >
          <Calendar className="w-5 h-5 text-blue-600" />
        </button>
        <button
          onClick={(e) => { 
            e.stopPropagation();
            onDelete(task.id); 
            resetSwipe(); 
          }}
          className="h-full w-20 bg-red-500/20 flex items-center justify-center"
        >
          <Trash2 className="w-5 h-5 text-red-600" />
        </button>
      </div>
      
      {/* Main row content */}
      <div
        {...handlers}
        onClick={() => isRevealed && resetSwipe()}
        className={cn(
          "relative bg-background",
          isRevealed && "cursor-pointer"
        )}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 || isRevealed ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};
