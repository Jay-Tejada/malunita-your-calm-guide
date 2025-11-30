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
          ? 'radial-gradient(circle at 35% 35%, #fca5a5 0%, #f87171 25%, #ef4444 50%, #dc2626 75%, #b91c1c 100%)'
          : isProcessing
          ? 'radial-gradient(circle at 35% 35%, #93c5fd 0%, #60a5fa 25%, #3b82f6 50%, #2563eb 75%, #1e40af 100%)'
          : 'radial-gradient(circle at 35% 35%, #fef3c7 0%, #fde68a 25%, #fbbf24 50%, #f59e0b 75%, #d97706 100%)',
        boxShadow: isRecording
          ? '0 8px 24px rgba(239, 68, 68, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.4)'
          : isProcessing
          ? '0 8px 24px rgba(59, 130, 246, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.4)'
          : '0 8px 24px rgba(251, 191, 36, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.4)',
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
