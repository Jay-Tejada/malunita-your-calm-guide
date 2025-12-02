import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewProjectModalProps {
  space: string;
  onClose: () => void;
  onSave: (project: { name: string; space: string; icon?: string; color?: string }) => void;
}

const EMOJI_OPTIONS = ['📁', '🎯', '💼', '🏠', '💪', '📝', '🚀', '⭐', '🔥', '💡', '📊', '🎨'];

export const NewProjectModal = ({ space, onClose, onSave }: NewProjectModalProps) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | undefined>();

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), space, icon });
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs text-foreground/50 mb-2 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name..."
              className="font-mono text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>

          <div>
            <label className="text-xs text-foreground/50 mb-2 block">Icon (optional)</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(icon === emoji ? undefined : emoji)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                    icon === emoji 
                      ? 'bg-foreground/10 ring-1 ring-foreground/20' 
                      : 'hover:bg-foreground/5'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="font-mono text-xs">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim()}
            className="font-mono text-xs"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
