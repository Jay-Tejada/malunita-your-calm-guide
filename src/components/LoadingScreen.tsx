import { motion } from "framer-motion";

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        className="text-6xl"
        animate={{ 
          opacity: [0.4, 1, 0.4],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        🌙
      </motion.div>
    </div>
  );
};
