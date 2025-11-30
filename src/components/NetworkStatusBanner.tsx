import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function NetworkStatusBanner() {
  const { showOfflineBanner } = useNetworkStatus();
  
  return (
    <AnimatePresence>
      {showOfflineBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 px-4 py-3 text-center text-sm font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>You're offline. Changes will sync when reconnected.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
