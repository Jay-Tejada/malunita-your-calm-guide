import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDailyPriorityPrompt } from "@/state/useDailyPriorityPrompt";
import { useTasks, Task } from "@/hooks/useTasks";
import { useDailyIntelligence } from "@/hooks/useDailyIntelligence";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { runTaskPipeline } from "@/lib/intelligence/taskPipeline";
import { checkAndHandlePrediction } from "@/utils/predictionChecker";
import { useAutoSplitTask } from "@/hooks/useAutoSplitTask";
import { useRelatedTaskSuggestions } from "@/hooks/useRelatedTaskSuggestions";
import { RelatedTaskSuggestions } from "@/components/RelatedTaskSuggestions";
import { Sparkles } from "lucide-react";

export interface DailyPriorityPromptRef {
  openDialog: () => void;
}

interface DailyPriorityPromptProps {
  onTaskCreated?: () => void;
}

export const DailyPriorityPrompt = forwardRef<DailyPriorityPromptRef, DailyPriorityPromptProps>(({ onTaskCreated }, ref) => {
  const { showPrompt, checkIfShouldShowPrompt, markPromptAnswered, markPromptSkipped, lastAnsweredDate } = useDailyPriorityPrompt();
  const { createTasks } = useTasks();
  const { refetch } = useDailyIntelligence();
  const { onTaskCreated: onTaskCreatedEvent } = useCompanionEvents();
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

  // Expose method to open dialog programmatically - but only if not already answered today
  useImperativeHandle(ref, () => ({
    openDialog: () => {
      const today = new Date().toISOString().split('T')[0];
      // Only open if not already answered/skipped today
      if (lastAnsweredDate !== today) {
        setIsDialogOpen(true);
      }
    },
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
      // Enrich with pipeline
      const enriched = await runTaskPipeline(taskInput);

      const createdTasks = await createTasks([{
        title: taskInput,
        category: 'primary_focus',
        future_priority_score: enriched.priority?.score,
        context: enriched.context?.taskContext?.[0]?.contextSummary || 'Daily primary focus task',
        scheduled_bucket: enriched.routing?.taskRouting?.[0]?.bucket,
        is_tiny_task: enriched.isTiny,
        follow_up: enriched.followUp || null,
        ai_metadata: {
          category: 'primary_focus',
          priority: enriched.priority?.priority,
          scheduled_bucket: enriched.routing?.taskRouting?.[0]?.bucket,
          subtasks: enriched.subtasks,
        },
        is_focus: true,
        focus_date: getFocusDate(),
        input_method: 'text',
        completed: false,
        has_reminder: false,
        has_person_name: false,
        is_time_based: false,
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
      
      // Post-save actions
      window.dispatchEvent(new CustomEvent('task:created'));
      refetch();
      
      // Trigger companion reaction
      onTaskCreatedEvent({
        priority: enriched.priority?.score,
        isTiny: enriched.isTiny,
        bucket: 'today', // Daily priority prompt always targets today
      });
      
      // Notify parent that task was created
      if (onTaskCreated) {
        onTaskCreated();
      }
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
                onClick={() => {
                  markPromptSkipped();
                  setIsDialogOpen(false);
                }}
                disabled={isSubmitting}
              >
                Skip Today
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
