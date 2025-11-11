import { useState } from "react";
import { X, Trash2, Calendar, Tag as TagIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Task } from "@/hooks/useTasks";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskDetailsModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

export const TaskDetailsModal = ({ task, open, onClose, onUpdate, onDelete }: TaskDetailsModalProps) => {
  const [title, setTitle] = useState(task?.title || "");
  const [context, setContext] = useState(task?.context || "");

  if (!task) return null;

  const handleSave = () => {
    onUpdate({
      title,
      context: context || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="h-full max-h-screen w-full max-w-full m-0 rounded-none bg-background p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-light">Edit Task</h2>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => onUpdate({ completed: !!checked })}
                className="mt-1"
              />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="border-0 text-lg font-light bg-transparent focus-visible:ring-0 px-0"
              />
            </div>

            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add notes..."
              className="min-h-32 border-0 bg-muted/30 rounded-2xl resize-none"
            />

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 rounded-2xl" disabled>
                <Calendar className="w-5 h-5" />
                <span>Add reminder</span>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 rounded-2xl" disabled>
                <TagIcon className="w-5 h-5" />
                <span>Change category</span>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <Button onClick={handleSave} className="w-full rounded-full bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
