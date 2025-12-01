import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'mobile' | 'desktop';
  onCapture?: () => void;
}

export const QuickCapture = ({ isOpen, onClose, variant, onCapture }: QuickCaptureProps) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSubmit = async (keepOpen = false) => {
    if (!input.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Process text input using the processInput API
      const { error } = await supabase.functions.invoke('process-input', {
        body: { text: input.trim(), userId: user.id }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to process your input. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      setInput('');
      
      if (!keepOpen) {
        onClose();
      }
      
      toast({ 
        description: 'Captured',
        duration: 1500 
      });

      onCapture?.();
    } catch (error) {
      console.error('Error capturing:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(false);
    } else if (e.key === 'Enter' && e.shiftKey && variant === 'desktop') {
      e.preventDefault();
      handleSubmit(true);
    } else if (e.key === 'Escape') {
      onClose();
      setInput('');
    }
  };

  if (!isOpen) return null;

  // Mobile: appears above orb area
  if (variant === 'mobile') {
    return (
      <div className="fixed inset-x-0 bottom-48 flex justify-center px-6 z-50 animate-fade-in">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture a thought..."
          className="w-full max-w-sm bg-background/90 backdrop-blur-sm border-b border-foreground/20 py-3 px-4 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 rounded-t-lg"
        />
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
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought... (Enter to save, Esc to close, Shift+Enter to save & continue)"
            className="w-full bg-transparent font-mono text-base text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      </div>
    </>
  );
};
