import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CreatureSprite } from '@/components/CreatureSprite';
import { useMoodStore } from '@/state/moodMachine';

interface FloatingCompanionProps {
  message?: string;
  onDismiss?: () => void;
  visible?: boolean;
}

export const FloatingCompanion = ({
  message,
  onDismiss,
  visible = true,
}: FloatingCompanionProps) => {
  const mood = useMoodStore((state) => state.mood);
  const [showMessage, setShowMessage] = useState(false);

  // Show message when it changes
  useEffect(() => {
    if (message) {
      setShowMessage(true);
      
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDismissMessage = () => {
    setShowMessage(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop for dismissing */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismissMessage}
            className="fixed inset-0 z-40"
          />
        )}
      </AnimatePresence>

      {/* Floating companion */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Speech bubble */}
        <AnimatePresence>
          {showMessage && message && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative max-w-[260px]"
            >
              {/* Bubble */}
              <div className="bg-card border border-border rounded-2xl shadow-lg p-4">
                <button
                  onClick={handleDismissMessage}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3 text-foreground" />
                </button>
                
                <p className="text-sm text-foreground leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Arrow pointing to companion */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b border-border transform rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Companion bubble */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          {/* Bubble container */}
          <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 shadow-lg flex items-center justify-center overflow-hidden backdrop-blur-sm">
            <CreatureSprite
              emotion={mood || 'neutral'}
              size={50}
              animate={true}
            />
          </div>

          {/* Notification dot when there's a message */}
          {message && !showMessage && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-background"
            />
          )}

          {/* Subtle pulse animation */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </>
  );
};
