import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";

interface CaptureModeProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceInput?: () => void;
}

export const CaptureMode = ({ isOpen, onClose, onVoiceInput }: CaptureModeProps) => {
  const [input, setInput] = useState("");
  const { createTasks } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsSubmitting(true);
    try {
      await createTasks([{ title: input.trim() }]);
      toast.success("Captured");
      setInput("");
      onClose();
    } catch (error) {
      toast.error("Failed to capture thought");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4"
        >
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Center orb - expanded */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-12"
            style={{
              background: "linear-gradient(135deg, hsl(var(--orb-amber)) 0%, hsl(var(--orb-amber-glow)) 100%)",
              boxShadow: "0 12px 48px hsla(var(--orb-amber-shadow), 0.5), 0 0 32px hsla(var(--orb-amber), 0.4)",
            }}
          >
            <div 
              className="absolute inset-0 rounded-full opacity-60 blur-xl"
              style={{
                background: "radial-gradient(circle, hsla(var(--orb-amber), 0.6) 0%, transparent 70%)",
              }}
            />
          </motion.div>

          {/* Prompt */}
          <h1 
            className="text-2xl md:text-3xl text-foreground mb-8 text-center"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            What's on your mind?
          </h1>

          {/* Input area */}
          <div className="w-full max-w-xl space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a thought, task, or idea..."
              className="min-h-[120px] text-base resize-none border-2 focus:border-primary/20"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              autoFocus
            />

            <div className="flex items-center gap-3 justify-center">
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isSubmitting}
                className="px-8"
              >
                Capture
              </Button>

              {onVoiceInput && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onVoiceInput}
                  className="w-12 h-12"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Subtle hint */}
          <p 
            className="text-xs text-foreground-soft/60 mt-8 text-center"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Press Enter to capture • Esc to close
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
