import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  type: "priority" | "quick-win" | "follow-up" | "thinking-prompt";
  text: string;
  taskId?: string;
}

interface BillboardSuggestionProps {
  suggestions: Suggestion[];
  onAddToToday?: (taskId?: string) => void;
  onMarkDone?: (taskId?: string) => void;
  onLater?: () => void;
}

export function BillboardSuggestion({
  suggestions,
  onAddToToday,
  onMarkDone,
  onLater,
}: BillboardSuggestionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-hide after 12 seconds
  useEffect(() => {
    if (!isVisible || isMinimized || suggestions.length === 0) return;

    const hideTimer = setTimeout(() => {
      setIsMinimized(true);
    }, 12000);

    return () => clearTimeout(hideTimer);
  }, [isVisible, isMinimized, suggestions.length, currentIndex]);

  // Rotate suggestions every 45 seconds if still visible
  useEffect(() => {
    if (!isVisible || isMinimized || suggestions.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestions.length);
    }, 45000);

    return () => clearInterval(interval);
  }, [isVisible, isMinimized, suggestions.length]);

  if (!isVisible || suggestions.length === 0) return null;

  if (isMinimized) {
    return (
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsMinimized(false)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full text-xs font-medium transition-all shadow-sm"
      >
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-primary">Suggestions</span>
      </motion.button>
    );
  }

  const currentSuggestion = suggestions[currentIndex];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4"
      >
        <div className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">
                  {currentSuggestion.text}
                </p>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentSuggestion.type !== "thinking-prompt" && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAddToToday?.(currentSuggestion.taskId)}
                    className="text-xs h-7"
                  >
                    Add to Today
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMarkDone?.(currentSuggestion.taskId)}
                    className="text-xs h-7"
                  >
                    Mark Done
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onLater}
                className="text-xs h-7 ml-auto"
              >
                Later
              </Button>
            </div>

            {/* Progress dots */}
            {suggestions.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {suggestions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      idx === currentIndex
                        ? "bg-primary w-4"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
