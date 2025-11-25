import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OneThingPromptBubbleProps {
  hasOneThing: boolean;
  onSetFocus: () => void;
}

export const OneThingPromptBubble = memo(function OneThingPromptBubble({ hasOneThing, onSetFocus }: OneThingPromptBubbleProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if bubble was dismissed today
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('oneThingPromptDismissed');
    
    if (dismissedDate === today) {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('oneThingPromptDismissed', today);
    setIsDismissed(true);
  };

  // Don't show if already dismissed today or if ONE thing is already set
  if (isDismissed || hasOneThing) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-md"
      >
        <Card className="relative p-4 bg-card/95 backdrop-blur-lg border-primary/20 shadow-lg">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          
          <button
            onClick={onSetFocus}
            className="w-full text-left flex items-start gap-3 pr-8 group"
          >
            <div className="flex-shrink-0 mt-0.5">
              <Target className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="text-sm text-foreground/90 leading-relaxed">
                What is the <span className="font-semibold text-primary">ONE task</span> that would make today a success?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap to set your focus
              </p>
            </div>
          </button>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
});
