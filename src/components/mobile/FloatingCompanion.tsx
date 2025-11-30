import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CreatureSprite } from '@/components/CreatureSprite';
import { useMoodStore } from '@/state/moodMachine';
import { useSwipeable } from 'react-swipeable';
import { hapticLight } from '@/utils/haptics';

interface FloatingCompanionProps {
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  visible?: boolean;
}

export const FloatingCompanion = ({
  message,
  action,
  onDismiss,
  visible = true,
}: FloatingCompanionProps) => {
  const mood = useMoodStore((state) => state.mood);
  const [showMessage, setShowMessage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const autoDismissTimer = useRef<NodeJS.Timeout>();

  // Show message when it changes
  useEffect(() => {
    if (message) {
      setShowMessage(true);
      setIsExpanded(false);
      
      // Auto-dismiss after 10 seconds
      autoDismissTimer.current = setTimeout(() => {
        setShowMessage(false);
        setIsExpanded(false);
      }, 10000);
      
      return () => {
        if (autoDismissTimer.current) {
          clearTimeout(autoDismissTimer.current);
        }
      };
    }
  }, [message]);

  const handleDismissMessage = (dismissFor1Hour = false) => {
    setShowMessage(false);
    setIsExpanded(false);
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    onDismiss?.();
    
    // Store dismissal timestamp if dismissed for 1 hour
    if (dismissFor1Hour) {
      localStorage.setItem('companion_dismissed_until', 
        (Date.now() + 60 * 60 * 1000).toString()
      );
    }
  };

  const handleBubbleClick = () => {
    if (message && !isExpanded) {
      setIsExpanded(true);
      hapticLight();
      // Reset auto-dismiss timer when expanded
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
      autoDismissTimer.current = setTimeout(() => {
        setShowMessage(false);
        setIsExpanded(false);
      }, 15000); // Extended time when expanded
    }
  };

  const handleActionClick = () => {
    action?.onClick();
    handleDismissMessage();
  };

  // Swipe down to dismiss for 1 hour
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => {
      hapticLight();
      handleDismissMessage(true);
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes companion-entrance {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes companion-breathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes companion-pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(1.2);
          }
        }

        @keyframes message-entrance {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .companion-bubble {
          animation: companion-entrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .companion-bubble-idle {
          animation: companion-breathe 3s ease-in-out infinite;
        }

        .companion-pulse {
          animation: companion-pulse 3s ease-in-out infinite;
        }

        .message-bubble {
          animation: message-entrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* Backdrop for dismissing */}
      {showMessage && isExpanded && (
        <div
          onClick={() => handleDismissMessage()}
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
          style={{ animation: 'fade-in 0.2s ease-out' }}
        />
      )}

      {/* Floating companion */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Speech bubble */}
        {showMessage && message && (
          <div
            ref={messageRef}
            {...swipeHandlers}
            className={`relative max-w-[${isExpanded ? '320px' : '260px'}] message-bubble`}
          >
            {/* Bubble */}
            <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-xl p-4">
              <button
                onClick={() => handleDismissMessage()}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-foreground" />
              </button>
              
              <p className={`text-sm text-foreground leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                {message}
              </p>

              {/* Action button */}
              {action && isExpanded && (
                <button
                  onClick={handleActionClick}
                  className="mt-3 w-full py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                >
                  {action.label}
                </button>
              )}

              {/* Swipe hint */}
              {isExpanded && (
                <p className="mt-2 text-xs text-foreground-soft text-center">
                  Swipe down to dismiss for 1 hour
                </p>
              )}
            </div>

            {/* Arrow pointing to companion */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card/95 backdrop-blur-md border-r border-b border-border transform rotate-45" />
          </div>
        )}

        {/* Companion bubble */}
        <div
          onClick={handleBubbleClick}
          className="relative companion-bubble cursor-pointer"
        >
          {/* Bubble container */}
          <div className="companion-bubble-idle w-[60px] h-[60px] rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 shadow-lg flex items-center justify-center overflow-hidden backdrop-blur-sm hover:shadow-xl hover:border-primary/40 transition-all">
            <CreatureSprite
              emotion={mood || 'neutral'}
              size={50}
              animate={true}
            />
          </div>

          {/* Notification dot when there's a message */}
          {message && !showMessage && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-background animate-pulse" />
          )}

          {/* Subtle pulse animation */}
          <div className="companion-pulse absolute inset-0 rounded-full bg-primary/20 pointer-events-none" />
        </div>
      </div>
    </>
  );
};
