import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Task {
  id: string;
  title: string;
  time?: string;
  context: string;
  completed: boolean;
}

interface TaskEditDialogProps {
  open: boolean;
  task: Task | null;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onClose: () => void;
}

export const TaskEditDialog = ({ open, task, onSave, onClose }: TaskEditDialogProps) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [context, setContext] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTime(task.time || "");
      setContext(task.context);
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    
    onSave(task.id, {
      title: title.trim() || task.title,
      time: time.trim() || task.time,
      context: context.trim() || task.context,
    });
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the details of your task
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g., 10:00 AM"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="context">Context</Label>
            <Input
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., Work, Personal"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
