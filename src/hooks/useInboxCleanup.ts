import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";

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

  const analyzeInbox = async () => {
    setIsAnalyzing(true);
    try {
      const inboxTasks = tasks?.filter(t => 
        t.category === 'inbox' && !t.completed
      ) || [];

      if (inboxTasks.length === 0) {
        toast({
          title: "Inbox is empty",
          description: "No tasks to clean up!",
        });
        return null;
      }

      const { data, error } = await supabase.functions.invoke('inbox-cleanup', {
        body: { tasks: inboxTasks }
      });

      if (error) throw error;

      setAnalysis(data);
      return data;
    } catch (error) {
      console.error('Failed to analyze inbox:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze inbox',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
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

  return {
    analyzeInbox,
    completeGroup,
    snoozeGroup,
    archiveGroup,
    logCleanup,
    isAnalyzing,
    analysis,
    inboxCount: tasks?.filter(t => t.category === 'inbox' && !t.completed).length || 0,
  };
};
