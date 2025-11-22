import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { TaskList } from "@/components/TaskList";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskStreamProps {
  category: string;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const TaskStream = ({ category, onClose, onNavigate, hasPrev, hasNext }: TaskStreamProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'down' | null>(null);
  const { toast } = useToast();

  const getCategoryLabel = (cat: string) => {
    if (cat === "all") return "All Tasks";
    if (cat.startsWith("custom-")) return "Tasks";
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const { deltaX, deltaY, dir } = eventData;
      
      // Vertical swipe down to dismiss
      if (dir === 'Down' && Math.abs(deltaY) > Math.abs(deltaX)) {
        setSwipeDirection('down');
        setSwipeOffset(Math.min(deltaY, 200));
        
        // Light haptic feedback at 50% progress
        if (deltaY > 100 && deltaY < 105 && 'vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
      // Horizontal swipes to navigate
      else if ((dir === 'Left' && hasNext) || (dir === 'Right' && hasPrev)) {
        setSwipeDirection(dir === 'Left' ? 'left' : 'right');
        setSwipeOffset(deltaX);
        
        // Light haptic feedback at 50% progress
        if (Math.abs(deltaX) > 100 && Math.abs(deltaX) < 105 && 'vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    },
    onSwiped: (eventData) => {
      const { deltaX, deltaY, dir, velocity } = eventData;
      
      // Swipe down to dismiss (threshold: 100px or velocity > 0.5)
      if (dir === 'Down' && (deltaY > 100 || velocity > 0.5)) {
        // Success haptic: short-medium-short pattern
        if ('vibrate' in navigator) {
          navigator.vibrate([30, 20, 30]);
        }
        onClose();
        toast({
          title: "View dismissed",
          description: "Swipe down to close task view",
        });
      }
      // Swipe left to next category
      else if (dir === 'Left' && hasNext && (Math.abs(deltaX) > 100 || velocity > 0.5)) {
        // Navigation haptic: double tap pattern
        if ('vibrate' in navigator) {
          navigator.vibrate([15, 10, 15]);
        }
        onNavigate?.('next');
        toast({
          title: "Next category",
        });
      }
      // Swipe right to previous category
      else if (dir === 'Right' && hasPrev && (Math.abs(deltaX) > 100 || velocity > 0.5)) {
        // Navigation haptic: double tap pattern
        if ('vibrate' in navigator) {
          navigator.vibrate([15, 10, 15]);
        }
        onNavigate?.('prev');
        toast({
          title: "Previous category",
        });
      }
      // Failed swipe - light feedback
      else if (swipeDirection) {
        if ('vibrate' in navigator) {
          navigator.vibrate(5);
        }
      }
      
      // Reset offset and direction
      setSwipeOffset(0);
      setSwipeDirection(null);
    },
    trackMouse: false, // Only track touch, not mouse
    trackTouch: true,
    preventScrollOnSwipe: false,
  });

  // Calculate opacity based on swipe
  const opacity = swipeDirection === 'down' 
    ? Math.max(0.3, 1 - swipeOffset / 200)
    : 1;

  // Calculate transform based on swipe
  const transform = swipeDirection === 'down'
    ? `translateY(${swipeOffset}px)`
    : swipeDirection === 'left' || swipeDirection === 'right'
    ? `translateX(${swipeOffset}px)`
    : 'translateY(0)';

  return (
    <div 
      {...handlers}
      className="w-full max-w-3xl mx-auto animate-fade-in touch-pan-y"
      style={{
        opacity,
        transform,
        transition: swipeOffset === 0 ? 'all 0.3s ease-out' : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {hasPrev && onNavigate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('prev')}
              className="text-muted-foreground hover:text-foreground md:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <h2 className="text-2xl font-light text-foreground tracking-wide">
            {getCategoryLabel(category)}
          </h2>
          {hasNext && onNavigate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('next')}
              className="text-muted-foreground hover:text-foreground md:hidden"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Swipe hint for mobile */}
      <div className="md:hidden text-xs text-center text-muted-foreground mb-4 flex items-center justify-center gap-4">
        {hasPrev && <span>← Swipe</span>}
        <span>Swipe down to close</span>
        {hasNext && <span>Swipe →</span>}
      </div>
      
      <TaskList category={category} />
    </div>
  );
};
