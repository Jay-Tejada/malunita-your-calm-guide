import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface MobileTaskCaptureProps {
  placeholder: string;
  onCapture: (text: string) => void;
}

export const MobileTaskCapture = ({ placeholder, onCapture }: MobileTaskCaptureProps) => {
  const [input, setInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      onCapture(input.trim());
      setInput('');
      
      // Show success state briefly
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-foreground/5 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden z-30">
      <div className="relative w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20 transition-colors"
        />
        
        {/* Arrow or checkmark icon */}
        {input.trim() && !showSuccess && (
          <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
        )}
        
        {showSuccess && (
          <Check className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        )}
      </div>
    </div>
  );
};
