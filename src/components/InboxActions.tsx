import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTasks, Task } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { Zap, Sparkles, Send } from "lucide-react";
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
}

export function InboxActions({ tasks }: InboxActionsProps) {
  const { updateTask } = useTasks();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [ambiguousTasks, setAmbiguousTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleIntelligentClear = async () => {
    if (inboxTasks.length === 0) {
      toast({
        title: "Inbox is empty",
        description: "Nothing to clear",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Categorize tasks
      const highValue: Task[] = [];
      const lowValue: Task[] = [];
      const ambiguous: Task[] = [];

      inboxTasks.forEach((task) => {
        const priority = task.priority || task.ai_metadata?.priority || "SHOULD";
        const isTimeSensitive =
          task.is_time_based || task.has_reminder || task.reminder_time;
        const priorityScore = task.future_priority_score || 0;

        // High value: MUST priority, time-sensitive, or high score
        if (
          priority === "MUST" ||
          isTimeSensitive ||
          priorityScore >= 0.75
        ) {
          highValue.push(task);
        }
        // Low value: COULD priority, no time constraint, low score
        else if (
          priority === "COULD" &&
          !isTimeSensitive &&
          priorityScore < 0.4
        ) {
          lowValue.push(task);
        }
        // Ambiguous: everything else
        else {
          ambiguous.push(task);
        }
      });

      // Send high value to Today
      await Promise.all(
        highValue.map((task) =>
          updateTask({
            id: task.id,
            updates: {
              is_focus: true,
              focus_date: today,
              scheduled_bucket: "today",
            },
          })
        )
      );

      // Send low value to Someday
      await Promise.all(
        lowValue.map((task) =>
          updateTask({
            id: task.id,
            updates: {
              scheduled_bucket: "someday",
              category: "someday",
            },
          })
        )
      );

      // Handle ambiguous tasks
      if (ambiguous.length > 0) {
        setAmbiguousTasks(ambiguous);
        setShowConfirmDialog(true);
      } else {
        toast({
          title: "Inbox cleared! 🎉",
          description: `Moved ${highValue.length} to Today, ${lowValue.length} to Someday`,
        });
      }
    } catch (error) {
      console.error("Failed to clear inbox:", error);
      toast({
        title: "Failed to clear inbox",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
        <Button
          onClick={handleIntelligentClear}
          disabled={isProcessing}
          variant="ghost"
          className="flex items-center gap-2 bg-transparent border border-foreground/20 text-foreground/60 hover:border-foreground/30 hover:text-foreground/80 hover:bg-transparent text-sm py-2 px-4"
        >
          <Sparkles className="w-3.5 h-3.5 opacity-60" />
          Organize
        </Button>
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
