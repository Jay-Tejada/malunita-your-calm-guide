import { motion } from "framer-motion";
import { useState } from "react";

interface HomeOrbProps {
  onCapture?: () => void;
}

export const HomeOrb = ({ onCapture }: HomeOrbProps) => {
  const [isHovered, setIsHovered] = useState(false);

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
            background: "radial-gradient(circle, rgba(247, 217, 141, 0.4) 0%, rgba(247, 217, 141, 0.1) 70%, transparent 100%)",
            width: "320px",
            height: "320px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: isHovered ? [1, 1.15, 1] : [1, 1.08, 1],
            opacity: isHovered ? [0.6, 0.8, 0.6] : [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Middle glow layer */}
        <motion.div
          className="absolute inset-0 rounded-full blur-[40px]"
          style={{
            background: "radial-gradient(circle, rgba(247, 217, 141, 0.6) 0%, rgba(247, 217, 141, 0.2) 60%, transparent 100%)",
            width: "240px",
            height: "240px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: isHovered ? [1, 1.12, 1] : [1, 1.05, 1],
            opacity: isHovered ? [0.7, 0.9, 0.7] : [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 2.5,
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
            background: "radial-gradient(circle at 30% 30%, rgba(255, 248, 220, 0.9), rgba(247, 217, 141, 0.8) 50%, rgba(237, 197, 101, 0.7))",
            boxShadow: "0 8px 32px rgba(247, 217, 141, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.3)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        />
      </motion.button>

      {/* Prompt text */}
      <motion.p
        className="mt-12 text-xl font-mono text-foreground/70 tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        What's on your mind?
      </motion.p>
    </div>
  );
};
