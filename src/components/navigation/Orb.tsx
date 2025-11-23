import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface OrbProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  pulseAnimation?: boolean;
}

export const Orb = ({ icon: Icon, label, isActive = false, onClick, pulseAnimation = false }: OrbProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 group"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 1.05 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Main Orb */}
      <motion.div
        className="relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
        style={{
          background: isActive 
            ? "linear-gradient(135deg, hsl(var(--orb-amber)) 0%, hsl(var(--orb-amber-glow)) 100%)"
            : "linear-gradient(135deg, hsl(var(--orb-amber)) 0%, hsl(var(--orb-amber-glow)) 100%)",
          boxShadow: isActive
            ? "0 8px 32px hsla(var(--orb-amber-shadow), 0.5), 0 0 24px hsla(var(--orb-amber), 0.4)"
            : "0 4px 16px hsla(var(--orb-amber-shadow), 0.3), 0 0 12px hsla(var(--orb-amber), 0.2)",
        }}
        animate={
          pulseAnimation
            ? {
                scale: [1, 1.05, 1],
                opacity: [0.9, 1, 0.9],
              }
            : {}
        }
        transition={
          pulseAnimation
            ? {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : {}
        }
      >
        {/* Inner glow layer */}
        <div 
          className="absolute inset-0 rounded-full opacity-60 blur-md"
          style={{
            background: "radial-gradient(circle, hsla(var(--orb-amber), 0.6) 0%, transparent 70%)",
          }}
        />
        
        {/* Icon */}
        <Icon 
          className="w-7 h-7 md:w-9 md:h-9 text-foreground relative z-10"
          strokeWidth={1.5}
        />
      </motion.div>

      {/* Label */}
      <span 
        className="text-xs md:text-sm font-medium text-foreground-soft group-hover:text-foreground transition-colors"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {label}
      </span>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute -bottom-1 w-1 h-1 rounded-full"
          style={{ background: "hsl(var(--orb-amber-shadow))" }}
          layoutId="activeOrb"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </motion.button>
  );
};
