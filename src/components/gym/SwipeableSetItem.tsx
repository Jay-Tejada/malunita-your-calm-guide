import { useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExerciseSet {
  id: string;
  exercise_name: string;
  weight: number | null;
  reps: number | null;
  duration: number | null;
  is_bodyweight: boolean;
  isPR?: boolean;
}

interface SwipeableSetItemProps {
  set: ExerciseSet;
  isRecentlyAdded: boolean;
  onDelete: (set: ExerciseSet) => void;
  onEdit: (set: ExerciseSet) => void;
}

const SwipeableSetItem = ({ set, isRecentlyAdded, onDelete, onEdit }: SwipeableSetItemProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === 'Left') {
        setSwipeOffset(Math.min(Math.abs(e.deltaX), 80));
      }
    },
    onSwipedLeft: (e) => {
      if (Math.abs(e.deltaX) > 60) {
        // Trigger delete
        setIsDeleting(true);
        setTimeout(() => onDelete(set), 200);
      } else {
        setSwipeOffset(0);
      }
    },
    onSwipedRight: () => {
      setSwipeOffset(0);
    },
    onTouchEndOrOnMouseUp: () => {
      if (swipeOffset < 60) {
        setSwipeOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  const formatSetDisplay = () => {
    if (set.duration) {
      return `${set.duration}s`;
    } else if (set.is_bodyweight) {
      return `× ${set.reps}`;
    } else {
      return `${set.weight} × ${set.reps}`;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden transition-all duration-200 ${
        isDeleting ? 'h-0 opacity-0' : ''
      }`}
    >
      {/* Delete background */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500/20 transition-all"
        style={{ width: swipeOffset > 0 ? '100%' : 0 }}
      >
        <div className="px-4 text-red-400">
          <Trash2 className="w-4 h-4" />
        </div>
      </div>
      
      {/* Content */}
      <div
        {...handlers}
        className={`relative flex items-center justify-between py-1 transition-transform ${
          isRecentlyAdded ? 'text-green-500/70 bg-green-500/5 -mx-2 px-2 rounded' : ''
        }`}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
      >
        <div className="text-sm font-mono text-foreground/50 flex items-center gap-2">
          <span>{formatSetDisplay()}</span>
          {set.isPR && <span className="text-amber-500 text-xs">PR</span>}
        </div>
        
        {/* Desktop: 3-dot menu */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-foreground/5 rounded text-foreground/30 hover:text-foreground/50 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onEdit(set)} className="text-xs">
                <Edit2 className="w-3 h-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(set)} 
                className="text-xs text-red-400 focus:text-red-400"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default SwipeableSetItem;
