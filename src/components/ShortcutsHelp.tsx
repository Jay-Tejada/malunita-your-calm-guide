import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShortcutsHelpTrigger } from '@/hooks/useKeyboardShortcuts';

interface Shortcut {
  key: string;
  description: string;
  mac?: string; // Optional different key for Mac
}

const shortcuts: Shortcut[] = [
  { key: 'Ctrl+K', mac: '⌘K', description: 'Quick capture - Add task from anywhere' },
  { key: 'Ctrl+/', mac: '⌘/', description: 'Focus main input field' },
  { key: 'Ctrl+D', mac: '⌘D', description: 'Open daily review' },
  { key: 'Ctrl+F', mac: '⌘F', description: 'Search tasks' },
  { key: 'Ctrl+J', mac: '⌘J', description: 'Open journal' },
  { key: 'Ctrl+T', mac: '⌘T', description: 'Navigate to Today view' },
  { key: 'Ctrl+?', mac: '⌘?', description: 'Show this help dialog' },
  { key: 'Esc', description: 'Close modals and dialogs' },
  { key: '↑↓', description: 'Navigate items in lists' },
  { key: 'Enter', description: 'Submit or confirm action' },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  useShortcutsHelpTrigger(() => setOpen(true));

  return (
    <>
      {/* Trigger button - can be placed anywhere in the app */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Keyboard className="w-4 h-4" />
        <span>Shortcuts</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 py-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-sm hover:bg-muted transition-colors"
              >
                <span className="text-sm text-foreground">
                  {shortcut.description}
                </span>
                <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
                  {isMac && shortcut.mac ? shortcut.mac : shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 flex items-start gap-3 text-sm text-foreground-soft">
            <div className="mt-0.5">💡</div>
            <p>
              Press{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
                {isMac ? '⌘' : 'Ctrl'}
              </kbd>
              {' '}+{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
                ?
              </kbd>
              {' '}anytime to view this help
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Standalone trigger button without the dialog (for settings pages, etc.)
export function ShortcutsHelpButton() {
  const [open, setOpen] = useState(false);

  return <ShortcutsHelp />;
}
