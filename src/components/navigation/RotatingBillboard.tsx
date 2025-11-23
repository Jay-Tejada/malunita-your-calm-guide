import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Target, Zap, Clock } from "lucide-react";

const suggestions = [
  {
    icon: Target,
    label: "Focus",
    text: "What are your top 3 priorities today?",
  },
  {
    icon: Zap,
    label: "Quick Win",
    text: "Knock out a small task in under 10 minutes.",
  },
  {
    icon: Clock,
    label: "Time Check",
    text: "Any upcoming deadlines you need to prepare for?",
  },
  {
    icon: Sparkles,
    label: "Reflect",
    text: "How did yesterday go? What went well?",
  },
];

export const RotatingBillboard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestions.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const current = suggestions[currentIndex];
  const Icon = current.icon;

  return (
    <div className="relative h-24 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center gap-4 p-4 bg-card rounded-2xl shadow-malunita-card"
        >
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(var(--orb-amber)) 0%, hsl(var(--orb-amber-glow)) 100%)",
            }}
          >
            <Icon className="w-6 h-6 text-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p 
              className="text-xs font-medium text-foreground-soft mb-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {current.label}
            </p>
            <p 
              className="text-sm text-foreground line-clamp-2"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {current.text}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {suggestions.map((_, index) => (
          <div
            key={index}
            className="w-1 h-1 rounded-full transition-all"
            style={{
              background: index === currentIndex 
                ? "hsl(var(--orb-amber-shadow))" 
                : "hsl(var(--foreground-soft) / 0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
};
