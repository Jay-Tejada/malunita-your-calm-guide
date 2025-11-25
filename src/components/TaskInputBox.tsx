import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { processRawInput } from "@/lib/taskProcessing";
import { getClarification } from "@/lib/clarificationEngine";
import { runTaskPipeline } from "@/lib/intelligence/taskPipeline";
import { useTasks } from "@/hooks/useTasks";
import { useDailyIntelligence } from "@/hooks/useDailyIntelligence";
import { useCompanionEvents } from "@/hooks/useCompanionEvents";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const TaskInputBox = () => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [clarificationMode, setClarificationMode] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const [clarificationOptions, setClarificationOptions] = useState<string[]>([]);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [clarificationData, setClarificationData] = useState<any>(null);
  const [multiTaskMode, setMultiTaskMode] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  
  const { createTasks } = useTasks();
  const { toast } = useToast();
  const { refetch } = useDailyIntelligence();
  const { onTaskCreated } = useCompanionEvents();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await processRawInput(input, clarificationData);
      
      // Check if we got results
      if (!result || result.tasks.length === 0) {
        toast({
          title: "No tasks found",
          description: "Couldn't extract any tasks from that input.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Multiple tasks - show confirmation dialog
      if (result.tasks.length > 1) {
        setExtractedTasks(result.tasks);
        setSelectedTasks(new Set(result.tasks.map((_, i) => i)));
        setMultiTaskMode(true);
        setIsProcessing(false);
        return;
      }

      // Single ambiguous task - trigger clarification
      if (result.ambiguous && result.reason) {
        const clarification = await getClarification({
          originalText: input,
          task: result.tasks[0],
          reason: result.reason,
        });
        
        setClarificationQuestion(clarification.question);
        setClarificationOptions(clarification.options || []);
        setClarificationData({ ...result.tasks[0], expectedField: clarification.expectedField });
        setClarificationMode(true);
        setIsProcessing(false);
        return;
      }

      // Single clear task - enrich with pipeline then save
      const enrichedTasks = await Promise.all(
        result.tasks.map(async (t) => {
          const enriched = await runTaskPipeline(t.title);
          return {
            title: t.title,
            category: t.category,
            custom_category_id: t.custom_category_id,
            priority: enriched.priority?.priority || t.priority,
            effort: enriched.priority?.effort || t.effort,
            future_priority_score: enriched.priority?.score,
            context: enriched.context?.taskContext?.[0]?.contextSummary || t.context,
            scheduled_bucket: enriched.routing?.taskRouting?.[0]?.bucket || t.scheduled_bucket,
            is_tiny: enriched.isTiny || t.is_tiny,
            is_tiny_task: enriched.isTiny || t.is_tiny,
            follow_up: enriched.followUp || null,
            reminder_time: t.reminder_time,
            goal_aligned: t.goal_aligned,
            alignment_reason: t.alignment_reason,
            idea_metadata: t.idea_metadata,
            input_method: 'text' as const,
            completed: false,
            has_reminder: !!t.reminder_time,
            has_person_name: false,
            is_time_based: false,
            is_focus: false,
          };
        })
      );

      await createTasks(enrichedTasks);

      // Post-save actions
      window.dispatchEvent(new CustomEvent('task:created'));
      refetch();
      
      // Trigger companion reaction
      const firstEnriched = enrichedTasks[0];
      onTaskCreated({
        priority: firstEnriched.future_priority_score,
        isTiny: firstEnriched.is_tiny,
        bucket: firstEnriched.scheduled_bucket,
      });

      setInput("");
      setClarificationData(null);
    } catch (error) {
      console.error("Task processing error:", error);
      toast({
        title: "Error processing task",
        description: "Failed to process your input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClarificationSubmit = async () => {
    if (!clarificationAnswer.trim()) return;

    setClarificationMode(false);
    setIsProcessing(true);

    try {
      // Add clarification to data
      const updatedData = {
        ...clarificationData,
        clarificationAnswer,
      };

      // Reprocess with clarification
      const result = await processRawInput(input, updatedData);
      
      if (result && result.tasks.length > 0) {
        // Enrich with pipeline
        const enrichedTasks = await Promise.all(
          result.tasks.map(async (t) => {
            const enriched = await runTaskPipeline(t.title);
            return {
              title: t.title,
              category: t.category,
              custom_category_id: t.custom_category_id,
              priority: enriched.priority?.priority || t.priority,
              effort: enriched.priority?.effort || t.effort,
              future_priority_score: enriched.priority?.score,
              context: enriched.context?.taskContext?.[0]?.contextSummary || t.context,
              scheduled_bucket: enriched.routing?.taskRouting?.[0]?.bucket || t.scheduled_bucket,
              is_tiny: enriched.isTiny || t.is_tiny,
              is_tiny_task: enriched.isTiny || t.is_tiny,
              follow_up: enriched.followUp || null,
              reminder_time: t.reminder_time,
              goal_aligned: t.goal_aligned,
              alignment_reason: t.alignment_reason,
              idea_metadata: t.idea_metadata,
              input_method: 'text' as const,
              completed: false,
              has_reminder: !!t.reminder_time,
              has_person_name: false,
              is_time_based: false,
              is_focus: false,
            };
          })
        );

        await createTasks(enrichedTasks);

        // Post-save actions
        window.dispatchEvent(new CustomEvent('task:created'));
        refetch();
        
        // Trigger companion reaction
        const firstEnriched = enrichedTasks[0];
        onTaskCreated({
          priority: firstEnriched.future_priority_score,
          isTiny: firstEnriched.is_tiny,
          bucket: firstEnriched.scheduled_bucket,
        });

        setInput("");
        setClarificationData(null);
        setClarificationAnswer("");
      }
    } catch (error) {
      console.error("Clarification processing error:", error);
      toast({
        title: "Error",
        description: "Failed to process clarification.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiTaskConfirm = async () => {
    const tasksToCreate = extractedTasks.filter((_, i) => selectedTasks.has(i));
    
    if (tasksToCreate.length === 0) {
      setMultiTaskMode(false);
      return;
    }

    setIsProcessing(true);
    try {
      // Enrich with pipeline
      const enrichedTasks = await Promise.all(
        tasksToCreate.map(async (t) => {
          const enriched = await runTaskPipeline(t.title);
          return {
            title: t.title,
            category: t.category,
            custom_category_id: t.custom_category_id,
            priority: enriched.priority?.priority || t.priority,
            effort: enriched.priority?.effort || t.effort,
            future_priority_score: enriched.priority?.score,
            context: enriched.context?.taskContext?.[0]?.contextSummary || t.context,
            scheduled_bucket: enriched.routing?.taskRouting?.[0]?.bucket || t.scheduled_bucket,
            is_tiny: enriched.isTiny || t.is_tiny,
            is_tiny_task: enriched.isTiny || t.is_tiny,
            follow_up: enriched.followUp || null,
            reminder_time: t.reminder_time,
            goal_aligned: t.goal_aligned,
            alignment_reason: t.alignment_reason,
            idea_metadata: t.idea_metadata,
            input_method: 'text' as const,
            completed: false,
            has_reminder: !!t.reminder_time,
            has_person_name: false,
            is_time_based: false,
            is_focus: false,
          };
        })
      );

      await createTasks(enrichedTasks);

      // Post-save actions
      window.dispatchEvent(new CustomEvent('task:created'));
      refetch();
      
      // Trigger companion reaction
      const firstEnriched = enrichedTasks[0];
      onTaskCreated({
        priority: firstEnriched.future_priority_score,
        isTiny: firstEnriched.is_tiny,
        bucket: firstEnriched.scheduled_bucket,
      });

      setInput("");
      setMultiTaskMode(false);
      setExtractedTasks([]);
      setSelectedTasks(new Set());
    } catch (error) {
      console.error("Multi-task creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create tasks.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTaskSelection = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a task..."
            disabled={isProcessing}
            className="pr-12 bg-background/50 border-border/50 focus:bg-background"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isProcessing || !input.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Clarification Dialog */}
      <Dialog open={clarificationMode} onOpenChange={setClarificationMode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick question</DialogTitle>
            <DialogDescription>{clarificationQuestion}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {clarificationOptions.length > 0 ? (
              <div className="space-y-2">
                {clarificationOptions.map((option, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setClarificationAnswer(option);
                      setTimeout(() => handleClarificationSubmit(), 100);
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <>
                <Input
                  value={clarificationAnswer}
                  onChange={(e) => setClarificationAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  onKeyDown={(e) => e.key === 'Enter' && handleClarificationSubmit()}
                />
                <Button onClick={handleClarificationSubmit} className="w-full">
                  Continue
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Task Confirmation Dialog */}
      <Dialog open={multiTaskMode} onOpenChange={setMultiTaskMode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm tasks</DialogTitle>
            <DialogDescription>
              I found {extractedTasks.length} tasks. Select which ones to save:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-80 overflow-y-auto">
            {extractedTasks.map((task, i) => (
              <div key={i} className="flex items-start space-x-2">
                <Checkbox
                  id={`task-${i}`}
                  checked={selectedTasks.has(i)}
                  onCheckedChange={() => toggleTaskSelection(i)}
                />
                <Label htmlFor={`task-${i}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">{task.title}</div>
                  {task.context && (
                    <div className="text-xs text-muted-foreground">{task.context}</div>
                  )}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setMultiTaskMode(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleMultiTaskConfirm}
              disabled={selectedTasks.size === 0}
            >
              Save {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
