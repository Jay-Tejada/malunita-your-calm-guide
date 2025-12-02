import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Plus, Timer } from 'lucide-react';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/utils/haptics';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function FocusTimerFloating() {
  const {
    isRunning,
    isPaused,
    secondsRemaining,
    totalSeconds,
    currentTaskTitle,
    sessionType,
    pauseTimer,
    resumeTimer,
    resetTimer,
    addMinutes,
    startTimer,
  } = useFocusTimer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  const progress = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;

  // Global keyboard shortcut (F key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (isRunning) {
          // Toggle pause/resume
          isPaused ? resumeTimer() : pauseTimer();
        } else {
          // Show quick start menu
          setShowQuickStart(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isPaused, pauseTimer, resumeTimer]);

  const handleToggleExpand = () => {
    hapticLight();
    setIsExpanded(!isExpanded);
    setShowQuickStart(false);
  };

  const handleQuickStart = (minutes: number) => {
    hapticLight();
    startTimer(minutes);
    setShowQuickStart(false);
    setIsExpanded(true);
  };

  // Show quick start button when no timer is running
  if (!isRunning) {
    return (
      <div className="fixed bottom-20 right-4 z-30 md:bottom-4">
        <AnimatePresence>
          {showQuickStart && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full right-0 mb-2 bg-background border border-foreground/10 rounded-xl shadow-lg p-3 min-w-[140px]"
            >
              <p className="text-[10px] uppercase tracking-wider text-foreground/40 mb-2">Quick Focus</p>
              <div className="flex gap-2">
                {[15, 25, 45].map(mins => (
                  <button
                    key={mins}
                    onClick={() => handleQuickStart(mins)}
                    className="flex-1 py-2 px-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg font-mono text-xs text-foreground/70 transition-colors"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => {
            hapticLight();
            setShowQuickStart(!showQuickStart);
          }}
          className="flex items-center justify-center w-12 h-12 bg-foreground/5 hover:bg-foreground/10 backdrop-blur rounded-full shadow-sm border border-foreground/10 transition-colors"
        >
          <Timer className="w-5 h-5 text-foreground/50" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-30 md:bottom-4">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background border border-foreground/10 rounded-2xl shadow-lg p-4 min-w-[200px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-foreground/40">
                {sessionType === 'focus' ? 'Focus' : sessionType === 'break' ? 'Break' : 'Rest'}
              </span>
              <button
                onClick={handleToggleExpand}
                className="p-1 text-foreground/30 hover:text-foreground/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timer display */}
            <div className="text-center mb-4">
              <div className="font-mono text-4xl font-light text-foreground/80 mb-1">
                {formatTime(secondsRemaining)}
              </div>
              {currentTaskTitle && (
                <p className="text-xs text-foreground/40 truncate max-w-[180px]">
                  {currentTaskTitle}
                </p>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-foreground/10 rounded-full mb-4 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  sessionType === 'focus' ? 'bg-amber-500' : sessionType === 'break' ? 'bg-green-500' : 'bg-blue-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  hapticLight();
                  addMinutes(5);
                }}
                className="p-2 text-foreground/40 hover:text-foreground/60 transition-colors"
                title="Add 5 minutes"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  hapticLight();
                  isPaused ? resumeTimer() : pauseTimer();
                }}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  isPaused
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-foreground/10 text-foreground/70 hover:bg-foreground/20"
                )}
              >
                {isPaused ? <Play className="w-5 h-5 ml-0.5" /> : <Pause className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => {
                  hapticLight();
                  resetTimer();
                }}
                className="p-2 text-foreground/40 hover:text-red-500 transition-colors"
                title="Reset timer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleToggleExpand}
            className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur rounded-full shadow-sm border border-foreground/10"
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              isPaused ? "bg-foreground/30" : "bg-amber-500 animate-pulse"
            )} />
            <span className="font-mono text-sm text-foreground/70">
              {formatTime(secondsRemaining)}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
