import { useState, useCallback } from 'react';
import { useTasks, Task } from './useTasks';
import { useToast } from './use-toast';

interface RelatedTaskSuggestion {
  task_id: string;
  task_title: string;
  shared_keywords: string[];
  suggested_bucket: 'today' | 'this_week';
}

export const useRelatedTaskSuggestions = () => {
  const [suggestions, setSuggestions] = useState<RelatedTaskSuggestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { tasks, updateTask } = useTasks();
  const { toast } = useToast();

  const findRelatedTasks = useCallback((primaryFocusTask: Task): RelatedTaskSuggestion[] => {
    if (!primaryFocusTask.keywords || primaryFocusTask.keywords.length === 0) {
      return [];
    }

    const primaryKeywords = new Set(primaryFocusTask.keywords.map(k => k.toLowerCase()));
    const relatedTasks: Array<{ task: Task; sharedKeywords: string[]; score: number }> = [];

    const allTasks = tasks || [];
    
    for (const task of allTasks) {
      // Skip if it's the primary focus task, completed, or has no ID
      if (!task.id || task.id === primaryFocusTask.id || task.completed) continue;
      if (task.is_focus) continue; // Skip tasks already in focus

      // Skip if task has no keywords
      if (!task.keywords || task.keywords.length === 0) continue;

      // Calculate keyword overlap
      const taskKeywords = task.keywords.map(k => k.toLowerCase());
      const sharedKeywords = taskKeywords.filter(k => primaryKeywords.has(k));

      if (sharedKeywords.length > 0) {
        // Score based on keyword overlap
        const score = sharedKeywords.length;
        relatedTasks.push({ task, sharedKeywords, score });
      }
    }

    // Sort by score (most overlap first) and limit to 2
    relatedTasks.sort((a, b) => b.score - a.score);
    const topRelated = relatedTasks.slice(0, 2);

    // Convert to suggestions with appropriate buckets
    return topRelated.map((related, index) => ({
      task_id: related.task.id!,
      task_title: related.task.title,
      shared_keywords: related.sharedKeywords,
      // First suggestion goes to today, second to this_week
      suggested_bucket: index === 0 ? 'today' : 'this_week',
    }));
  }, [tasks]);

  const checkForRelatedTasks = useCallback((primaryFocusTask: Task) => {
    const related = findRelatedTasks(primaryFocusTask);
    setSuggestions(related);
    return related;
  }, [findRelatedTasks]);

  const acceptSuggestion = useCallback(async (suggestion: RelatedTaskSuggestion) => {
    setIsProcessing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (suggestion.suggested_bucket === 'today') {
        // Move to today's focus
        await updateTask({
          id: suggestion.task_id,
          updates: {
            is_focus: true,
            focus_date: today,
            context: 'Related to primary focus',
          },
        });
        
        toast({
          title: 'Task moved to Today',
          description: `"${suggestion.task_title}" added to your focus`,
        });
      } else if (suggestion.suggested_bucket === 'this_week') {
        // Mark for this week with context
        await updateTask({
          id: suggestion.task_id,
          updates: {
            context: 'This Week - Related to primary focus',
            category: 'projects',
          },
        });
        
        toast({
          title: 'Task scheduled for This Week',
          description: `"${suggestion.task_title}" prioritized`,
        });
      }

      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.task_id !== suggestion.task_id));
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to move task',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [updateTask, toast]);

  const declineSuggestion = useCallback((taskId: string) => {
    setSuggestions(prev => prev.filter(s => s.task_id !== taskId));
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isProcessing,
    checkForRelatedTasks,
    acceptSuggestion,
    declineSuggestion,
    clearSuggestions,
  };
};
