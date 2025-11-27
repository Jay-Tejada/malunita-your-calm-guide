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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">
            {entry ? 'Edit Entry' : 'New Entry'}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <Input
            placeholder="Entry title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0"
          />
          
          <Textarea
            placeholder="Write your thoughts here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[500px] text-base resize-none border-0 focus-visible:ring-0 px-0"
          />
        </div>
      </div>
    </motion.div>
  );
};
