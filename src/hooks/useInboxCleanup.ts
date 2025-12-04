import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";

interface LocalSuggestion {
  taskId: string;
  title: string;
  suggestedCategory: string;
  confidence: number;
}

interface TaskGroup {
  group_title: string;
  reason: string;
  task_ids: string[];
}

interface QuickWin {
  task_id: string;
  reason: string;
}

interface ArchiveSuggestion {
  task_id: string;
  reason: string;
}

interface Question {
  task_id: string;
  question: string;
}

interface CleanupAnalysis {
  grouped_tasks: TaskGroup[];
  quick_wins: QuickWin[];
  archive_suggestions: ArchiveSuggestion[];
  questions: Question[];
}

export const useInboxCleanup = () => {
  const { toast } = useToast();
  const { tasks, updateTask } = useTasks();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CleanupAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<LocalSuggestion[]>([]);

  const categorizeLocally = (taskTitle: string): { category: string; confidence: number } => {
    const title = taskTitle.toLowerCase();
    
    // Work keywords
    if (title.includes('meeting') || title.includes('email') || title.includes('client') || 
        title.includes('project') || title.includes('report') || title.includes('deadline') ||
        title.includes('boss') || title.includes('coworker') || title.includes('office')) {
      return { category: 'work', confidence: 0.8 };
    }
    
    // Home keywords
    if (title.includes('bill') || title.includes('grocery') || title.includes('clean') ||
        title.includes('laundry') || title.includes('cook') || title.includes('fix') ||
        title.includes('call mom') || title.includes('family') || title.includes('apartment')) {
      return { category: 'home', confidence: 0.8 };
    }
    
    // Gym keywords
    if (title.includes('gym') || title.includes('workout') || title.includes('exercise') ||
        title.includes('run') || title.includes('weight') || title.includes('fitness') ||
        title.includes('trainer')) {
      return { category: 'gym', confidence: 0.8 };
    }
    
    // Quick win detection (short tasks)
    if (title.includes('quick') || title.includes('5 min') || title.includes('remind') ||
        title.length < 30) {
      return { category: 'today', confidence: 0.7 };
    }
    
    return { category: 'uncategorized', confidence: 0 };
  };

  const analyzeInbox = async () => {
    setIsAnalyzing(true);
    try {
      const inboxTasks = tasks?.filter(t => 
        (t.category === 'inbox' || !t.category) && !t.completed
      ) || [];

      if (inboxTasks.length === 0) {
        toast({
          title: "Inbox is empty",
          description: "Nothing to organize!",
        });
        setIsAnalyzing(false);
        return null;
      }

      // DEPRECATED: inbox-cleanup deleted in Phase 3C
      // TODO: Use local categorization or suggest-focus
      // Edge function removed - using local fallback directly
      console.log('Using local inbox categorization (inbox-cleanup removed)');

      // Local fallback - categorize each task
      const localSuggestions = inboxTasks.map(task => {
        const { category, confidence } = categorizeLocally(task.title);
        return {
          taskId: task.id,
          title: task.title,
          suggestedCategory: category,
          confidence
        };
      }).filter(s => s.suggestedCategory !== 'uncategorized');

      // Store suggestions in state for display
      setSuggestions(localSuggestions);
      
      toast({
        title: `${localSuggestions.length} suggestions ready`,
        description: "Review and apply below",
      });
      
      setIsAnalyzing(false);
      return { suggestions: localSuggestions };
      
    } catch (error) {
      console.error('Failed to analyze inbox:', error);
      toast({
        title: 'Error',
        description: 'Failed to organize inbox',
        variant: 'destructive',
      });
      setIsAnalyzing(false);
      return null;
    }
  };

  const completeGroup = async (taskIds: string[]) => {
    try {
      await Promise.all(
        taskIds.map(id => updateTask({ id, updates: { completed: true, completed_at: new Date().toISOString() } }))
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Tasks completed',
        description: `Marked ${taskIds.length} tasks as done`,
      });
    } catch (error) {
      console.error('Failed to complete tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete tasks',
        variant: 'destructive',
      });
    }
  };

  const snoozeGroup = async (taskIds: string[]) => {
    try {
      // Move to "someday" bucket
      await Promise.all(
        taskIds.map(id => updateTask({ id, updates: { scheduled_bucket: 'someday' } }))
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Tasks snoozed',
        description: `Moved ${taskIds.length} tasks to Someday`,
      });
    } catch (error) {
      console.error('Failed to snooze tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to snooze tasks',
        variant: 'destructive',
      });
    }
  };

  const archiveGroup = async (taskIds: string[]) => {
    try {
      // Delete tasks directly from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Tasks archived',
        description: `Removed ${taskIds.length} tasks`,
      });
    } catch (error) {
      console.error('Failed to archive tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive tasks',
        variant: 'destructive',
      });
    }
  };

  const logCleanup = async (completed: number, archived: number, snoozed: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalTasks = tasks?.filter(t => t.category === 'inbox' && !t.completed).length || 0;

      await supabase.from('inbox_cleanup_log').insert({
        user_id: user.id,
        total_tasks: totalTasks,
        completed_count: completed,
        archived_count: archived,
        snoozed_count: snoozed,
      });
    } catch (error) {
      console.error('Failed to log cleanup:', error);
    }
  };

  const applySuggestion = async (taskId: string, category: string) => {
    try {
      if (category === 'today') {
        await updateTask({ id: taskId, updates: { scheduled_bucket: 'today' } });
      } else {
        await updateTask({ id: taskId, updates: { category } });
      }
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.taskId !== taskId));
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: 'Moved',
        description: `Task moved to ${category}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move task',
        variant: 'destructive',
      });
    }
  };

  const applyAllSuggestions = async () => {
    try {
      for (const suggestion of suggestions) {
        if (suggestion.suggestedCategory === 'today') {
          await updateTask({ id: suggestion.taskId, updates: { scheduled_bucket: 'today' } });
        } else {
          await updateTask({ id: suggestion.taskId, updates: { category: suggestion.suggestedCategory } });
        }
      }
      
      setSuggestions([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: 'All moved',
        description: `Moved ${suggestions.length} tasks`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply suggestions',
        variant: 'destructive',
      });
    }
  };

  return {
    analyzeInbox,
    completeGroup,
    snoozeGroup,
    archiveGroup,
    logCleanup,
    applySuggestion,
    applyAllSuggestions,
    isAnalyzing,
    analysis,
    suggestions,
    inboxCount: tasks?.filter(t => t.category === 'inbox' && !t.completed).length || 0,
  };
};
