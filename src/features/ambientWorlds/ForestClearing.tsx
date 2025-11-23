import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const ForestClearing = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, hsl(120, 40%, 85%), hsl(110, 35%, 75%), hsl(100, 30%, 65%))',
        }}
      />

      {/* Tree shadows */}
      <div 
        className="absolute top-0 left-0 w-1/4 h-full"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)',
        }}
      />
      <div 
        className="absolute top-0 right-0 w-1/4 h-full"
        style={{
          background: 'linear-gradient(to left, rgba(0,0,0,0.12), transparent)',
        }}
      />

      {/* Sun shafts */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 w-32 h-full"
          style={{
            left: `${20 + i * 15}%`,
            background: 'linear-gradient(to bottom, rgba(255, 250, 200, 0.25), transparent 70%)',
            transform: 'skewX(-10deg)',
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grass floor */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/4"
        style={{
          background: 'linear-gradient(to top, hsl(110, 50%, 40%), transparent)',
        }}
      />

      {/* Fireflies */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${40 + Math.random() * 40}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-2 h-2 text-yellow-300" fill="currentColor" />
        </motion.div>
      ))}

      {/* Leaf shadows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-8 rounded-full bg-primary/10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
};
