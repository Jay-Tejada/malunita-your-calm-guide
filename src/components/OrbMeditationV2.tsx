import { useState, useRef, useEffect } from 'react';
import { Mic, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrbMeditationV2Props {
  onCapture?: (text: string) => void;
  onVoiceCapture?: () => void;
  onThinkWithMe?: () => void;
  userName?: string;
}

type OrbState = 'idle' | 'active' | 'recording' | 'processing' | 'success';

export const OrbMeditationV2 = ({ 
  onCapture, 
  onVoiceCapture, 
  onThinkWithMe, 
  userName = 'there' 
}: OrbMeditationV2Props) => {
  const [inputText, setInputText] = useState('');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-focus input on desktop
  useEffect(() => {
    if (window.innerWidth >= 768 && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
    setOrbState('recording');
    onVoiceCapture?.();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 gap-6 md:gap-8">
      <style>{`
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes orb-active {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes orb-recording {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.02) rotate(-2deg); }
          75% { transform: scale(1.02) rotate(2deg); }
        }
        @keyframes orb-shimmer {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 1; }
        }
        @keyframes orb-success {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .orb-idle { animation: orb-breathe 5s ease-in-out infinite; }
        .orb-active { animation: orb-active 2s ease-in-out infinite; }
        .orb-recording { animation: orb-recording 1s ease-in-out infinite; }
        .orb-processing { animation: orb-shimmer 1.5s ease-in-out infinite; }
        .orb-success { animation: orb-success 0.6s ease-out; }
      `}</style>

      {/* Orb */}
      <div className="relative">
        <div 
          className={cn(
            "w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full",
            `orb-${orbState}`
          )}
          style={{
            background: 'radial-gradient(circle at 40% 40%, #fef3c7 0%, #fde68a 30%, #fbbf24 60%, #f59e0b 100%)',
            border: '2px solid rgba(251, 191, 36, 0.3)',
            boxShadow: 'inset 0 0 20px rgba(254, 243, 199, 0.5)',
            filter: 'drop-shadow(0 0 40px rgba(251, 191, 36, 0.2))'
          }}
        />
      </div>

      {/* Greeting */}
      <h1 className="text-xl md:text-2xl font-light text-foreground/80">
        {getGreeting()}
      </h1>

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
