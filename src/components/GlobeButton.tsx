import { motion } from "framer-motion";
import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobeButtonProps {
  position: "top-left" | "top-right";
  onClick: () => void;
  variant?: "menu" | "home";
  isActive?: boolean;
}

export const GlobeButton = ({ 
  position, 
  onClick, 
  variant = "menu",
  isActive = false 
}: GlobeButtonProps) => {
  const positionClasses = {
    "top-left": "fixed top-6 left-6",
    "top-right": "fixed top-6 right-6",
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        positionClasses[position],
        "z-50 flex items-center justify-center group"
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Globe2 
          className={cn(
            "w-8 h-8 transition-colors duration-300",
            isActive ? "text-primary" : "text-foreground/60",
            "group-hover:text-primary"
          )}
        />
      </motion.div>
    </motion.button>
  );
};
