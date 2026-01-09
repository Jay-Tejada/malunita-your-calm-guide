import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { startVoiceInput, stopVoiceInput, isVoiceInputSupported } from '@/utils/voiceInput';

interface QuickAddInputProps {
  placeholder?: string;
  category?: string;
  scheduled_bucket?: string;
  project_id?: string;
  autoFocus?: boolean;
}

export interface QuickAddInputRef {
  focus: () => void;
}

export const QuickAddInput = forwardRef<QuickAddInputRef, QuickAddInputProps>(({
  placeholder = "Add task...",
  category = 'inbox',
  scheduled_bucket,
  project_id,
  autoFocus = false,
}, ref) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceSupported = isVoiceInputSupported();

  // Expose focus method to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  // Focus input on mount if autoFocus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Instant save - no AI blocking, direct insert
  const saveTask = async (text: string) => {
    if (!text.trim() || isSaving) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsSaving(true);
    setInput('');

    try {
      // Insert task directly for instant feedback
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: text.trim(),
          raw_content: text.trim(),
          category,
          scheduled_bucket: scheduled_bucket || null,
          project_id: project_id || null,
          processing_status: 'pending', // Mark for background AI processing
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save task:', error);
        setInput(text); // Restore input on error
        return;
      }

      // Fire-and-forget: trigger AI enrichment in background
      supabase.functions.invoke('process-input', {
        body: {
          task_id: task.id,
          text: text.trim(),
          user_id: user.id,
          enrich_only: true, // Just enrich, don't create new task
        },
      }).catch(err => {
        console.error('Background AI enrichment failed:', err);
      });

    } catch (err) {
      console.error('Save error:', err);
      setInput(text);
    } finally {
      setIsSaving(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      saveTask(input);
    }
  };

  const toggleVoice = async () => {
    if (isListening) {
      await stopVoiceInput();
      setIsListening(false);
    } else {
      try {
        await startVoiceInput({
          onTranscript: (text) => {
            // Append to existing input or set directly
            setInput(prev => prev ? `${prev} ${text}` : text);
            setIsListening(false);
          },
          onListeningChange: setIsListening,
          silenceTimeout: 5000, // 5 second timeout for quick capture
        });
      } catch (err) {
        console.error('Voice input failed:', err);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? "Listening..." : placeholder}
        disabled={isSaving}
        data-quick-add="true"
        className={`
          w-full py-3 pr-10 
          bg-transparent 
          border-b border-foreground/10 
          font-mono text-sm 
          text-foreground/80 
          placeholder:text-muted-foreground/40 
          focus:outline-none focus:border-foreground/20 
          transition-colors
          ${isListening ? 'text-primary' : ''}
          ${isSaving ? 'opacity-50' : ''}
        `}
      />
      
      {/* Mic icon */}
      {voiceSupported && (
        <button
          onClick={toggleVoice}
          disabled={isSaving}
          className={`
            absolute right-0 top-1/2 -translate-y-1/2 
            p-1.5 rounded-full
            transition-all
            ${isListening 
              ? 'text-primary bg-primary/10 animate-pulse' 
              : 'text-foreground/20 hover:text-foreground/40'
            }
          `}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
});

QuickAddInput.displayName = 'QuickAddInput';
