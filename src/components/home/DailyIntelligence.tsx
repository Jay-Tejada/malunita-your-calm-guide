import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Target, Zap, Map } from "lucide-react";
import { useTaskPlan } from "@/hooks/useTaskPlan";
import { TaskPlanPanel } from "@/components/planning/TaskPlanPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

interface DailyIntelligenceProps {
  summary?: string | null;
  quickWins?: Array<{ id: string; title: string }>;
  focusMessage?: string | null;
  oneThing?: string | null;
}

export function DailyIntelligence({ summary, quickWins, focusMessage, oneThing }: DailyIntelligenceProps) {
  const { isLoading, isPanelOpen, currentQuest, buildFullQuest, closePanel } = useTaskPlan();
  const { createTasks } = useTasks();
  const { toast } = useToast();

  const handleTaskClick = async (stepId: string) => {
    if (!currentQuest) return;

    // Find the step across all chapters
    let foundStep: any = null;
    let foundChapter: any = null;
    
    for (const chapter of currentQuest.chapters) {
      const step = chapter.steps.find(s => s.id === stepId);
      if (step) {
        foundStep = step;
        foundChapter = chapter;
        break;
      }
    }

    if (!foundStep) return;

    try {
      // Create the task from the plan step
      await createTasks([{
        title: foundStep.title,
        category: 'inbox',
        context: foundStep.reason,
        is_tiny_task: foundStep.tiny || false,
      }]);

      toast({
        title: "Task created!",
        description: `"${foundStep.title}" added to your inbox`,
      });

      // Keep dialog open so user can continue creating tasks from the plan
    } catch (error) {
      console.error('Error creating task from plan:', error);
      toast({
        title: "Failed to create task",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Render nothing if no data
  if (!summary && (!quickWins || quickWins.length === 0) && !focusMessage && !oneThing) {
    return null;
  }

  return (
    <>
      <Card className="p-6 space-y-6 bg-transparent border-transparent shadow-none rounded-xl">
        {/* Build Plan Button */}
        <Button
          onClick={buildFullQuest}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          <Map className="w-4 h-4 mr-2" />
          {isLoading ? "Building your plan..." : "🧩 Build My Plan"}
        </Button>
      {/* ONE Thing Section */}
      {oneThing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Your ONE Thing Today
            </h3>
          </div>
          <p className="text-sm text-foreground font-medium pl-6">
            {oneThing}
          </p>
        </div>
      )}

      {/* Focus Message Section */}
      {focusMessage && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Focus Insight
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {focusMessage}
          </p>
        </div>
      )}

      {/* Today's Overview Section */}
      {summary && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Today's Overview
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      )}

      {/* Quick Wins Section */}
      {quickWins && quickWins.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Quick Wins
            </h3>
          </div>
          <ul className="space-y-1.5 pl-6">
            {quickWins.map((win) => (
              <li key={win.id} className="text-sm text-muted-foreground pl-4 relative">
                <span className="absolute left-0 top-0">•</span>
                {win.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      </Card>

      {/* Quest Panel Dialog */}
      <Dialog open={isPanelOpen} onOpenChange={closePanel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {currentQuest && (
            <TaskPlanPanel
              questTitle={currentQuest.quest_title}
              questSummary={currentQuest.quest_summary}
              chapters={currentQuest.chapters}
              motivationBoost={currentQuest.motivation_boost}
              onClose={closePanel}
              onTaskClick={handleTaskClick}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
