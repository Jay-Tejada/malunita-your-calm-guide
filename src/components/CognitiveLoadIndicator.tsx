import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCognitiveLoad, getLoadColor } from '@/state/cognitiveLoad';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CognitiveLoadIndicator = () => {
  const { level, score, recommendations, getRecommendations } = useCognitiveLoad();
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [hasShownHighAlert, setHasShownHighAlert] = useState(false);

  // Auto-show recommendations when load is HIGH
  useEffect(() => {
    if (level === 'HIGH' && !hasShownHighAlert) {
      setShowRecommendations(true);
      setHasShownHighAlert(true);
      getRecommendations();
    } else if (level !== 'HIGH') {
      setHasShownHighAlert(false);
    }
  }, [level, hasShownHighAlert, getRecommendations]);

  const getIcon = () => {
    switch (level) {
      case 'HIGH':
        return <AlertCircle className="w-5 h-5" />;
      case 'MEDIUM':
        return <Brain className="w-5 h-5" />;
      case 'LOW':
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    switch (level) {
      case 'HIGH':
        return 'High Load';
      case 'MEDIUM':
        return 'Moderate';
      case 'LOW':
        return 'Feeling Good';
    }
  };

  return (
    <>
      {/* Floating indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-24 left-6 z-40"
      >
        <button
          onClick={() => {
            setShowRecommendations(!showRecommendations);
            if (!showRecommendations) getRecommendations();
          }}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all backdrop-blur-sm",
            level === 'HIGH' 
              ? "bg-destructive/90 text-destructive-foreground animate-pulse" 
              : level === 'MEDIUM'
              ? "bg-warning/90 text-warning-foreground"
              : "bg-primary/90 text-primary-foreground"
          )}
        >
          {getIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
          {level === 'HIGH' && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Zap className="w-4 h-4" />
            </motion.div>
          )}
        </button>
      </motion.div>

      {/* Recommendations panel */}
      <AnimatePresence>
        {showRecommendations && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -100, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -100, y: 20 }}
            className="fixed bottom-40 left-6 z-40 w-80"
          >
            <Card className="p-4 shadow-xl backdrop-blur-lg bg-card/95 border-2">
              <div className="flex items-center gap-2 mb-3">
                <Brain className={cn("w-5 h-5", getLoadColor(level))} />
                <h3 className="font-semibold">Recommendations</h3>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p className="text-foreground/90">{rec}</p>
                  </motion.div>
                ))}
              </div>

              {level === 'HIGH' && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => {
                      // TODO: Navigate to Focus Mode
                      setShowRecommendations(false);
                    }}
                    className="w-full"
                    variant="default"
                  >
                    Start Focus Mode
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
