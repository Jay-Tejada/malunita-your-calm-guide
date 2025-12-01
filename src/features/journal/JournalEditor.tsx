import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JournalEditorProps {
  entry?: {
    id: string;
    title: string;
    content: string;
    created_at: string;
  };
  onSave: (data: { title: string; content: string }) => void;
  onClose: () => void;
}

export const JournalEditor = ({ entry, onSave, onClose }: JournalEditorProps) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const { toast } = useToast();

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please add both a title and content.",
        variant: "destructive",
      });
      return;
    }

    onSave({ title, content });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto px-6 py-8 min-h-screen">
        {/* Minimal header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={onClose}
            className="text-muted-foreground/40 hover:text-foreground/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="text-foreground/40 hover:text-foreground/60"
          >
            Save
          </Button>
        </div>

        {/* Date stamp */}
        <div className="text-xs text-muted-foreground/40 mb-6 font-mono">
          {entry 
            ? new Date(entry.created_at).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
          }
        </div>

        {/* Clean editor */}
        <div className="space-y-6">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"
            autoFocus={!entry}
          />
          
          <Textarea
            placeholder="Write..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60vh] text-base resize-none border-0 focus-visible:ring-0 px-0 placeholder:text-muted-foreground/30"
          />
        </div>
      </div>
    </motion.div>
  );
};
