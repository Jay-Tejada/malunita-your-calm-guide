// src/components/orb/OrbButton.tsx

import { motion } from "framer-motion";
import { colors, getTimeOfDay, getOrbGradient, type OrbState, type TimeOfDay } from "@/ui/tokens";
import { haptics } from "@/hooks/useHaptics";

interface OrbButtonProps {
  state?: OrbState;
  timeOfDay?: TimeOfDay;
  size?: number;
  onPress?: () => void;
}

export function OrbButton({ 
  state = "resting", 
  timeOfDay, 
  size = 64,
  onPress 
}: OrbButtonProps) {
  const time = timeOfDay ?? getTimeOfDay();
  const gradient = getOrbGradient(time);

  const stateAnimations = {
    resting: { scale: 1, rotate: 0 },
    listening: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2 } },
    loading: { rotate: 360, transition: { repeat: Infinity, duration: 1.5, ease: "linear" as const } },
    success: { scale: [1, 1.15, 1], transition: { duration: 0.3 } },
    error: { x: [-4, 4, -4, 4, 0], transition: { duration: 0.3 } },
  };

  return (
    <button
      onClick={() => {
        haptics.lightTap();
        onPress?.();
      }}
      className="relative flex items-center justify-center focus:outline-none"
      aria-label="Capture with Malunita"
    >
      {/* Outer glow */}
      <div
        className="absolute rounded-full blur-xl opacity-40"
        style={{
          width: size * 1.5,
          height: size * 1.5,
          background: `radial-gradient(circle, ${gradient.from}, ${gradient.to})`,
        }}
      />
      
      {/* Main orb */}
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 20%, ${gradient.to}, ${gradient.from})`,
          boxShadow: `0 0 ${size * 0.6}px ${gradient.from}44`,
        }}
        animate={stateAnimations[state]}
      >
        {/* Inner planet */}
        <motion.div
          className="rounded-full"
          style={{
            width: size * 0.35,
            height: size * 0.35,
            backgroundColor: colors.bg.base,
            opacity: 0.7,
          }}
          animate={{ 
            rotate: state === "loading" ? -360 : 0 
          }}
          transition={{ 
            repeat: state === "loading" ? Infinity : 0, 
            duration: 8, 
            ease: "linear" 
          }}
        />
      </motion.div>
    </button>
  );
}
