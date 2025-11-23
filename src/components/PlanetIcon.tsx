import React from "react";
import { motion } from "framer-motion";
import { ListTodo, Sparkles, Brain, Settings } from "lucide-react";

interface PlanetIconProps {
  position: "top" | "right" | "bottom" | "left";
  onClick: () => void;
  isActive: boolean;
}

const iconMap = {
  left: ListTodo,    // Tasks
  right: Sparkles,   // Companion
  top: Brain,        // Insights
  bottom: Settings,  // Settings
};

export const PlanetIcon: React.FC<PlanetIconProps> = ({ position, onClick, isActive }) => {
  const Icon = iconMap[position];

  return (
    <motion.button
      onClick={onClick}
      className="relative group cursor-pointer"
      whileHover={{ y: -3, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        rotate: 360,
      }}
      transition={{
        rotate: {
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        },
      }}
    >
      {/* Outer glow ring */}
      <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
        isActive 
          ? "bg-amber-300/40 blur-lg scale-150" 
          : "bg-amber-200/20 blur-md scale-125 group-hover:bg-amber-300/30 group-hover:scale-140"
      }`} />
      
      {/* Planet body */}
      <div className={`relative w-8 h-8 rounded-full border transition-all duration-300 ${
        isActive
          ? "bg-amber-300 border-amber-400 shadow-lg"
          : "bg-card border-border/30 group-hover:bg-amber-100 group-hover:border-amber-300"
      }`}>
        {/* Icon inside planet */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon 
            className={`w-4 h-4 transition-colors ${
              isActive ? "text-amber-700" : "text-foreground/50 group-hover:text-amber-600"
            }`}
            style={{ rotate: "-360deg" }} // Counter-rotate to keep icon upright
          />
        </div>

        {/* Orbital ring */}
        <div className={`absolute inset-0 rounded-full border border-dashed transition-all duration-300 scale-150 ${
          isActive
            ? "border-amber-400/40"
            : "border-border/20 group-hover:border-amber-300/40"
        }`} />
      </div>
    </motion.button>
  );
};
