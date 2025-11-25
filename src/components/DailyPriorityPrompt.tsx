import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { checkAndHandlePrediction } from "@/utils/predictionChecker";
import { useAutoSplitTask } from "@/hooks/useAutoSplitTask";
import { useRelatedTaskSuggestions } from "@/hooks/useRelatedTaskSuggestions";
import { RelatedTaskSuggestions } from "@/components/RelatedTaskSuggestions";
import { Sparkles } from "lucide-react";

export interface DailyPriorityPromptRef {
  openDialog: () => void;
}

export const DailyPriorityPrompt = forwardRef<DailyPriorityPromptRef>((props, ref) => {
  const { showPrompt, checkIfShouldShowPrompt, markPromptAnswered } = useDailyPriorityPrompt();
  const { createTasks } = useTasks();
  const { onTaskCompleted } = useCompanionEvents();
  const { generateAndCreateSubtasks } = useAutoSplitTask();
  const {
    suggestions,
    isProcessing: isSuggestionsProcessing,
    checkForRelatedTasks,
    acceptSuggestion,
    declineSuggestion,
  } = useRelatedTaskSuggestions();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expose method to open dialog programmatically
  useImperativeHandle(ref, () => ({
    openDialog: () => setIsDialogOpen(true),
  }));

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
        const selectedTask = createdTasks[0] as Task;
        markPromptAnswered(selectedTask.id);
        
        // Check if this matches our prediction
        checkAndHandlePrediction(selectedTask.id, selectedTask.title);
        
        // Auto-split if complex
        generateAndCreateSubtasks(selectedTask);
        
        // Check for related tasks
        checkForRelatedTasks(selectedTask);
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

  // Auto-open dialog when prompt should show (once per day morning ritual)
  useEffect(() => {
    if (showPrompt) {
      setIsDialogOpen(true);
    }
  }, [showPrompt]);

  if (!showPrompt) return null;

  return (
    <>
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
            
            {/* Show related task suggestions after submission */}
            {suggestions.length > 0 && (
              <div className="pt-2">
                <RelatedTaskSuggestions
                  suggestions={suggestions}
                  isProcessing={isSuggestionsProcessing}
                  onAccept={acceptSuggestion}
                  onDecline={declineSuggestion}
                />
              </div>
            )}
            
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
});

DailyPriorityPrompt.displayName = "DailyPriorityPrompt";
