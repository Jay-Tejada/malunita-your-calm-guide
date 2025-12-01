import { useState } from "react";
import { TaskList } from "@/components/TaskList";
import { useTasks } from "@/hooks/useTasks";
import { InboxActions } from "@/components/InboxActions";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { TaskPageLayout } from "@/components/shared/TaskPageLayout";
import { useToast } from "@/hooks/use-toast";


interface TaskSuggestion {
  taskId: string;
  suggestion: 'today' | 'someday' | 'work' | 'home' | 'gym';
  confidence: number;
  reason?: string;
}

const Inbox = () => {
  const { tasks, isLoading, updateTask } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const { toast } = useToast();

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  const handleApplyAllSuggestions = async () => {
    try {
      for (const suggestion of suggestions) {
        const updates: { scheduled_bucket?: 'today' | 'someday'; category?: string } = 
          suggestion.suggestion === 'today' || suggestion.suggestion === 'someday'
            ? { scheduled_bucket: suggestion.suggestion as 'today' | 'someday' }
            : { category: suggestion.suggestion };
        
        await updateTask({ id: suggestion.taskId, updates });
      }
      
      toast({
        title: "All moved",
        description: `Moved ${suggestions.length} tasks`,
      });
      
      setSuggestions([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply suggestions",
        variant: "destructive",
      });
    }
  };

  const handleApplySuggestion = async (taskId: string, destination: string) => {
    try {
      const updates: { scheduled_bucket?: 'today' | 'someday'; category?: string } = 
        destination === 'today' || destination === 'someday'
          ? { scheduled_bucket: destination as 'today' | 'someday' }
          : { category: destination };
      
      await updateTask({ id: taskId, updates });
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.taskId !== taskId));
      
      toast({
        title: "Moved",
        description: `Task moved to ${destination}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive",
      });
    }
  };

  const handleDismissSuggestion = (taskId: string) => {
    setSuggestions(prev => prev.filter(s => s.taskId !== taskId));
  };

  return (
    <TaskPageLayout
      title="Inbox"
      placeholder="Capture a thought..."
      category="inbox"
    >
      {/* Planning Mode Overlay */}
      {planningMode && (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <PlanningModePanel 
            initialText={planningText}
            loading={loading}
            error={error}
            result={result}
            onRun={() => runPlanningBreakdown(planningText)}
            onClose={() => setPlanningMode(false)} 
          />
        </div>
      )}

      {/* Inbox Actions */}
      {!isLoading && tasks && (
        <InboxActions 
          tasks={tasks} 
          onSuggestionsGenerated={(newSuggestions) => setSuggestions(newSuggestions)}
          suggestions={suggestions}
          onApplyAll={handleApplyAllSuggestions}
        />
      )}
      
      {/* Task List */}
      <TaskList 
        category="inbox" 
        onPlanThis={handlePlanThis}
        suggestions={suggestions}
        onApplySuggestion={handleApplySuggestion}
        onDismissSuggestion={handleDismissSuggestion}
      />
    </TaskPageLayout>
  );
};

export default Inbox;
