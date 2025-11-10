import { useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceOrbProps {
  onVoiceInput?: (text: string) => void;
}

export const VoiceOrb = ({ onVoiceInput }: VoiceOrbProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const handleClick = () => {
    if (isListening) {
      setIsListening(false);
      // In next version, stop recording
    } else {
      setIsListening(true);
      setIsResponding(false);
      // In next version, start recording
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex flex-col items-center gap-3">
        {/* Response text area */}
        {isResponding && (
          <div className="mb-2 px-6 py-3 bg-card rounded-2xl shadow-lg border border-secondary animate-in fade-in duration-300">
            <p className="text-sm text-foreground max-w-xs text-center">
              Good morning. Here's what's on your list today...
            </p>
          </div>
        )}

        {/* Voice Orb */}
        <button
          onClick={handleClick}
          className={`relative w-20 h-20 rounded-full transition-all duration-500 ease-in-out shadow-xl
            ${isListening 
              ? 'bg-background border-4 border-orb-listening scale-110' 
              : isResponding
              ? 'bg-orb-responding border-4 border-orb-listening animate-breathing'
              : 'bg-card border-2 border-secondary hover:scale-105 hover:border-accent'
            }`}
        >
          {/* Waveform animation when listening */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-orb-waveform rounded-full animate-waveform"
                  style={{
                    height: '40%',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Microphone icon when not active */}
          {!isListening && !isResponding && (
            <div className="flex items-center justify-center w-full h-full">
              <Mic className="w-8 h-8 text-foreground" />
            </div>
          )}
        </button>

        {/* Status text */}
        <p className="text-xs text-muted-foreground">
          {isListening ? 'Listening...' : isResponding ? 'Thinking...' : 'Tap to speak'}
        </p>
      </div>
    </div>
  );
};
