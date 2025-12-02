import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useThoughts } from '@/hooks/useThoughts';
import { useQueryClient } from '@tanstack/react-query';

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'mobile' | 'desktop';
  onCapture?: () => void;
}

export const QuickCapture = ({ isOpen, onClose, variant, onCapture }: QuickCaptureProps) => {
  const [input, setInput] = useState('');
  const [captureType, setCaptureType] = useState<'task' | 'thought'>('task');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addThought } = useThoughts();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  const handleSubmit = async (keepOpen = false) => {
    if (!input.trim()) return;
    
    console.log('QuickCapture: handleSubmit called with input:', input.trim());
    
    try {
      if (captureType === 'thought') {
        // Save as thought
        addThought({ content: input.trim(), source: 'quick-capture' });
        
        setInput('');
        
        if (!keepOpen) {
          onClose();
        }
        
        toast({ 
          description: 'Thought captured',
          duration: 1500 
        });
        
        onCapture?.();
      } else {
        // Save as task (existing logic)
        console.log('QuickCapture: Getting user...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('QuickCapture: No user found');
          toast({
            title: "Error",
            description: "You must be logged in to capture tasks.",
            variant: "destructive"
          });
          return;
        }
        
        console.log('QuickCapture: Invoking process-input function...');
        // Process text input using the processInput API
        const { data, error } = await supabase.functions.invoke('process-input', {
          body: { text: input.trim(), user_id: user.id }
        });

        console.log('QuickCapture: process-input response:', { data, error });

        if (error) {
          console.error('QuickCapture: process-input error:', error);
          toast({
            title: "Error",
            description: "Failed to process your input. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        // Invalidate tasks query to refresh the list
        console.log('QuickCapture: Invalidating tasks query...');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        
        setInput('');
        
        if (!keepOpen) {
          onClose();
        }
        
        toast({ 
          description: 'Task captured',
          duration: 1500 
        });

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
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={captureType === 'thought' ? "What's on your mind..." : "Capture a task..."}
            className="w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20"
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
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              captureType === 'thought' 
                ? "What's on your mind... (Enter to save, Esc to close, Shift+Enter to save & continue)"
                : "Capture a task... (Enter to save, Esc to close, Shift+Enter to save & continue)"
            }
            className="w-full bg-transparent font-mono text-base text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      </div>
    </>
  );
};
