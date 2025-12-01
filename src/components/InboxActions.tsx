import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTasks, Task } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { Zap, Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InboxActionsProps {
  tasks: Task[];
  onSuggestionsGenerated?: (suggestions: TaskSuggestion[]) => void;
  suggestions: TaskSuggestion[];
  onApplyAll: () => void;
}

interface TaskSuggestion {
  taskId: string;
  suggestion: 'today' | 'someday' | 'work' | 'home' | 'gym';
  confidence: number;
  reason?: string;
}

export function InboxActions({ tasks, onSuggestionsGenerated, suggestions, onApplyAll }: InboxActionsProps) {
  const { updateTask } = useTasks();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [ambiguousTasks, setAmbiguousTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);

  // Filter inbox tasks
  const inboxTasks = tasks.filter(
    (t) => !t.completed && t.category === "inbox"
  );

  // Find tiny tasks
  const tinyTasks = inboxTasks.filter(
    (t) =>
      t.is_tiny ||
      t.is_tiny_task ||
      (t.ai_metadata as any)?.tiny_task ||
      t.title.split(" ").length <= 5
  );

  const handleConvertTinyToQuickWins = async () => {
    if (tinyTasks.length === 0) {
      toast({
        title: "No tiny tasks",
        description: "There are no quick tasks to convert",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Move all tiny tasks to Today with is_focus
      await Promise.all(
        tinyTasks.map((task) =>
          updateTask({
            id: task.id,
            updates: {
              is_focus: true,
              focus_date: today,
              scheduled_bucket: "today",
              category: "quick_wins",
            },
          })
        )
      );

      toast({
        title: "Quick Wins created! ⚡",
        description: `Moved ${tinyTasks.length} tiny tasks to Today as Quick Wins`,
      });
    } catch (error) {
      console.error("Failed to convert tiny tasks:", error);
      toast({
        title: "Failed to create Quick Wins",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchCategorize = async () => {
    if (inboxTasks.length === 0) {
      toast({
        title: "Inbox is empty",
        description: "Nothing to organize",
      });
      return;
    }

    setIsOrganizing(true);

    try {
      const { data, error } = await supabase.functions.invoke('batch-categorize-inbox', {
        body: {}
      });

      if (error) {
        console.error('Categorization error:', error);
        
        if (error.message?.includes('429')) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a moment",
            variant: "destructive",
          });
          return;
        }
        
        if (error.message?.includes('402')) {
          toast({
            title: "AI credits depleted",
            description: "Please add credits to your workspace",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      const suggestions = data?.suggestions || [];
      
      if (suggestions.length === 0) {
        toast({
          title: "No suggestions",
          description: "AI couldn't categorize these tasks",
        });
        return;
      }

      // Pass suggestions to parent component
      onSuggestionsGenerated?.(suggestions);

      toast({
        title: `${suggestions.length} suggestions generated`,
        description: "Click suggestions to apply them",
      });
    } catch (error) {
      console.error("Failed to organize inbox:", error);
      
      // Check if it's a network/deployment error
      const isFetchError = error instanceof Error && 
        (error.message.includes("Failed to fetch") || error.message.includes("Edge Function"));
      
      if (isFetchError) {
        toast({
          title: "AI organizing unavailable",
          description: "Use manual 'Move to' actions on each task instead",
        });
      } else {
        toast({
          title: "Failed to organize",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleAmbiguousConfirm = async (sendToToday: boolean) => {
    setIsProcessing(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      await Promise.all(
        ambiguousTasks.map((task) =>
          updateTask({
            id: task.id,
            updates: sendToToday
              ? {
                  is_focus: true,
                  focus_date: today,
                  scheduled_bucket: "today",
                }
              : {
                  scheduled_bucket: "someday",
                  category: "someday",
                },
          })
        )
      );

      toast({
        title: "Inbox cleared! 🎉",
        description: `All tasks have been organized`,
      });
      
      setShowConfirmDialog(false);
      setAmbiguousTasks([]);
    } catch (error) {
      console.error("Failed to move ambiguous tasks:", error);
      toast({
        title: "Failed to move tasks",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (inboxTasks.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Convert Tiny Tasks to Quick Wins */}
        {tinyTasks.length > 0 && (
          <Button
            onClick={handleConvertTinyToQuickWins}
            disabled={isProcessing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Convert {tinyTasks.length} Quick Task{tinyTasks.length > 1 ? "s" : ""} to
            Wins
          </Button>
        )}

        {/* Organize Inbox */}
        <div className="inline-flex items-center gap-3">
          <Button
            onClick={handleBatchCategorize}
            disabled={isOrganizing}
            variant="ghost"
            className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground/70 border border-foreground/15 rounded-lg px-3 py-1.5 bg-transparent hover:bg-transparent"
          >
            {isOrganizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Organizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Organize
              </>
            )}
          </Button>
          
          {/* Apply All Link */}
          {suggestions.length > 0 && (
            <button
              onClick={onApplyAll}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors font-mono"
            >
              Apply all ({suggestions.length})
            </button>
          )}
        </div>
      </div>

      {/* Ambiguous Tasks Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ambiguousTasks.length} tasks need your input
            </AlertDialogTitle>
            <AlertDialogDescription>
              These tasks could go either way. Where would you like to send them?
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                {ambiguousTasks.map((task) => (
                  <div
                    key={task.id}
                    className="text-sm p-2 bg-muted rounded border"
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => handleAmbiguousConfirm(false)}
              disabled={isProcessing}
            >
              Send to Someday
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAmbiguousConfirm(true)}
              disabled={isProcessing}
            >
              <Send className="w-4 h-4 mr-2" />
              Send to Today
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
