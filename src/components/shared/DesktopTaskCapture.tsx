import { useState, forwardRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface DesktopTaskCaptureProps {
  placeholder: string;
  onCapture: (text: string) => void;
}

export const DesktopTaskCapture = forwardRef<HTMLInputElement, DesktopTaskCaptureProps>(
  ({ placeholder, onCapture }, ref) => {
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
      <div className="hidden md:block mb-4">
        <div className="relative w-full">
          <input
            ref={ref}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-foreground/10 py-3 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20 transition-colors"
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
  }
);

DesktopTaskCapture.displayName = 'DesktopTaskCapture';
