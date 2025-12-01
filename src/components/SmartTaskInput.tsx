import { useState, useRef } from 'react';
import { useSmartDateParsing } from '@/hooks/useSmartDateParsing';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SmartTaskInputProps {
  placeholder?: string;
  onSubmit: (task: { 
    title: string; 
    scheduledDate?: Date; 
    scheduledTime?: Date;
    hasReminder: boolean;
  }) => void;
}

const SmartTaskInput = ({ placeholder = "Add a task...", onSubmit }: SmartTaskInputProps) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = useSmartDateParsing(input);

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    onSubmit({
      title: parsed.cleanTitle || input,
      scheduledDate: parsed.detectedDate || undefined,
      scheduledTime: parsed.hasTime ? parsed.detectedDate || undefined : undefined,
      hasReminder: parsed.hasTime, // Set reminder if specific time detected
    });
    
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      {/* Input with overlay for highlighting */}
      <div className="relative">
        {/* Background highlight layer */}
        {parsed.detectedDate && parsed.startIndex !== null && (
          <div 
            className="absolute inset-0 pointer-events-none flex items-center"
            aria-hidden="true"
          >
            <span className="font-mono text-sm text-transparent">
              {input.slice(0, parsed.startIndex)}
            </span>
            <span className="bg-blue-100 text-blue-600 rounded px-0.5 font-mono text-sm">
              {input.slice(parsed.startIndex, parsed.endIndex)}
            </span>
          </div>
        )}
        
        {/* Actual input - always visible */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="relative w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20"
        />
      </div>
      
      {/* Date chip below input - NOT inside */}
      {parsed.detectedDate && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">
            {parsed.hasTime ? (
              <Clock className="w-3 h-3" />
            ) : (
              <Calendar className="w-3 h-3" />
            )}
            <span>
              {parsed.hasTime 
                ? format(parsed.detectedDate, "MMM d 'at' h:mm a")
                : format(parsed.detectedDate, "MMM d, yyyy")
              }
            </span>
          </div>
          
          {parsed.hasTime && (
            <span className="text-[10px] text-muted-foreground/40">
              + reminder
            </span>
          )}
          
          <button 
            onClick={() => setInput(parsed.cleanTitle)}
            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 underline"
          >
            remove
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartTaskInput;
