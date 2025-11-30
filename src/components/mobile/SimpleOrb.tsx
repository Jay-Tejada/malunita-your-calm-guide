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
    <motion.button
      onClick={onTap}
      className="orb-button relative w-[100px] h-[100px] rounded-full focus:outline-none cursor-pointer"
      animate={{ 
        scale: isRecording ? [1.1, 1.15, 1.1] : [1, 1.03, 1],
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        scale: { duration: isRecording ? 1 : 5, repeat: Infinity, ease: "easeInOut" }
      }}
      style={{
        background: isRecording 
          ? 'radial-gradient(circle at 40% 40%, #fca5a5 0%, #f87171 30%, #ef4444 60%, #dc2626 100%)'
          : isProcessing
          ? 'radial-gradient(circle at 40% 40%, #93c5fd 0%, #60a5fa 30%, #3b82f6 60%, #2563eb 100%)'
          : 'radial-gradient(circle at 40% 40%, #fef3c7 0%, #fde68a 30%, #fbbf24 60%, #f59e0b 100%)',
        boxShadow: isRecording
          ? '0 0 40px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(252, 165, 165, 0.3)'
          : isProcessing
          ? '0 0 40px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(147, 197, 253, 0.3)'
          : '0 0 30px rgba(251, 191, 36, 0.4), inset 0 0 20px rgba(254, 243, 199, 0.3)',
      }}
    >
      {/* Recording indicator - small pulsing dot */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-lg" />
        </motion.div>
      )}
      
      {/* Processing indicator - spinning ring */}
      {isProcessing && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full" />
        </motion.div>
      )}
    </motion.button>
  );
};
