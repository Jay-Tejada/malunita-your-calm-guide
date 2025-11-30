import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useAutoFocus } from '@/hooks/useAutoFocus';
import { useCompanionEmotion } from '@/hooks/useCompanionEmotion';

export const AutoFocusNotification = () => {
  const { autoFocusTriggered, autoFocusTask, clearAutoFocusMessage } = useAutoFocus();
  const { triggerEmotionFromContext } = useCompanionEmotion();

  useEffect(() => {
    if (autoFocusTriggered) {
      // Trigger companion emotion
      triggerEmotionFromContext({ autoFocusTriggered: true });
      
      // Auto-dismiss after 10 seconds
      const timeout = setTimeout(() => {
        clearAutoFocusMessage();
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [autoFocusTriggered, clearAutoFocusMessage, triggerEmotionFromContext]);

  return (
    <AnimatePresence>
      {autoFocusTriggered && autoFocusTask && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="bg-primary/10 backdrop-blur-lg border border-primary/20 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">
                  I picked today's ONE thing to help you stay on track.
                </p>
                <p className="text-xs font-mono text-muted-foreground line-clamp-2">
                  "{autoFocusTask.title}"
                </p>
                {autoFocusTask.reasons && autoFocusTask.reasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {autoFocusTask.reasons.slice(0, 2).map((reason: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-primary/10 rounded-full text-primary"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-primary/10"
                onClick={clearAutoFocusMessage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
