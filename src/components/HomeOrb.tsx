import { motion } from "framer-motion";
import { useState } from "react";

interface HomeOrbProps {
  onCapture?: () => void;
  isRecording?: boolean;
  status?: 'ready' | 'listening' | 'processing' | 'speaking';
  recordingDuration?: number;
}

export const HomeOrb = ({ onCapture, isRecording = false, status = 'ready', recordingDuration = 0 }: HomeOrbProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // All states use warm golden palette - only animation intensity changes
  const orbGradient = "radial-gradient(circle at 30% 30%, rgba(255, 248, 220, 0.9), rgba(247, 217, 141, 0.8) 50%, rgba(237, 197, 101, 0.7))";
  const orbGlow = "rgba(247, 217, 141, 0.5)";

  return (
    <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center">
      {/* Main Orb */}
      <motion.button
        onClick={onCapture}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative group cursor-pointer"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Outer glow layer - subtle breathing pulse when recording */}
        <motion.div
          className="absolute inset-0 rounded-full blur-[60px]"
          style={{
            background: "radial-gradient(circle, rgba(247, 217, 141, 0.5) 0%, rgba(247, 217, 141, 0.15) 70%, transparent 100%)",
            width: "320px",
            height: "320px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: isRecording ? [1, 1.12, 1] : (isHovered ? [1, 1.1, 1] : [1, 1.05, 1]),
            opacity: isRecording ? [0.7, 0.95, 0.7] : (isHovered ? [0.6, 0.8, 0.6] : [0.4, 0.6, 0.4]),
          }}
          transition={{
            duration: isRecording ? 2 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Middle glow layer */}
        <motion.div
          className="absolute inset-0 rounded-full blur-[40px]"
          style={{
            background: "radial-gradient(circle, rgba(247, 217, 141, 0.7) 0%, rgba(247, 217, 141, 0.25) 60%, transparent 100%)",
            width: "240px",
            height: "240px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: isRecording ? [1, 1.1, 1] : (isHovered ? [1, 1.08, 1] : [1, 1.05, 1]),
            opacity: isRecording ? [0.85, 1, 0.85] : (isHovered ? [0.7, 0.9, 0.7] : [0.5, 0.7, 0.5]),
          }}
          transition={{
            duration: isRecording ? 1.8 : 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Core orb - consistent golden with gentle breathing */}
        <motion.div
          className="relative rounded-full shadow-2xl"
          style={{
            width: "180px",
            height: "180px",
            background: orbGradient,
            boxShadow: `0 8px 32px ${orbGlow}, inset 0 2px 8px rgba(255, 255, 255, 0.3)`,
          }}
          animate={isRecording ? {
            scale: [1, 1.03, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
      </motion.button>

      {/* Status and timer text */}
      <div className="mt-12 flex flex-col items-center gap-2">
        <motion.p
          className="text-xl font-mono tracking-wide"
          style={{ color: "rgba(128, 128, 128, 0.7)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: status === 'listening' ? [0.7, 1, 0.7] : 1, 
            y: 0,
          }}
          transition={{ 
            delay: 0.4,
            opacity: {
              duration: 2,
              repeat: status === 'listening' ? Infinity : 0,
              ease: "easeInOut"
            }
          }}
        >
          {status === 'listening' && 'Listening...'}
          {status === 'processing' && 'Processing...'}
          {status === 'speaking' && 'Speaking...'}
          {status === 'ready' && "What's on your mind?"}
        </motion.p>
        
        {status === 'listening' && recordingDuration > 0 && (
          <motion.p
            className="text-sm font-mono"
            style={{ color: "rgba(128, 128, 128, 0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {Math.floor(recordingDuration / 1000)}s
          </motion.p>
        )}
      </div>
    </div>
  );
};
