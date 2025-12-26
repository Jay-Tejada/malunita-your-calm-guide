import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCapture } from '@/hooks/useAICapture';
import { useSmartHints, useModifierKey } from '@/hooks/useSmartHints';
import { useSmartDateParsing } from '@/hooks/useSmartDateParsing';
import { useHaptics } from '@/hooks/useHaptics';

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'mobile' | 'desktop';
  onCapture?: () => void;
}

export const QuickCapture = ({ isOpen, onClose, variant, onCapture }: QuickCaptureProps) => {
  const [input, setInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const focusAchievedRef = useRef(false);
  const { toast } = useToast();
  const { capture, isCapturing } = useCapture();
  const { currentHint, trackUsage } = useSmartHints();
  const modKey = useModifierKey();
  const haptics = useHaptics();
  
  // Parse natural language dates from input
  const parsedDate = useSmartDateParsing(input);
  
  // Animated close handler
  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setInput('');
      onClose();
    }, 200);
  };
  
  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 5;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setInput('');
      focusAchievedRef.current = false;
    }
  }, [isOpen]);

  // Autofocus with delay
  useEffect(() => {
    if (!isOpen) {
      focusAchievedRef.current = false;
      return;
    }

    const focusTimer = setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea && !focusAchievedRef.current) {
        textarea.focus();
        focusAchievedRef.current = document.activeElement === textarea;
      }
    }, 100);

    const backupTimer = setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea && !focusAchievedRef.current) {
        textarea.focus();
        focusAchievedRef.current = document.activeElement === textarea;
      }
    }, 200);

    return () => {
      clearTimeout(focusTimer);
      clearTimeout(backupTimer);
    };
  }, [isOpen]);
  
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);
  
  const handleSubmit = async (keepOpen = false) => {
    if (!input.trim()) return;
    
    const capturedText = input.trim();
    
    haptics.mediumTap();
    setInput('');
    
    if (!keepOpen) {
      onClose();
    }
    
    try {
      // Route through AI pipeline - process-input will handle:
      // - Semantic compression (ai_summary)
      // - Context indexing (memory_tags)
      // - Task extraction & classification
      // - Database persistence with all AI fields
      
      await capture({
        text: capturedText,
        category: 'inbox',
      });
      
      // Show date notification if detected (for user feedback)
      if (parsedDate.detectedDate) {
        const timeStr = parsedDate.hasTime 
          ? parsedDate.detectedDate.toLocaleString([], { 
              dateStyle: 'short', 
              timeStyle: 'short' 
            })
          : parsedDate.detectedDate.toLocaleDateString();
        
        toast({
          description: `Captured with date: ${timeStr}`,
          duration: 2000,
        });
      }
      
      onCapture?.();
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(false);
      trackUsage('quick-capture');
    } else if (e.key === 'Enter' && e.shiftKey && variant === 'desktop') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(true);
      trackUsage('shift-enter');
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen && !isClosing) return null;

  // Mobile variant
  if (variant === 'mobile') {
    return (
      <div className={`fixed inset-x-0 bottom-48 flex justify-center px-6 z-50 ${isClosing ? 'animate-[slide-down_0.2s_ease-out_forwards]' : 'animate-[slide-up_0.25s_ease-out]'}`}>
        <div className="w-full max-w-sm bg-background/90 backdrop-blur-sm rounded-lg border border-foreground/10 p-3">
          <textarea
            ref={textareaRef}
            data-task-input
            autoFocus
            tabIndex={0}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture to inbox...|"
            rows={1}
            className="w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 placeholder:animate-[placeholder-pulse_1.2s_ease-in-out_infinite] focus:outline-none focus:border-primary/50 focus:shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)] transition-all duration-300 resize-none overflow-hidden"
            style={{ minHeight: '24px' }}
          />
          
          {/* Detected date indicator */}
          {parsedDate.detectedDate && (
            <div className="mt-2 flex items-center gap-2 text-xs font-mono text-primary/70 animate-fade-in">
              <span className="px-2 py-0.5 bg-primary/10 rounded">
                ⏰ {parsedDate.hasTime 
                  ? parsedDate.detectedDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                  : parsedDate.detectedDate.toLocaleDateString()
                }
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 ${isClosing ? 'animate-[fade-out_0.2s_ease-out_forwards]' : 'animate-[fade-in_0.2s_ease-out]'}`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`fixed top-[20vh] left-1/2 w-full max-w-xl px-4 z-50 origin-top ${isClosing ? 'animate-[modal-exit_0.2s_ease-out_forwards]' : 'animate-[modal-enter_0.25s_ease-out_forwards]'}`}>
        <div className="bg-background border border-foreground/10 rounded-xl shadow-lg p-4">
          <textarea
            ref={textareaRef}
            data-task-input
            autoFocus
            tabIndex={0}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture to inbox...|"
            rows={1}
            className="w-full bg-transparent font-mono text-base text-foreground/80 placeholder:text-muted-foreground/50 placeholder:animate-[placeholder-pulse_1.2s_ease-in-out_infinite] focus:outline-none border-b-2 border-transparent focus:border-primary/40 focus:shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.25)] transition-all duration-300 resize-none overflow-hidden"
            style={{ minHeight: '24px' }}
          />
          
          {/* Detected date indicator */}
          {parsedDate.detectedDate && (
            <div className="mt-2 flex items-center gap-2 text-xs font-mono text-primary/70 animate-fade-in">
              <span className="px-2 py-0.5 bg-primary/10 rounded">
                ⏰ {parsedDate.hasTime 
                  ? parsedDate.detectedDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                  : parsedDate.detectedDate.toLocaleDateString()
                }
              </span>
              <span className="text-muted-foreground/50">"{parsedDate.detectedText}"</span>
            </div>
          )}
          
          {/* Rotating hint */}
          {currentHint && !parsedDate.detectedDate && (
            <p className="mt-2 text-[10px] text-muted-foreground/40 font-mono animate-fade-in">
              {currentHint.replace('⌘', modKey)}
            </p>
          )}
        </div>
      </div>
    </>
  );
};
