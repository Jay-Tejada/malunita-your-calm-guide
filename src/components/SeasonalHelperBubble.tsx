import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonalEvent } from '@/hooks/useSeasonalEvent';
import { X } from 'lucide-react';

export const SeasonalHelperBubble = () => {
  const { currentSeason } = useSeasonalEvent();
  const [showMessage, setShowMessage] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (currentSeason?.effects.helperMessage && !dismissed) {
      // Show message after a short delay
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentSeason, dismissed]);

  if (!currentSeason?.effects.helperMessage || !showMessage || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-30 max-w-md"
      >
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                🌟 {currentSeason.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentSeason.effects.helperMessage}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
