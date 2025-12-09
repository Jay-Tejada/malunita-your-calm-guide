import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useThoughts } from '@/hooks/useThoughts';
import { useQueryClient } from '@tanstack/react-query';
import { useTasks } from '@/hooks/useTasks';
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
  const [captureType, setCaptureType] = useState<'task' | 'thought'>('task');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const focusAchievedRef = useRef(false);
  const { toast } = useToast();
  const { addThought } = useThoughts();
  const queryClient = useQueryClient();
  const { createTasks } = useTasks();
  const { currentHint, trackUsage } = useSmartHints();
  const modKey = useModifierKey();
  const haptics = useHaptics();
  
  // Parse natural language dates from input
  const parsedDate = useSmartDateParsing(input);
  
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
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setInput('');
      focusAchievedRef.current = false;
    }
  }, [isOpen]);

  // Autofocus with delay to let keyboard event complete
  useEffect(() => {
    if (!isOpen) {
      focusAchievedRef.current = false;
      return;
    }

    // Key insight: The 'Q' keydown event is still active when this runs.
    // We need to wait for the event loop to clear before focusing.
    // Using 100ms delay to ensure keyboard event is fully processed.
    const focusTimer = setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea && !focusAchievedRef.current) {
        textarea.focus();
        focusAchievedRef.current = document.activeElement === textarea;
      }
    }, 100);

    // Backup at 200ms in case first attempt fails
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
    
    // Haptic feedback for capture
    haptics.mediumTap();
    
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
        // Use parsed date info for scheduling
        const taskTitle = parsedDate.cleanTitle || capturedText;
        const taskData: any = { title: taskTitle };
        
        // If a date/time was detected, set reminder
        if (parsedDate.detectedDate) {
          taskData.reminder_time = parsedDate.detectedDate.toISOString();
          taskData.has_reminder = true;
          taskData.is_time_based = parsedDate.hasTime;
          
          // Show feedback about detected schedule
          const timeStr = parsedDate.hasTime 
            ? parsedDate.detectedDate.toLocaleString([], { 
                dateStyle: 'short', 
                timeStyle: 'short' 
              })
            : parsedDate.detectedDate.toLocaleDateString();
          
          toast({
            description: `Scheduled for ${timeStr}`,
            duration: 2000,
          });
        }
        
        // Save task with scheduling info
        createTasks([taskData]);
        
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
    if (e.key === 'Tab') {
      e.preventDefault();
      setCaptureType(prev => prev === 'task' ? 'thought' : 'task');
      trackUsage('tab-switch');
    } else if (e.key === 'Enter' && !e.shiftKey) {
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
            data-task-input
            autoFocus
            tabIndex={0}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={captureType === 'thought' ? "What's on your mind..." : "Capture a task..."}
            rows={1}
            className="w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)] transition-all duration-300 resize-none overflow-hidden"
            style={{ minHeight: '24px' }}
          />
          
          {/* Detected date indicator - mobile */}
          {captureType === 'task' && parsedDate.detectedDate && (
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
            data-task-input
            autoFocus
            tabIndex={0}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              captureType === 'thought' 
                ? "What's on your mind... (Enter to save, Esc to close)"
                : "Capture a task... (Enter to save, Esc to close)"
            }
            rows={1}
            className="w-full bg-transparent font-mono text-base text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none border-b-2 border-transparent focus:border-primary/40 focus:shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.25)] transition-all duration-300 resize-none overflow-hidden"
            style={{ minHeight: '24px' }}
          />
          
          {/* Detected date indicator */}
          {captureType === 'task' && parsedDate.detectedDate && (
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
