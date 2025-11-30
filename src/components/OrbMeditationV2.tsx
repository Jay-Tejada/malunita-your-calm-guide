import { useState, useRef, useEffect } from 'react';
import { Mic, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanionIdentity } from '@/hooks/useCompanionIdentity';

interface OrbMeditationV2Props {
  onCapture?: (text: string) => void;
  onVoiceCapture?: () => void;
  onThinkWithMe?: () => void;
  userName?: string;
  isRecording?: boolean;
  isProcessing?: boolean;
}

type OrbState = 'idle' | 'active' | 'recording' | 'processing' | 'success';

export const OrbMeditationV2 = ({ 
  onCapture, 
  onVoiceCapture, 
  onThinkWithMe, 
  userName = 'there',
  isRecording = false,
  isProcessing = false,
}: OrbMeditationV2Props) => {
  const [inputText, setInputText] = useState('');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const { companion } = useCompanionIdentity();

  // Auto-focus input on desktop
  useEffect(() => {
    if (window.innerWidth >= 768 && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Sync orb state with voice recording state
  useEffect(() => {
    if (isRecording) {
      setOrbState('recording');
    } else if (isProcessing) {
      setOrbState('processing');
    } else if (!inputText) {
      setOrbState('idle');
    }
  }, [isRecording, isProcessing, inputText]);

  // Get contextual greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return `Good morning, ${userName} ✨`;
    if (hour >= 12 && hour < 18) return `Hey ${userName}`;
    if (hour >= 18 && hour < 24) return `Evening, ${userName}`;
    return `Still up, ${userName}?`;
  };

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    setOrbState(value ? 'active' : 'idle');
  };

  // Handle submit
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    setOrbState('processing');
    onCapture?.(inputText.trim());
    
    setTimeout(() => {
      setOrbState('success');
      setInputText('');
      setTimeout(() => setOrbState('idle'), 600);
    }, 300);
  };

  // Handle voice button
  const handleVoice = () => {
    onVoiceCapture?.();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 gap-12 md:gap-16">
      {/* Minimal Orb with Concentric Circles */}
      <div className="relative flex flex-col items-center justify-center gap-8">
        {/* The Orb - minimal concentric circles design */}
        <div className="relative flex items-center justify-center w-56 h-56 md:w-64 md:h-64">
          {/* Outer ring - thinnest */}
          <div 
            className={cn(
              "absolute inset-0 rounded-full",
              "border border-foreground/8",
              "transition-all duration-500",
              orbState === 'recording' && "scale-105 border-foreground/15",
              orbState === 'processing' && "animate-spin border-foreground/12"
            )}
            style={{ animationDuration: '3s' }}
          />
          
          {/* Middle ring */}
          <div 
            className={cn(
              "absolute inset-4 rounded-full",
              "border border-foreground/12",
              "transition-all duration-500",
              orbState === 'recording' && "scale-105 border-foreground/20",
              orbState === 'processing' && "animate-pulse"
            )}
          />
          
          {/* Inner ring */}
          <div 
            className={cn(
              "absolute inset-8 rounded-full",
              "border border-foreground/15",
              "transition-all duration-500",
              orbState === 'recording' && "scale-105 border-foreground/25"
            )}
          />
          
          {/* Core dot */}
          <div 
            className={cn(
              "w-3 h-3 rounded-full",
              "bg-foreground/30",
              "transition-all duration-300",
              orbState === 'recording' && "scale-150 bg-foreground/40",
              orbState === 'processing' && "animate-pulse bg-foreground/35",
              orbState === 'success' && "scale-125 bg-success/60"
            )}
          />
        </div>

        {/* Text labels */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-xl md:text-2xl font-light text-foreground/70 tracking-wide">
            {companion?.name || 'malunita'}
          </p>
          <p className="text-sm font-light text-foreground/40 tracking-wider">
            capture mode
          </p>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col items-center gap-4 w-full max-w-md md:hidden">
        {/* Voice Button - Primary Action on Mobile */}
        <button
          onClick={handleVoice}
          className="w-full h-[60px] rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow active:scale-[0.98]"
        >
          <Mic className="w-6 h-6" />
          Tap to talk
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full text-sm text-foreground/40">
          <div className="flex-1 h-px bg-border" />
          <span>or type below</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          className="w-full h-[48px] px-4 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-sm border-2 border-border/50 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
        />

      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col items-center gap-4 w-full max-w-[500px]">
        {/* Input Field - Auto-focused on Desktop */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          className="w-full h-[56px] px-6 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-sm border-2 border-border/50 text-foreground text-lg placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
        />

      </div>
    </div>
  );
};
