import { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useDailySessions } from "@/hooks/useDailySessions";
import { DailySessionStart } from "@/components/DailySessionStart";
import { DailySessionSteps } from "@/components/DailySessionSteps";
import { DailySessionSummary } from "@/components/DailySessionSummary";
import { DailySessionHistory } from "@/components/DailySessionHistory";
import { useToast } from "@/hooks/use-toast";

type ViewMode = 'start' | 'morning' | 'evening' | 'summary' | 'history';

interface DailySessionViewProps {
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const DailySessionView = ({ onClose, onNavigate, hasPrev, hasNext }: DailySessionViewProps) => {
  const { toast } = useToast();
  const { todaySession, sessions, isLoading, createSession, updateSession } = useDailySessions();
  const [viewMode, setViewMode] = useState<ViewMode>('start');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'down' | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (todaySession) {
        // Check if session is complete
        const hasReflection = todaySession.reflection_wins || todaySession.reflection_improve;
        if (todaySession.top_focus && hasReflection) {
          setViewMode('summary');
          setSelectedSession(todaySession);
        } else if (todaySession.top_focus && !hasReflection) {
          // Morning done, can do evening
          setViewMode('summary');
          setSelectedSession(todaySession);
        } else {
          // In progress
          setViewMode('morning');
        }
      }
    }
  }, [todaySession, isLoading]);

  const handleStart = async () => {
    try {
      const session = await createSession({});
      const hour = new Date().getHours();
      const isEvening = hour >= 18 || hour < 6;
      setViewMode(isEvening ? 'evening' : 'morning');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateSession = async (updates: any) => {
    if (!todaySession) return;
    try {
      await updateSession({ id: todaySession.id, updates });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleComplete = () => {
    setViewMode('summary');
    setSelectedSession(todaySession);
    toast({
      title: "Session complete",
      description: "Your daily session has been saved",
    });
  };

  const handleViewSession = (session: any) => {
    setSelectedSession(session);
    setViewMode('summary');
  };

  const handleBack = () => {
    if (viewMode === 'summary' && todaySession?.id === selectedSession?.id) {
      onClose();
    } else {
      setViewMode('start');
      setSelectedSession(null);
    }
  };

  const handleAddReflection = () => {
    if (todaySession) {
      setViewMode('evening');
    }
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
          description: "Swipe down to close",
        });
      }
      // Swipe left to next view
      else if (dir === 'Left' && hasNext && (Math.abs(deltaX) > 100 || velocity > 0.5)) {
        // Navigation haptic: double tap pattern
        if ('vibrate' in navigator) {
          navigator.vibrate([15, 10, 15]);
        }
        onNavigate?.('next');
        toast({
          title: "Next view",
        });
      }
      // Swipe right to previous view
      else if (dir === 'Right' && hasPrev && (Math.abs(deltaX) > 100 || velocity > 0.5)) {
        // Navigation haptic: double tap pattern
        if ('vibrate' in navigator) {
          navigator.vibrate([15, 10, 15]);
        }
        onNavigate?.('prev');
        toast({
          title: "Previous view",
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

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-card rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div 
      {...handlers}
      className="w-full max-w-4xl mx-auto animate-fade-in touch-pan-y"
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
          <div>
            <h1 className="text-3xl font-light">Daily Session</h1>
            <p className="text-muted-foreground mt-1">
              Start your day with intention
            </p>
          </div>
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

      {viewMode === 'start' && (
        <div className="space-y-8">
          <DailySessionStart onStart={handleStart} />
          {sessions && sessions.length > 0 && (
            <DailySessionHistory 
              sessions={sessions} 
              onViewSession={handleViewSession}
            />
          )}
        </div>
      )}

      {viewMode === 'morning' && todaySession && (
        <DailySessionSteps
          sessionId={todaySession.id}
          isEvening={false}
          onComplete={handleComplete}
          onUpdateSession={handleUpdateSession}
        />
      )}

      {viewMode === 'evening' && todaySession && (
        <DailySessionSteps
          sessionId={todaySession.id}
          isEvening={true}
          onComplete={handleComplete}
          onUpdateSession={handleUpdateSession}
        />
      )}

      {viewMode === 'summary' && selectedSession && (
        <div className="space-y-6">
          <DailySessionSummary
            session={selectedSession}
            onClose={handleBack}
          />
          
          {/* Add reflection button if morning done but no reflection yet */}
          {selectedSession.id === todaySession?.id && 
           selectedSession.top_focus && 
           !selectedSession.reflection_wins && (
            <div className="flex justify-center pt-4">
              <Button onClick={handleAddReflection} variant="outline">
                Add Evening Reflection
              </Button>
            </div>
          )}

          {/* Show history below */}
          {sessions && sessions.length > 1 && (
            <div className="pt-8 border-t border-border/40">
              <DailySessionHistory 
                sessions={sessions.filter(s => s.id !== selectedSession.id)} 
                onViewSession={handleViewSession}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
