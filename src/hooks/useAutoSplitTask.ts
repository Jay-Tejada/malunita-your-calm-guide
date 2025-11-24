import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from './useTasks';
import { recordComplexPrimaryFocus } from '@/state/cognitiveLoad';

interface Subtask {
  title: string;
}

export const useAutoSplitTask = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const shouldAutoSplit = (task: Task): boolean => {
    // Check if task is complex (more than 8 words)
    const wordCount = task.title.trim().split(/\s+/).length;
    if (wordCount > 8) return true;

    // Check for cognitive load indicators
    const cognitiveLoadKeywords = [
      'research', 'analyze', 'plan', 'organize', 'prepare', 'develop',
      'create', 'design', 'implement', 'review', 'complete', 'finish'
    ];
    const lowerTitle = task.title.toLowerCase();
    const hasCognitiveLoad = cognitiveLoadKeywords.some(keyword => 
      lowerTitle.includes(keyword)
    );

    return hasCognitiveLoad;
  };

  const generateAndCreateSubtasks = async (parentTask: Task): Promise<void> => {
    if (!shouldAutoSplit(parentTask)) {
      console.log('Task not complex enough for auto-split');
      return;
    }

    // Record complex primary focus in cognitive load system
    recordComplexPrimaryFocus();

    setIsGenerating(true);
    try {
      console.log('Auto-splitting task:', parentTask.title);

      // Call edge function to generate subtasks
      const { data, error } = await supabase.functions.invoke('generate-subtasks', {
        body: { 
          taskTitle: parentTask.title,
          taskContext: parentTask.context
        }
      });

      if (error) {
        console.error('Error generating subtasks:', error);
        return;
      }

      const subtasks = data?.subtasks as Subtask[];
      if (!subtasks || subtasks.length === 0) {
        console.log('No subtasks generated');
        return;
      }

      // Create subtasks in database with Step labels
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subtasksToInsert = subtasks.map((subtask, index) => ({
        user_id: user.id,
        title: `Step ${index + 1}: ${subtask.title}`,
        parent_task_id: parentTask.id,
        category: parentTask.category,
        context: parentTask.context,
        completed: false,
        input_method: 'text' as const,
      }));

      const { error: insertError } = await supabase
        .from('tasks')
        .insert(subtasksToInsert);

      if (insertError) {
        console.error('Error inserting subtasks:', insertError);
        return;
      }

      console.log(`Created ${subtasks.length} subtasks for task:`, parentTask.title);
    } catch (error) {
      console.error('Auto-split error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAndCreateSubtasks,
    isGenerating,
  };
};
