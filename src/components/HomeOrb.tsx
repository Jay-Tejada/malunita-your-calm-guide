import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useState } from "react";

interface HomeOrbProps {
  onCapture?: () => void;
}

export const HomeOrb = ({ onCapture }: HomeOrbProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Main Orb */}
      <motion.button
        onClick={onCapture}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative group"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Glow layers */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-3xl"
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
            opacity: isHovered ? [0.3, 0.5, 0.3] : 0.3,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30 blur-2xl"
          animate={{
            scale: isHovered ? [1, 1.15, 1] : 1,
            opacity: isHovered ? [0.4, 0.6, 0.4] : 0.4,
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Core orb */}
        <motion.div
          className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/30 shadow-2xl flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic className="w-12 h-12 text-primary/80" />
        </motion.div>
      </motion.button>

      {/* Prompt text */}
      <motion.p
        className="mt-8 text-lg font-mono text-foreground/60"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        What's on your mind?
      </motion.p>
    </div>
  );
};
