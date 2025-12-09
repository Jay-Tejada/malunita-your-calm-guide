// src/components/capture/CaptureSheet.tsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrbButton } from "@/components/orb/OrbButton";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { categorizeTask } from "@/hooks/useTaskCategorization";
import { colors, typography, layout } from "@/ui/tokens";
import { haptics } from "@/hooks/useHaptics";
import type { OrbState } from "@/ui/tokens";

interface CaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<{ id: string } | void>;
}

export function CaptureSheet({ isOpen, onClose, onSubmit }: CaptureSheetProps) {
  const [text, setText] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("resting");

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceCapture({
    onTranscript: (t) => {
      setText(t);
      setOrbState("resting");
    },
    onError: () => {
      haptics.error();
      setOrbState("error");
      setTimeout(() => setOrbState("resting"), 400);
    },
  });

  // Sync orb state with recording/processing
  useEffect(() => {
    if (isProcessing) setOrbState("loading");
    else if (isRecording) setOrbState("listening");
  }, [isRecording, isProcessing]);

  const handleVoiceToggle = () => {
    haptics.lightTap();
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setOrbState("loading");
    try {
      // Save task and get the new task ID
      const newTask = await onSubmit(text.trim());
      
      // Auto-categorize in background (don't block UI)
      if (newTask && 'id' in newTask) {
        categorizeTask(newTask.id, text.trim()).then((result) => {
          if (result.isTinyTask) {
            console.log("Tiny task detected:", result.estimatedMinutes, "min");
          }
        });
      }

      haptics.success();
      setOrbState("success");
      setTimeout(() => {
        setText("");
        setOrbState("resting");
        onClose();
      }, 500);
    } catch {
      haptics.error();
      setOrbState("error");
      setTimeout(() => setOrbState("resting"), 400);
    }
  };

  const getStatusText = () => {
    if (isRecording) return "Listening...";
    if (isProcessing) return "Processing...";
    if (text) return "Ready to capture";
    return "Tap orb to speak";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(5,5,9,0.85)", backdropFilter: "blur(12px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              background: `linear-gradient(180deg, ${colors.bg.surface} 0%, ${colors.bg.base} 100%)`,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: "env(safe-area-inset-bottom, 24px)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 99,
                  backgroundColor: colors.border.strong,
                }}
              />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-8">
              
              {/* Orb with glow ring */}
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${colors.accent.primary}22 0%, transparent 70%)`,
                    transform: "scale(1.8)",
                  }}
                  animate={{
                    opacity: isRecording ? [0.4, 0.7, 0.4] : 0.3,
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <OrbButton state={orbState} size={100} onPress={handleVoiceToggle} />
              </div>

              {/* Status */}
              <p
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.bodyS.size,
                  color: colors.text.muted,
                  textAlign: "center",
                }}
              >
                {getStatusText()}
              </p>

              {/* Text input area */}
              <div className="w-full">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Or type your thought..."
                  rows={3}
                  className="w-full resize-none outline-none"
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.bodyM.size,
                    color: colors.text.primary,
                    backgroundColor: colors.bg.elevated,
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: layout.radius.md,
                    padding: "14px 16px",
                  }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl transition-colors"
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.bodyM.size,
                    color: colors.text.secondary,
                    backgroundColor: colors.bg.elevated,
                    border: `1px solid ${colors.border.subtle}`,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || orbState === "loading"}
                  className="flex-1 py-3 rounded-xl transition-opacity"
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.bodyM.size,
                    fontWeight: 500,
                    color: colors.bg.base,
                    backgroundColor: colors.accent.primary,
                    opacity: text.trim() ? 1 : 0.5,
                  }}
                >
                  {orbState === "loading" ? "Saving..." : "Capture"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
