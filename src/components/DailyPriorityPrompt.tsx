import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useTasks } from "@/hooks/useTasks";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { Sparkles } from "lucide-react";

export function DailyPriorityPrompt() {
  const { showPrompt, markPromptAnswered } = useDailyPriorityPrompt();
  const { createTasks } = useTasks();
  const { onTaskCompleted } = useCompanionEvents();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePromptClick = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!taskInput.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const createdTasks = await createTasks([{
        title: taskInput,
        category: 'focus',
        is_focus: true,
        focus_date: new Date().toISOString().split('T')[0],
        input_method: 'text',
        completed: false,
        has_reminder: false,
        has_person_name: false,
        is_time_based: false,
      }]);
      
      // Store the priority task ID for check-ins
      if (createdTasks && createdTasks.length > 0) {
        markPromptAnswered(createdTasks[0].id);
      }
      
      setIsDialogOpen(false);
      setTaskInput("");
      
      // Trigger excited companion expression
      onTaskCompleted(1);
    } catch (error) {
      console.error("Error creating priority task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!showPrompt) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-12 left-1/2 -translate-x-1/2 z-10"
        >
          <button
            onClick={handlePromptClick}
            className="group px-8 py-4 bg-gradient-to-br from-background/95 to-muted/30 backdrop-blur-sm rounded-2xl border border-border/40 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
              <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                What's the one thing you must get done today?
              </p>
            </div>
          </button>
        </motion.div>
      </AnimatePresence>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Today's Priority
            </DialogTitle>
            <DialogDescription>
              What's the one thing that would make today a success?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Enter your top priority..."
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              className="text-base"
            />
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!taskInput.trim() || isSubmitting}
              >
                {isSubmitting ? "Setting..." : "Set Priority"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
