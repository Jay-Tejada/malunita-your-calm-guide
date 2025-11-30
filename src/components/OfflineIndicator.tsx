import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff, Wifi, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator = () => {
  const { isOnline, queueLength } = useOfflineStatus();

  if (isOnline && queueLength === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/95 backdrop-blur-sm border border-border shadow-lg">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-foreground">
                Offline Mode
              </span>
              {queueLength > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({queueLength} pending)
                </span>
              )}
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium text-foreground">
                Syncing {queueLength} {queueLength === 1 ? 'item' : 'items'}...
              </span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
