import { useState } from 'react';
import { Drawer } from 'vaul';
import { Mic, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration?: number;
}

export function VoiceSheet({
  open,
  onOpenChange,
  onStartRecording,
  onStopRecording,
  isRecording,
  isProcessing,
  recordingDuration = 0,
}: VoiceSheetProps) {
  const handleVoiceButton = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100]" />
        <Drawer.Content className="bg-card flex flex-col rounded-t-[24px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-[100]">
          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-8 mt-4" />

          <div className="flex flex-col items-center justify-center flex-1 px-6 pb-safe">
            {/* Status Text */}
            <div className="mb-8 text-center">
              {isProcessing ? (
                <>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Processing...
                  </h2>
                  <p className="text-foreground-soft">
                    Understanding your voice
                  </p>
                </>
              ) : isRecording ? (
                <>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Listening
                  </h2>
                  <p className="text-foreground-soft">
                    Speak naturally
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Voice Capture
                  </h2>
                  <p className="text-foreground-soft">
                    Tap to start recording
                  </p>
                </>
              )}
            </div>

            {/* Voice Button - Large and Centered */}
            <button
              onClick={handleVoiceButton}
              disabled={isProcessing}
              className={cn(
                "relative w-40 h-40 rounded-full transition-all duration-300",
                "flex items-center justify-center",
                "focus:outline-none focus:ring-4 focus:ring-primary/20",
                isRecording
                  ? "bg-destructive shadow-malunita-orb scale-110"
                  : "bg-primary shadow-malunita-card hover:scale-105 active:scale-95",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Pulse Animation Ring */}
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-20" />
              )}

              {/* Icon */}
              {isProcessing ? (
                <Loader2 className="w-16 h-16 text-primary-foreground animate-spin" />
              ) : isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary-foreground" />
                  <span className="text-xs text-primary-foreground font-mono">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
              ) : (
                <Mic className="w-16 h-16 text-primary-foreground" />
              )}
            </button>

            {/* Helper Text */}
            <div className="mt-8 text-center">
              {isRecording ? (
                <p className="text-sm text-foreground-soft">
                  Tap again to stop recording
                </p>
              ) : (
                <p className="text-sm text-foreground-soft">
                  Hold and speak, or tap to start
                </p>
              )}
            </div>

            {/* Visual Waveform Indicator */}
            {isRecording && (
              <div className="flex items-center gap-1 mt-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 bg-primary rounded-full transition-all",
                      "animate-pulse"
                    )}
                    style={{
                      height: `${Math.random() * 24 + 12}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Tips */}
          <div className="px-6 pb-8 pt-4 border-t border-border/50">
            <div className="flex items-center justify-center gap-2 text-xs text-foreground-soft">
              <CheckCircle2 className="w-4 h-4" />
              <span>Swipe down to dismiss</span>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
