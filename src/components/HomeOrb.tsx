import { motion } from "framer-motion";
import { useState } from "react";

interface HomeOrbProps {
  onCapture?: () => void;
  isRecording?: boolean;
}

export const HomeOrb = ({ onCapture, isRecording = false }: HomeOrbProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Recording colors - vibrant red/pink gradient
  const recordingGradient = "radial-gradient(circle at 30% 30%, rgba(255, 100, 100, 0.9), rgba(255, 50, 80, 0.8) 50%, rgba(220, 40, 70, 0.7))";
  const recordingGlow = "rgba(255, 80, 90, 0.6)";
  
  // Default colors - warm golden
  const defaultGradient = "radial-gradient(circle at 30% 30%, rgba(255, 248, 220, 0.9), rgba(247, 217, 141, 0.8) 50%, rgba(237, 197, 101, 0.7))";
  const defaultGlow = "rgba(247, 217, 141, 0.5)";

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
        {/* Outer glow layer */}
        <motion.div
          className="absolute inset-0 rounded-full blur-[60px]"
          style={{
            background: isRecording 
              ? "radial-gradient(circle, rgba(255, 80, 90, 0.6) 0%, rgba(255, 80, 90, 0.2) 70%, transparent 100%)"
              : "radial-gradient(circle, rgba(247, 217, 141, 0.4) 0%, rgba(247, 217, 141, 0.1) 70%, transparent 100%)",
            width: "320px",
            height: "320px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: isRecording ? [1, 1.2, 1] : (isHovered ? [1, 1.15, 1] : [1, 1.08, 1]),
            opacity: isRecording ? [0.8, 1, 0.8] : (isHovered ? [0.6, 0.8, 0.6] : [0.4, 0.6, 0.4]),
          }}
          transition={{
            duration: isRecording ? 1.5 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Middle glow layer */}
        <motion.div
          className="absolute inset-0 rounded-full blur-[40px]"
          style={{
            background: isRecording
              ? "radial-gradient(circle, rgba(255, 80, 90, 0.8) 0%, rgba(255, 80, 90, 0.3) 60%, transparent 100%)"
              : "radial-gradient(circle, rgba(247, 217, 141, 0.6) 0%, rgba(247, 217, 141, 0.2) 60%, transparent 100%)",
            width: "240px",
            height: "240px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: isRecording ? [1, 1.15, 1] : (isHovered ? [1, 1.12, 1] : [1, 1.05, 1]),
            opacity: isRecording ? [0.9, 1, 0.9] : (isHovered ? [0.7, 0.9, 0.7] : [0.5, 0.7, 0.5]),
          }}
          transition={{
            duration: isRecording ? 1.2 : 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Core orb */}
        <motion.div
          className="relative rounded-full shadow-2xl"
          style={{
            width: "180px",
            height: "180px",
            background: isRecording ? recordingGradient : defaultGradient,
            boxShadow: isRecording 
              ? `0 8px 32px ${recordingGlow}, inset 0 2px 8px rgba(255, 255, 255, 0.3)`
              : `0 8px 32px ${defaultGlow}, inset 0 2px 8px rgba(255, 255, 255, 0.3)`,
          }}
          animate={isRecording ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
      </motion.button>

      {/* Prompt text */}
      <motion.p
        className="mt-12 text-xl font-mono text-foreground/70 tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          color: isRecording ? "rgba(255, 80, 90, 0.8)" : "rgba(128, 128, 128, 0.7)"
        }}
        transition={{ delay: 0.4 }}
      >
        {isRecording ? "Listening..." : "What's on your mind?"}
      </motion.p>
    </div>
  );
};
