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
        {/* Hidden layer that shows highlighting */}
        <div 
          className="absolute inset-0 py-3 font-mono text-sm pointer-events-none whitespace-pre-wrap break-words"
          aria-hidden="true"
        >
          {parsed.startIndex !== null ? (
            <>
              <span className="text-transparent">{input.slice(0, parsed.startIndex)}</span>
              <span className="bg-blue-500/20 text-blue-600/80 rounded px-0.5">
                {input.slice(parsed.startIndex, parsed.endIndex)}
              </span>
              <span className="text-transparent">{input.slice(parsed.endIndex)}</span>
            </>
          ) : (
            <span className="text-transparent">{input}</span>
          )}
        </div>
        
        {/* Actual input (transparent text when date detected, visible caret) */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="relative w-full bg-transparent border-b border-foreground/10 py-3 font-mono text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20 caret-foreground/80"
          style={{ color: parsed.detectedDate ? 'transparent' : undefined }}
        />
        
        {/* Visible text layer when date is detected */}
        {parsed.detectedDate && (
          <div className="absolute inset-0 py-3 font-mono text-sm pointer-events-none whitespace-pre-wrap break-words">
            <span className="text-foreground/80">{input.slice(0, parsed.startIndex)}</span>
            <span className="text-blue-500">{input.slice(parsed.startIndex, parsed.endIndex)}</span>
            <span className="text-foreground/80">{input.slice(parsed.endIndex)}</span>
          </div>
        )}
      </div>
      
      {/* Date detection indicator */}
      {parsed.detectedDate && (
        <div className="flex items-center gap-2 mt-2 animate-fade-in">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600/70 text-xs">
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
          
          {/* Option to remove detected date */}
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
