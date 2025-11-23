import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const prompts = [
  "What matters most today?",
  "Want to finish something small?",
  "Try a 2-minute win.",
  "What feels meaningful right now?",
  "Ready to make progress?",
  "Which task will move the needle?",
];

export const GuidanceBillboard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % prompts.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % prompts.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + prompts.length) % prompts.length);

  return (
    <div
      className="relative h-14 rounded-lg bg-gradient-to-br from-[#F5F1E8] to-[#EDE7DC] flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glowing dot */}
      <div className="absolute left-4 w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />

      {/* Text content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-sm text-foreground/80 px-10"
        >
          {prompts[currentIndex]}
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows (on hover) */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none"
        >
          <button
            onClick={goPrev}
            className="pointer-events-auto w-6 h-6 rounded-full bg-background/40 hover:bg-background/60 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={goNext}
            className="pointer-events-auto w-6 h-6 rounded-full bg-background/40 hover:bg-background/60 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </div>
  );
};
