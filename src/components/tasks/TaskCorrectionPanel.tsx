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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/hooks/useTasks";
import { AlertTriangle } from "lucide-react";

interface AIOutput {
  category?: string;
  priority?: 'MUST' | 'SHOULD' | 'COULD';
  project?: string;
  deadline?: string;
  subtasks?: string[];
  scheduled_bucket?: string;
}

interface TaskCorrectionPanelProps {
  task: Task;
  initialAIOutput: AIOutput;
  onSubmitCorrection: (correctedData: any) => void;
  open?: boolean;
  onClose?: () => void;
}

export const TaskCorrectionPanel = ({ 
  task, 
  initialAIOutput, 
  onSubmitCorrection,
  open = true,
  onClose 
}: TaskCorrectionPanelProps) => {
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<'MUST' | 'SHOULD' | 'COULD'>("SHOULD");
  const [project, setProject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [subtasks, setSubtasks] = useState("");
  const [isNotTask, setIsNotTask] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (task && initialAIOutput) {
      setCategory(initialAIOutput.category || task.category || "inbox");
      setPriority(initialAIOutput.priority || task.priority || "SHOULD");
      setProject(initialAIOutput.project || "");
      setDeadline(initialAIOutput.deadline || "");
      setSubtasks(initialAIOutput.subtasks?.join("\n") || "");
      setIsNotTask(false);
      setNotes("");
    }
  }, [task, initialAIOutput]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const correctedData = {
        category,
        priority,
        project,
        deadline,
        subtasks: subtasks.split("\n").filter(s => s.trim()),
        isNotTask,
        notes,
      };

      // Store feedback in database
      const { error: insertError } = await supabase
        .from("task_learning_feedback")
        .insert({
          user_id: user.id,
          original_text: task.context || task.title,
          task_title: task.title,
          suggested_category: initialAIOutput.category || task.category || "",
          actual_category: isNotTask ? "NOT_A_TASK" : category,
          suggested_timeframe: initialAIOutput.scheduled_bucket || "",
          actual_timeframe: deadline || "",
          was_corrected: true,
        });

      if (insertError) throw insertError;

      // Invoke thought-engine-trainer (non-blocking)
      supabase.functions.invoke('thought-engine-trainer', {
        body: { 
          userId: user.id,
          correction: {
            taskId: task.id,
            aiOutput: initialAIOutput,
            userCorrection: correctedData,
          }
        }
      }).catch(err => {
        console.error('Trainer invocation failed:', err);
      });

      toast({
        title: "Correction saved",
        description: "I'll learn from this to improve future suggestions.",
        duration: 3000,
      });

      onSubmitCorrection(correctedData);
      onClose?.();
    } catch (error) {
      console.error('Failed to submit correction:', error);
      toast({
        title: "Failed to save correction",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Correct AI Mistake
          </DialogTitle>
          <DialogDescription>
            Help Malunita learn by correcting what went wrong
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Task Info */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <Label className="text-sm text-muted-foreground">Task</Label>
            <div className="text-sm font-medium">{task.title}</div>
          </div>

          {/* Not a Task Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="not-task" className="text-base font-medium">
                This is not a task
              </Label>
              <p className="text-sm text-muted-foreground">
                Mark if this was incorrectly identified as a task
              </p>
            </div>
            <Switch
              id="not-task"
              checked={isNotTask}
              onCheckedChange={setIsNotTask}
            />
          </div>

          {!isNotTask && (
            <>
              {/* Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Category</Label>
                  <span className="text-xs text-muted-foreground">
                    AI said: {initialAIOutput.category || "none"}
                  </span>
                </div>
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
                    <SelectItem value="errands">Errands</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority">Priority</Label>
                  <span className="text-xs text-muted-foreground">
                    AI said: {initialAIOutput.priority || "none"}
                  </span>
                </div>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MUST">Must do today</SelectItem>
                    <SelectItem value="SHOULD">Should do soon</SelectItem>
                    <SelectItem value="COULD">Could do later</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="project">Project</Label>
                  <span className="text-xs text-muted-foreground">
                    AI said: {initialAIOutput.project || "none"}
                  </span>
                </div>
                <Input
                  id="project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="deadline">Deadline / When</Label>
                  <span className="text-xs text-muted-foreground">
                    AI said: {initialAIOutput.deadline || initialAIOutput.scheduled_bucket || "none"}
                  </span>
                </div>
                <Input
                  id="deadline"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="e.g., tomorrow, next week, Dec 25"
                />
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subtasks">Subtask Breakdown</Label>
                  <span className="text-xs text-muted-foreground">
                    {initialAIOutput.subtasks?.length || 0} AI suggestions
                  </span>
                </div>
                <Textarea
                  id="subtasks"
                  value={subtasks}
                  onChange={(e) => setSubtasks(e.target.value)}
                  placeholder="One subtask per line"
                  className="h-24 resize-none font-mono text-sm"
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Additional Notes <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why was this wrong? What should I learn?"
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Mark AI Mistake"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
