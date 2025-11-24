import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useTasks } from "@/hooks/useTasks";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { checkAndHandlePrediction } from "@/utils/predictionChecker";
import { Sparkles } from "lucide-react";

export function DailyPriorityPrompt() {
  const { showPrompt, checkIfShouldShowPrompt, markPromptAnswered } = useDailyPriorityPrompt();
  const { createTasks } = useTasks();
  const { onTaskCompleted } = useCompanionEvents();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if prompt should show on mount
  useEffect(() => {
    checkIfShouldShowPrompt();
  }, [checkIfShouldShowPrompt]);

  // Always ask about today (morning focus)
  const targetDay = 'today';
  
  // Get today's date as focus date
  const getFocusDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handlePromptClick = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!taskInput.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const createdTasks = await createTasks([{
        title: taskInput,
        category: 'primary_focus',
        is_focus: true,
        focus_date: getFocusDate(),
        input_method: 'text',
        completed: false,
        has_reminder: false,
        has_person_name: false,
        is_time_based: false,
        context: 'Daily primary focus task', // Mark it clearly
      }]);
      
      // Store the priority task ID
      if (createdTasks && createdTasks.length > 0) {
        const selectedTask = createdTasks[0];
        markPromptAnswered(selectedTask.id);
        
        // Check if this matches our prediction
        checkAndHandlePrediction(selectedTask.id, selectedTask.title);
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
          className="fixed top-20 sm:top-16 md:top-12 left-0 right-0 flex justify-center z-10 px-4"
        >
          <button
            onClick={handlePromptClick}
            className="text-xs sm:text-sm text-foreground/80 hover:text-foreground transition-colors font-medium max-w-3xl text-center"
          >
            What is the ONE thing you could accomplish today that would get your head above water? Everything else is a bonus.
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
              placeholder="Enter your top priority for today..."
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
