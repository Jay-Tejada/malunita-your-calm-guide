import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuickCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (text: string) => void;
}

export function QuickCapture({ open, onOpenChange, onCapture }: QuickCaptureProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac or Ctrl+K on Windows
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Generate simple suggestions based on input
  useEffect(() => {
    if (!input.trim() || input.length < 3) {
      setSuggestions([]);
      return;
    }

    const lower = input.toLowerCase();
    const newSuggestions: string[] = [];
    
    if (lower.includes('call') || lower.includes('phone')) {
      newSuggestions.push(`Schedule call: ${input}`);
      newSuggestions.push(`Add reminder for call`);
    } else if (lower.includes('buy') || lower.includes('get')) {
      newSuggestions.push(`🛒 Shopping: ${input}`);
      newSuggestions.push(`Add to errands list`);
    } else if (lower.includes('meet') || lower.includes('lunch')) {
      newSuggestions.push(`📅 Meeting: ${input}`);
      newSuggestions.push(`Send meeting invite`);
    } else if (lower.includes('write') || lower.includes('draft')) {
      newSuggestions.push(`✍️ Writing task: ${input}`);
      newSuggestions.push(`Schedule writing time`);
    } else {
      newSuggestions.push(`✅ Task: ${input}`);
      newSuggestions.push(`📝 Note: ${input}`);
    }

    setSuggestions(newSuggestions.slice(0, 4));
  }, [input]);

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;

    onCapture(text);
    setInput('');
    setSuggestions([]);
    onOpenChange(false);

    toast({
      title: '✅ Captured',
      description: 'Processing your input...',
    });
  };

  const handleSelect = (value: string) => {
    // Extract the actual text from suggestions that have prefixes
    const text = value.includes(': ') ? value.split(': ')[1] : value;
    handleSubmit(text);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Quick Capture"
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
      
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%]">
        <Command className="rounded-card border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
            <Sparkles className="w-4 h-4 text-foreground-soft" />
            <span className="text-sm text-foreground-soft">Quick Capture</span>
            <div className="ml-auto flex items-center gap-2">
              <kbd className="px-2 py-0.5 text-xs font-mono bg-background border border-border rounded">
                ⌘K
              </kbd>
              <span className="text-xs text-foreground-soft">to open</span>
            </div>
          </div>

          {/* Input */}
          <Command.Input
            value={input}
            onValueChange={setInput}
            placeholder="What's on your mind?"
            className="w-full px-4 py-4 text-lg bg-transparent border-0 outline-none placeholder:text-foreground-soft"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && suggestions.length === 0) {
                e.preventDefault();
                handleSubmit(input);
              }
            }}
          />

          {/* Suggestions */}
          {(suggestions.length > 0 || input.trim()) && (
            <Command.List className="max-h-[300px] overflow-y-auto border-t border-border">
              {suggestions.length > 0 && (
                <Command.Group heading="Suggestions" className="px-2 py-2">
                  {suggestions.map((suggestion, index) => (
                    <Command.Item
                      key={index}
                      value={suggestion}
                      onSelect={handleSelect}
                      className="px-3 py-2 rounded-sm text-sm text-foreground hover:bg-muted cursor-pointer transition-colors aria-selected:bg-muted"
                    >
                      {suggestion}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {input.trim() && (
                <Command.Group heading="Create" className="px-2 py-2 border-t border-border">
                  <Command.Item
                    value={input}
                    onSelect={() => handleSubmit(input)}
                    className="px-3 py-2 rounded-sm text-sm text-foreground hover:bg-muted cursor-pointer transition-colors aria-selected:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span>Create:</span>
                      <span className="font-medium">{input}</span>
                    </div>
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
          )}

          {/* Footer hints */}
          <div className="px-4 py-2 border-t border-border bg-muted/10 flex items-center gap-4 text-xs text-foreground-soft">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-background border border-border rounded">↵</kbd>
              <span>submit</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-background border border-border rounded">↑↓</kbd>
              <span>navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-background border border-border rounded">esc</kbd>
              <span>close</span>
            </div>
          </div>
        </Command>
      </div>
    </Command.Dialog>
  );
}

// Hook to use QuickCapture globally
export function useQuickCapture() {
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen,
    toggle: () => setOpen(prev => !prev),
  };
}
