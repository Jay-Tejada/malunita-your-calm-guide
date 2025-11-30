import { motion, AnimatePresence } from 'framer-motion';
import { useActionableBanner } from '@/hooks/useActionableBanner';

export const ActionableBanner = () => {
  const actionable = useActionableBanner();

  return (
    <AnimatePresence>
      {actionable && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          onClick={actionable.action}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center cursor-pointer hover:opacity-80 transition-opacity"
        >
          <p className="text-sm font-mono text-muted-foreground/70">
            {actionable.message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
