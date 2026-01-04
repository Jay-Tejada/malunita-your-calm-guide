import { motion, AnimatePresence } from 'framer-motion';

interface ListeningOverlayProps {
  isActive: boolean;
}

/**
 * Soft background dim overlay during voice recording
 * 
 * Design philosophy:
 * - Softly dims background (not greyed out)
 * - Makes orb the primary visual anchor
 * - Smooth fade in/out transitions
 */
export const ListeningOverlay = ({ isActive }: ListeningOverlayProps) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 45%, transparent 15%, hsl(var(--background) / 0.7) 60%)',
            zIndex: 40,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  );
};
