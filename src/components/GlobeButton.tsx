import { motion } from "framer-motion";
import { Globe2, Home } from "lucide-react";
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

  const Icon = variant === "home" ? Home : Globe2;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        positionClasses[position],
        "z-50 h-12 w-12 rounded-full",
        "bg-background/80 backdrop-blur-sm border border-border/50",
        "hover:bg-background transition-all duration-300",
        "flex items-center justify-center group",
        "shadow-lg hover:shadow-xl"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon 
        className={cn(
          "w-5 h-5 transition-all duration-300",
          isActive ? "text-primary" : "text-foreground/60",
          "group-hover:text-primary group-hover:scale-110"
        )}
      />
      
      {isActive && (
        <motion.div
          layoutId="active-glow"
          className="absolute inset-0 rounded-full bg-primary/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.button>
  );
};
