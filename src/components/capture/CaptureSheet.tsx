// src/components/capture/CaptureSheet.tsx

import { useState } from "react";
import { BottomSheet } from "@/ui/BottomSheet";
import { CaptureInput } from "@/ui/CaptureInput";
import { OrbButton } from "@/components/orb/OrbButton";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { colors, typography } from "@/ui/tokens";
import type { OrbState } from "@/ui/tokens";

interface CaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

export function CaptureSheet({ isOpen, onClose, onSubmit }: CaptureSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("resting");
  const [pendingText, setPendingText] = useState("");

  const handleFinalSubmit = async (text: string) => {
    setIsLoading(true);
    setOrbState("loading");
    try {
      await onSubmit(text);
      setOrbState("success");
      setPendingText("");
      setTimeout(() => {
        setOrbState("resting");
        onClose();
      }, 600);
    } catch {
      setOrbState("error");
      setTimeout(() => setOrbState("resting"), 400);
    } finally {
      setIsLoading(false);
    }
  };

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceCapture({
    onTranscript: (text) => {
      setPendingText(text);
      setOrbState("resting");
    },
    onError: () => {
      setOrbState("error");
      setTimeout(() => setOrbState("resting"), 400);
    },
  });

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
      setOrbState("loading");
    } else {
      startRecording();
      setOrbState("listening");
    }
  };

  // Auto-update orb state when processing
  const currentOrbState = isProcessing ? "loading" : orbState;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Voice orb */}
        <div className="flex flex-col items-center gap-3">
          <OrbButton state={currentOrbState} size={56} onPress={handleVoiceToggle} />
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.bodyS.size,
              color: colors.text.muted,
            }}
          >
            {isRecording ? "Listening..." : isProcessing ? "Processing..." : "Tap to speak"}
          </span>
        </div>

        {/* Show transcribed text if exists */}
        {pendingText && (
          <div
            className="w-full p-3 rounded-lg"
            style={{ backgroundColor: colors.bg.elevated, border: `1px solid ${colors.border.subtle}` }}
          >
            <p style={{ color: colors.text.primary, fontFamily: typography.fontFamily, fontSize: typography.bodyM.size }}>
              {pendingText}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setPendingText("")}
                style={{ color: colors.text.muted, fontSize: typography.bodyS.size }}
              >
                Clear
              </button>
              <button
                onClick={() => handleFinalSubmit(pendingText)}
                style={{ color: colors.accent.primary, fontSize: typography.bodyS.size, fontWeight: 500 }}
              >
                Add Task
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        {!pendingText && (
          <>
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px" style={{ backgroundColor: colors.border.subtle }} />
              <span style={{ color: colors.text.muted, fontSize: typography.labelS.size }}>or type</span>
              <div className="flex-1 h-px" style={{ backgroundColor: colors.border.subtle }} />
            </div>
            <div className="w-full">
              <CaptureInput placeholder="Capture a thought..." onSubmit={handleFinalSubmit} isLoading={isLoading} />
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
