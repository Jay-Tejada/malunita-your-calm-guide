// src/components/capture/CaptureSheet.tsx

import { useState } from "react";
import { BottomSheet } from "@/ui/BottomSheet";
import { CaptureInput } from "@/ui/CaptureInput";
import { OrbButton } from "@/components/orb/OrbButton";
import { colors, typography } from "@/ui/tokens";
import type { OrbState } from "@/ui/tokens";

interface CaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isRecording?: boolean;
}

export function CaptureSheet({
  isOpen,
  onClose,
  onSubmit,
  onVoiceStart,
  onVoiceStop,
  isRecording = false,
}: CaptureSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>("resting");

  const handleTextSubmit = async (text: string) => {
    setIsLoading(true);
    setOrbState("loading");
    try {
      await onSubmit(text);
      setOrbState("success");
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

  const handleVoiceToggle = () => {
    if (isRecording) {
      onVoiceStop?.();
      setOrbState("loading");
    } else {
      onVoiceStart?.();
      setOrbState("listening");
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Mini orb for voice */}
        <div className="flex flex-col items-center gap-3">
          <OrbButton
            state={orbState}
            size={56}
            onPress={handleVoiceToggle}
          />
          <span
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.bodyS.size,
              color: colors.text.muted,
            }}
          >
            {isRecording ? "Tap to stop" : "Tap to speak"}
          </span>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px" style={{ backgroundColor: colors.border.subtle }} />
          <span style={{ color: colors.text.muted, fontSize: typography.labelS.size }}>or type</span>
          <div className="flex-1 h-px" style={{ backgroundColor: colors.border.subtle }} />
        </div>

        {/* Text input */}
        <div className="w-full">
          <CaptureInput
            placeholder="Capture a thought..."
            onSubmit={handleTextSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
