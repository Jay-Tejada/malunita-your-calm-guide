import { motion } from 'framer-motion';

interface SimpleOrbProps {
  onTap?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
}

/**
 * SimpleOrb - Large, thumb-optimized orb button with gradient
 * Clean and minimal - no 3D, just beautiful gradients
 */
export const SimpleOrb = ({ 
  onTap, 
  isRecording = false,
  isProcessing = false
}: SimpleOrbProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* The Orb */}
      <motion.button
        onClick={onTap}
        className="relative w-[100px] h-[100px] rounded-full focus:outline-none overflow-visible"
        animate={{ scale: isRecording ? 1.1 : 1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Main orb with warm golden gradient */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isRecording 
              ? 'radial-gradient(circle at 40% 40%, #fca5a5, #f87171, #ef4444, #dc2626)'
              : isProcessing
              ? 'radial-gradient(circle at 40% 40%, #93c5fd, #60a5fa, #3b82f6, #2563eb)'
              : 'radial-gradient(circle at 40% 40%, #fef3c7, #fde68a, #fbbf24, #f59e0b)',
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.4)',
          }}
          animate={{ 
            opacity: [0.85, 1, 0.85],
            scale: [1, 1.03, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Subtle glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isRecording ? (
            <motion.div
              className="w-4 h-4 rounded-full bg-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ) : isProcessing ? (
            <motion.div
              className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <span className="text-4xl">🌙</span>
          )}
        </div>
      </motion.button>

      {/* Label */}
      <motion.p 
        className="text-sm text-muted-foreground font-light"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        What's on your mind?
      </motion.p>
    </div>
  );
};
