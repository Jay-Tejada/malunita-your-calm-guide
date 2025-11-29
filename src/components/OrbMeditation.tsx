import { useState, useRef, useEffect } from 'react';
import { Brain } from 'lucide-react';

interface OrbMeditationProps {
  onCapture: (text: string) => void;
  onThinkWithMe: () => void;
}

/**
 * OrbMeditation - Lightweight meditation surface for home screen
 * Target: < 10KB, loads in < 100ms
 * 
 * Features:
 * - Minimal orb with subtle glow
 * - Quick text capture
 * - No heavy dependencies
 * - Pure CSS animations
 */
export const OrbMeditation = ({ onCapture, onThinkWithMe }: OrbMeditationProps) => {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isInputOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputOpen]);

  const handleOrbClick = () => {
    setIsInputOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onCapture(inputText.trim());
      setInputText('');
      setIsInputOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsInputOpen(false);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12">
      {/* Main Orb */}
      <button
        onClick={handleOrbClick}
        className="relative group cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full"
        aria-label="Open meditation input"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse-opacity" />
        
        {/* Orb container */}
        <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-background via-card to-background border border-border/50 shadow-lg flex items-center justify-center overflow-hidden">
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
          
          {/* Moon icon */}
          <span className="text-6xl relative z-10" role="img" aria-label="moon">
            🌙
          </span>
        </div>
      </button>

      {/* Prompt text */}
      <div className="flex flex-col items-center gap-6">
        {!isInputOpen ? (
          <>
            <p className="text-lg font-mono text-foreground/45 text-center">
              What's on your mind?
            </p>
            
            {/* Think With Me button */}
            <button
              onClick={onThinkWithMe}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 text-foreground/60 text-sm font-mono transition-all duration-200 hover:bg-background hover:text-foreground/80 hover:border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <Brain className="w-4 h-4" />
              <span>Think With Me</span>
            </button>
          </>
        ) : (
          /* Quick input */
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your task or thought..."
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/40 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                autoComplete="off"
              />
              <div className="flex items-center justify-between text-xs font-mono text-foreground/40">
                <span>Press Enter to capture</span>
                <span>Press Esc to cancel</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
