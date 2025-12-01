import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAttentionBanner } from '@/hooks/useAttentionBanner';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { Check, Clock, Pencil } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { supabase } from '@/integrations/supabase/client';

export const ActionableBanner = () => {
  const { currentItem, totalItems, currentIndex, goToNext, goToPrev } = useAttentionBanner();
  const { updateTask } = useTasks();
  const { toast } = useToast();
  const [showActions, setShowActions] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNext(),
    onSwipedRight: () => goToPrev(),
    trackMouse: false,
  });
  
  // Close scheduler on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showScheduler) {
        setShowScheduler(false);
      }
    };
    if (showScheduler) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showScheduler]);

  if (!currentItem) return null;

  // Urgency color and label using semantic tokens
  const urgencyConfig = {
    overdue: {
      color: 'text-destructive',
      label: 'Overdue',
      labelColor: 'text-destructive/60',
    },
    upcoming: {
      color: 'text-orange-500',
      label: null, // Will show time instead
      labelColor: 'text-orange-500/60',
    },
    inbox: {
      color: 'text-muted-foreground',
      label: 'From inbox',
      labelColor: 'text-muted-foreground/50',
    },
    today: {
      color: currentItem.is_focus ? 'text-foreground/80' : 'text-foreground/60',
      label: currentItem.is_focus ? 'Your ONE thing' : null,
      labelColor: currentItem.is_focus ? 'text-foreground/50' : 'text-muted-foreground/50',
    },
  }[currentItem.bannerPriority];

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `In ${diffMins} minutes`;
    }
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const handleComplete = async () => {
    try {
      await updateTask({ 
        id: currentItem.id, 
        updates: { completed: true, completed_at: new Date().toISOString() } 
      });
      setShowActions(false);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleSchedule = async (time: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const reminderTime = `${today}T${time}:00`;
      await updateTask({ 
        id: currentItem.id, 
        updates: { reminder_time: reminderTime } 
      });
      setShowScheduler(false);
      toast({ description: 'Task scheduled' });
    } catch (error) {
      console.error('Failed to schedule task:', error);
    }
  };

  const handleEdit = async () => {
    if (editText.trim() && editText !== currentItem.title) {
      try {
        await updateTask({ 
          id: currentItem.id, 
          updates: { title: editText.trim() } 
        });
        setIsEditing(false);
        toast({ description: 'Task updated' });
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div 
      {...swipeHandlers}
      className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-foreground/5"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Task text - tappable */}
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              onBlur={handleEdit}
              autoFocus
              className="w-full text-center text-sm font-mono bg-transparent border-b border-foreground/20 px-2 py-1 focus:outline-none focus:border-foreground/40"
            />
          ) : (
            <div 
              onClick={() => setShowActions(!showActions)}
              className={`text-center text-sm font-mono ${urgencyConfig.color} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              {currentItem.title}
            </div>
          )}
          
          {/* Priority label - subtle context */}
          {urgencyConfig.label && (
            <p className={`text-[10px] text-center mt-1 ${urgencyConfig.labelColor}`}>
              {urgencyConfig.label}
            </p>
          )}
          {currentItem.bannerPriority === 'upcoming' && currentItem.reminder_time && (
            <p className={`text-[10px] text-center mt-1 ${urgencyConfig.labelColor}`}>
              {formatTime(currentItem.reminder_time)}
            </p>
          )}
          
          {/* Dots indicator if multiple items */}
          {totalItems > 1 && (
            <div className="flex justify-center gap-1 mt-2">
              {Array.from({ length: Math.min(totalItems, 5) }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-1 h-1 rounded-full transition-all ${
                    i === currentIndex % 5 
                      ? 'bg-foreground/40 w-2' 
                      : 'bg-foreground/15'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Actions (shown on tap) */}
          {showActions && !isEditing && (
            <div className="flex flex-col items-center gap-3 mt-3">
              <div className="flex justify-center items-center gap-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComplete();
                  }}
                  className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Done
                </button>
                
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowScheduler(!showScheduler);
                    }}
                    className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Schedule
                  </button>
                  
                  {showScheduler && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-background border border-foreground/10 rounded-lg shadow-lg py-2 z-50 min-w-[140px]"
                    >
                      {[
                        { label: 'Morning', time: '09:00' },
                        { label: 'Afternoon', time: '14:00' },
                        { label: 'Evening', time: '18:00' },
                        { label: '9am', time: '09:00' },
                        { label: '12pm', time: '12:00' },
                        { label: '3pm', time: '15:00' },
                        { label: '6pm', time: '18:00' },
                      ].map((slot) => (
                        <button
                          key={slot.label}
                          onClick={() => handleSchedule(slot.time)}
                          className="w-full px-4 py-2 text-left text-xs text-foreground/70 hover:bg-foreground/5 transition-colors"
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditText(currentItem.title);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
