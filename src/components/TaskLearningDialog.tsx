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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/hooks/useTasks";

interface TaskLearningDialogProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
}

export const TaskLearningDialog = ({ open, task, onClose }: TaskLearningDialogProps) => {
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setCategory(task.category || "inbox");
      setNote("");
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!task) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert feedback record
      const { error: insertError } = await supabase
        .from("task_learning_feedback")
        .insert({
          user_id: user.id,
          original_text: task.context || task.title,
          task_title: task.title,
          suggested_category: task.category || "inbox",
          actual_category: category,
          suggested_timeframe: task.is_time_based ? "time_based" : "flexible",
          actual_timeframe: task.is_time_based ? "time_based" : "flexible",
          was_corrected: category !== task.category,
        });

      if (insertError) throw insertError;

      // Call thought-engine-trainer (non-blocking)
      supabase.functions.invoke('thought-engine-trainer', {
        body: { userId: user.id }
      }).catch(err => {
        console.error('Trainer invocation failed:', err);
      });

      toast({
        title: "Got it. I'll try to categorize more like this in the future.",
        duration: 3000,
      });

      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: "Failed to save feedback",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Help Malunita learn</DialogTitle>
          <DialogDescription>
            Confirm the correct category for this task
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Task</Label>
            <div className="text-sm font-medium">{task.title}</div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Correct Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbox">Inbox</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="gym">Gym</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note">
              Note <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., This is a personal admin task"
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
