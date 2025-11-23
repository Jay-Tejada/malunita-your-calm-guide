import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonalEvent } from '@/hooks/useSeasonalEvent';
import { X, Sparkles } from 'lucide-react';

export const SeasonalHelperBubble = () => {
  const { currentSeason } = useSeasonalEvent();
  const [showMessage, setShowMessage] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!currentSeason?.effects.helperMessage || dismissed) {
      return;
    }

    // Check if we've already shown this message today
    const storageKey = `seasonal-message-${currentSeason.type}`;
    const lastShown = localStorage.getItem(storageKey);
    const today = new Date().toDateString();

    // Only show once per day with a random chance (30%)
    if (lastShown === today) {
      return;
    }

    // Random chance to show (30% chance)
    const shouldShow = Math.random() < 0.3;
    if (!shouldShow) {
      return;
    }

    // Show message after a delay
    const timer = setTimeout(() => {
      setShowMessage(true);
      localStorage.setItem(storageKey, today);
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentSeason, dismissed]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (showMessage && !dismissed) {
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showMessage, dismissed]);

  if (!currentSeason?.effects.helperMessage || !showMessage || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
      >
        <div className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-2 shadow-lg flex items-center gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {currentSeason.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentSeason.effects.helperMessage}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
