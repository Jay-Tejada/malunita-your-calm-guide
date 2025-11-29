import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OrbMeditationProps {
  onCapture?: (text: string) => void;
  onThinkWithMe?: () => void;
  className?: string;
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
export const OrbMeditation = ({ 
  onCapture, 
  onThinkWithMe, 
  className 
}: OrbMeditationProps) => {
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
      onCapture?.(inputText.trim());
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
    <div className={cn("flex flex-col items-center justify-center min-h-[60vh] gap-8", className)}>
      {/* Orb Container */}
      <div className="relative">
        {/* Outer glow layer */}
        <div className="absolute inset-0 rounded-full blur-3xl bg-primary/20 animate-pulse-opacity" />
        
        {/* Middle glow layer */}
        <div 
          className="absolute inset-2 rounded-full blur-2xl bg-primary/30 animate-pulse-opacity" 
          style={{ animationDelay: '0.5s' }} 
        />
        
        {/* Main orb */}
        <button
          onClick={handleOrbClick}
          disabled={isInputOpen}
          className={cn(
            "relative w-40 h-40 rounded-full",
            "bg-gradient-radial from-primary/40 via-primary/20 to-transparent",
            "border-2 border-primary/30",
            "backdrop-blur-sm",
            "transition-all duration-500 ease-out",
            "shadow-lg shadow-primary/10",
            !isInputOpen && "hover:scale-105 hover:border-primary/50 cursor-pointer",
            !isInputOpen && "active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          )}
          aria-label="Meditation orb"
        >
          {/* Inner gradient pulse */}
          <div 
            className="absolute inset-4 rounded-full bg-gradient-radial from-primary/30 to-transparent animate-pulse-opacity" 
            style={{ animationDelay: '1s' }} 
          />
          
          {/* Core glow */}
          <div className="absolute inset-8 rounded-full bg-primary/40 blur-md" />
        </button>
      </div>

      {/* Text or Input */}
      <div className="w-full max-w-md px-4">
        {!isInputOpen ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-foreground/60 text-lg font-light animate-fade-in">
              What's on your mind?
            </p>
            
            {/* Optional Think With Me button */}
            {onThinkWithMe && (
              <button
                onClick={onThinkWithMe}
                className={cn(
                  "text-sm text-foreground/50 hover:text-foreground/80",
                  "transition-colors duration-200",
                  "underline underline-offset-4 decoration-foreground/20",
                  "hover:decoration-foreground/40"
                )}
              >
                or think with me
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full animate-fade-in">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your thoughts..."
              className={cn(
                "w-full px-6 py-4 rounded-full",
                "bg-card/50 backdrop-blur-sm",
                "border-2 border-primary/20",
                "text-foreground text-center text-lg",
                "placeholder:text-foreground/40",
                "focus:outline-none focus:border-primary/50",
                "transition-all duration-300",
                "shadow-lg shadow-primary/5"
              )}
              autoComplete="off"
            />
            
            {/* Subtle hints */}
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-foreground/40">
              <span>Enter to capture</span>
              <span className="text-foreground/20">•</span>
              <span>Esc to cancel</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
