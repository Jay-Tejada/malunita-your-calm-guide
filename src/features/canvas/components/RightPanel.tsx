import { useState } from 'react';
import { X, Tag, Calendar, ListTodo, Sparkles, Link2, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectPage } from '../types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface RightPanelProps {
  page?: ProjectPage;
  isOpen: boolean;
  onClose: () => void;
  onConvertToTask?: () => void;
  onAIAction?: (action: string) => void;
}

export const RightPanel = ({
  page,
  isOpen,
  onClose,
  onConvertToTask,
  onAIAction,
}: RightPanelProps) => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showAIActions, setShowAIActions] = useState(true);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  if (!isOpen) return null;

  return (
    <div className="w-72 h-full border-l border-border/50 bg-background/50 backdrop-blur-sm flex flex-col animate-[slide-in-right_0.2s_ease-out]">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Page Info
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Page metadata */}
        {page && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Created {format(new Date(page.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-lg">{page.icon}</span>
              <span className="capitalize">{page.page_type.replace('_', ' ')}</span>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tags</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
              }}
            />
          </div>
        </div>

        {/* Convert to task */}
        <div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={onConvertToTask}
          >
            <ListTodo className="w-4 h-4" />
            Convert to Task
          </Button>
        </div>

        {/* AI Actions */}
        <div className="space-y-2">
          <button
            onClick={() => setShowAIActions(!showAIActions)}
            className="flex items-center gap-2 w-full"
          >
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium">AI Actions</span>
            {showAIActions ? (
              <ChevronUp className="w-4 h-4 ml-auto text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
            )}
          </button>

          {showAIActions && (
            <div className="space-y-1.5 pl-6">
              {[
                { id: 'expand', label: 'Expand content' },
                { id: 'explain', label: 'Explain this' },
                { id: 'rewrite', label: 'Rewrite' },
                { id: 'summarize', label: 'Summarize' },
                { id: 'make-task-list', label: 'Make task list' },
              ].map((action) => (
                <button
                  key={action.id}
                  onClick={() => onAIAction?.(action.id)}
                  className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  /{action.id.replace('-', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Related content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Related</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            No related content found
          </p>
        </div>
      </div>
    </div>
  );
};
