import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Command } from 'lucide-react';
import { useProcessInputMutation } from '@/hooks/useProcessInputMutation';
import { useTasks } from '@/hooks/useTasks';
import { toast } from '@/hooks/use-toast';

interface QuickCaptureProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickCapture({ isOpen, onOpenChange }: QuickCaptureProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const processInputMutation = useProcessInputMutation();
  const { createTasks } = useTasks();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac or Ctrl+K on Windows
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Debounced AI suggestions
  useEffect(() => {
    if (!input.trim() || input.length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      generateSuggestions(input);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input]);

  const generateSuggestions = async (text: string) => {
    // Simple suggestion logic based on keywords
    const suggestions: string[] = [];
    
    if (text.toLowerCase().includes('call') || text.toLowerCase().includes('phone')) {
      suggestions.push(`Schedule: ${text}`);
      suggestions.push(`Add reminder for: ${text}`);
    } else if (text.toLowerCase().includes('buy') || text.toLowerCase().includes('get')) {
      suggestions.push(`🛒 Shopping: ${text}`);
      suggestions.push(`Add to errands list`);
    } else if (text.toLowerCase().includes('meet') || text.toLowerCase().includes('lunch')) {
      suggestions.push(`📅 Calendar event: ${text}`);
      suggestions.push(`Send meeting invite`);
    } else {
      suggestions.push(`✅ Task: ${text}`);
      suggestions.push(`📝 Note: ${text}`);
    }

    setSuggestions(suggestions.slice(0, 3));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim()) return;

    setIsProcessing(true);

    try {
      const result = await processInputMutation.mutateAsync({
        text: input,
      });

      if (result?.tasks && result.tasks.length > 0) {
        const tasksToCreate = result.tasks.map(task => ({
          title: task.title,
          category: task.category || 'inbox',
          input_method: 'text' as const,
        }));

        await createTasks(tasksToCreate);
        toast({
          title: '✅ Captured',
          description: `Added: ${result.tasks[0].title}`,
        });
      }

      // Reset and close
      setInput('');
      setSuggestions([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to process input:', error);
      toast({
        title: 'Error',
        description: 'Failed to capture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInput(suggestion);
    // Auto-submit after selecting suggestion
    await handleSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 gap-0 max-w-2xl border-0 bg-transparent shadow-none"
        onPointerDownOutside={() => onOpenChange(false)}
      >
        <div className="bg-card rounded-card border border-border shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
            <Command className="w-4 h-4 text-foreground-soft" />
            <span className="text-sm text-foreground-soft">Quick Capture</span>
            <div className="ml-auto flex items-center gap-2">
              <kbd className="px-2 py-0.5 text-xs font-mono bg-background border border-border rounded">
                ↵
              </kbd>
              <span className="text-xs text-foreground-soft">to submit</span>
            </div>
          </div>

          {/* Input */}
          <div className="p-4">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              className="text-lg border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              disabled={isProcessing}
            />
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-t border-border bg-muted/10">
              <div className="px-4 py-2">
                <div className="text-xs text-foreground-soft mb-2">Suggestions</div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 rounded-sm text-sm text-foreground hover:bg-muted transition-colors"
                      disabled={isProcessing}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="px-4 py-3 border-t border-border bg-muted/10">
              <div className="flex items-center gap-2 text-sm text-foreground-soft">
                <div className="animate-pulse">Processing...</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to use QuickCapture globally
export function useQuickCapture() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
