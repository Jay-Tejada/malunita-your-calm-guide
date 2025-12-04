import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useThoughts } from '@/hooks/useThoughts';
import { useQueryClient } from '@tanstack/react-query';
import { useTasks } from '@/hooks/useTasks';

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'mobile' | 'desktop';
  onCapture?: () => void;
}

export const QuickCapture = ({ isOpen, onClose, variant, onCapture }: QuickCaptureProps) => {
  const [input, setInput] = useState('');
  const [captureType, setCaptureType] = useState<'task' | 'thought'>('task');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { addThought } = useThoughts();
  const queryClient = useQueryClient();
  const { createTasks } = useTasks();
  
  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate line height and max height (5 rows)
    const lineHeight = 24; // approximate line height in px
    const maxHeight = lineHeight * 5;
    
    // Set new height, capped at maxHeight
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // Enable/disable scrolling based on content
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };
  
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered before focusing
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        adjustTextareaHeight();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);
  
  const handleSubmit = async (keepOpen = false) => {
    if (!input.trim()) return;
    
    const capturedText = input.trim();
    
    // Clear input immediately for instant feedback
    setInput('');
    
    if (!keepOpen) {
      onClose();
    }
    
    try {
      if (captureType === 'thought') {
        // Save as thought
        addThought({ content: capturedText, source: 'quick-capture' });
        
        toast({ 
          description: 'Thought captured',
          duration: 1500 
        });
        
        onCapture?.();
      } else {
        // Save task INSTANTLY using optimistic mutation
        // This uses the useTasks hook which has built-in optimistic updates
        createTasks([{ title: capturedText }]);
        
        onCapture?.();
      }
    } catch (error) {
      console.error('QuickCapture: Error capturing:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('QuickCapture: handleKeyDown fired, key:', e.key, 'shiftKey:', e.shiftKey);
    
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('QuickCapture: Enter pressed, calling handleSubmit');
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(false);
    } else if (e.key === 'Enter' && e.shiftKey && variant === 'desktop') {
      console.log('QuickCapture: Shift+Enter pressed, calling handleSubmit with keepOpen');
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(true);
    } else if (e.key === 'Escape') {
      console.log('QuickCapture: Escape pressed, closing');
      onClose();
      setInput('');
    }
  };

  if (!isOpen) return null;

  // Mobile: appears above orb area
  if (variant === 'mobile') {
    return (
      <div className="fixed inset-x-0 bottom-48 flex justify-center px-6 z-50 animate-fade-in">
        <div className="w-full max-w-sm bg-background/90 backdrop-blur-sm rounded-lg border border-foreground/10 p-3">
          {/* Type toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setCaptureType('task')}
              className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
                captureType === 'task' 
                  ? 'bg-foreground/10 text-foreground/70' 
                  : 'text-foreground/40 hover:text-foreground/60'
              }`}
            >
              Task
            </button>
            <button
              onClick={() => setCaptureType('thought')}
              className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
                captureType === 'thought' 
                  ? 'bg-foreground/10 text-foreground/70' 
                  : 'text-foreground/40 hover:text-foreground/60'
              }`}
            >
              Thought
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={captureType === 'thought' ? "What's on your mind..." : "Capture a task..."}
            rows={1}
            className="w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20 resize-none overflow-hidden"
            style={{ minHeight: '24px' }}
          />
        </div>
      </div>
    );
  }

  // Desktop: centered modal
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={() => {
          onClose();
          setInput('');
        }}
      />
      
      {/* Modal */}
      <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
        <div className="bg-background border border-foreground/10 rounded-xl shadow-lg p-4">
          {/* Type toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setCaptureType('task')}
              className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
                captureType === 'task' 
                  ? 'bg-foreground/10 text-foreground/70' 
                  : 'text-foreground/40 hover:text-foreground/60'
              }`}
            >
              Task
            </button>
            <button
              onClick={() => setCaptureType('thought')}
              className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
                captureType === 'thought' 
                  ? 'bg-foreground/10 text-foreground/70' 
                  : 'text-foreground/40 hover:text-foreground/60'
              }`}
            >
              Thought
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              captureType === 'thought' 
                ? "What's on your mind... (Enter to save, Esc to close)"
                : "Capture a task... (Enter to save, Esc to close)"
            }
            rows={1}
            className="w-full bg-transparent font-mono text-base text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none resize-none overflow-hidden"
            style={{ minHeight: '24px' }}
          />
          
          {/* Hint text */}
          <p className="mt-2 text-[10px] text-muted-foreground/40 font-mono">
            Shift+Enter to save & continue
          </p>
        </div>
      </div>
    </>
  );
};
