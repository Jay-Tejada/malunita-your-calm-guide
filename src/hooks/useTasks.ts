import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logHabitCompletion } from "@/ai/habitPredictor";
import { useCognitiveLoad } from "@/state/cognitiveLoad";
import { JOURNAL_EVENTS } from "@/features/journal/journalEvents";
import { questTracker } from "@/lib/questTracker";
import { bondingMeter, BONDING_INCREMENTS } from "@/state/bondingMeter";
import { useSeasonalEvent } from "./useSeasonalEvent";
import { useCustomizationStore } from "@/features/customization/useCustomizationStore";
import { useOneThingAvoidance } from "./useOneThingAvoidance";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  context?: string;
  category?: string;
  custom_category_id?: string;
  completed: boolean;
  completed_at?: string;
  has_reminder: boolean;
  reminder_time?: string;
  has_person_name: boolean;
  is_time_based: boolean;
  keywords?: string[];
  input_method: 'voice' | 'text';
  is_focus: boolean;
  focus_date?: string;
  created_at: string;
  updated_at: string;
  goal_aligned?: boolean | null;
  alignment_reason?: string | null;
  recurrence_pattern?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_day?: number;
  recurrence_end_date?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
  parent_task_id?: string | null;
}

export const useTasks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { recordTaskAdded, recordTaskCompleted, updateOverdueTasks } = useCognitiveLoad();
  const { isStarfallNight } = useSeasonalEvent();
  const { unlockCosmetic } = useCustomizationStore();
  const { checkAfterTaskCompletion } = useOneThingAvoidance();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const createTasks = useMutation({
    mutationFn: async (tasks: Array<Omit<Partial<Task>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { title: string }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tasksWithUser = tasks.map(task => ({
        ...task,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Record task additions for cognitive load tracking
      data.forEach(() => recordTaskAdded());
      
      toast({
        title: "Tasks saved",
        description: `${data.length} task${data.length > 1 ? 's' : ''} created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Log habit completion when task is marked as completed
      if (data.completed && !data.completed_at) {
        recordTaskCompleted();
        
        const category = data.category || data.custom_category_id || 'uncategorized';
        logHabitCompletion(
          data.id,
          category,
          data.title,
          undefined // We don't track duration yet
        );
        
        // Track quest progress for task completion
        questTracker.trackTaskCompletion();
        
        // Check project completion quest
        questTracker.checkProjectCompletion();
        
        // Increment bonding for task completion
        bondingMeter.incrementBonding(
          BONDING_INCREMENTS.TASK_COMPLETED,
          "Task completed! Malunita is proud"
        );
        
        // Starfall Night special: chance to unlock rare cosmetic
        if (isStarfallNight && Math.random() < 0.15) { // 15% chance
          const rareCosmetics = [
            { type: 'trail', id: 'starlight-trail' },
            { type: 'aura', id: 'celestial-aura' },
            { type: 'accessory', id: 'star-crown' },
          ];
          const randomCosmetic = rareCosmetics[Math.floor(Math.random() * rareCosmetics.length)];
          unlockCosmetic(randomCosmetic.type as any, randomCosmetic.id);
          
          toast({
            title: "✨ Starfall Blessing!",
            description: `You unlocked a rare ${randomCosmetic.id.replace(/-/g, ' ')}!`,
            duration: 5000,
          });
        }
        
        // Check for ONE-thing avoidance after task completion
        checkAfterTaskCompletion();
        
        // Check for task milestone and create journal entry
        const completedCount = tasks?.filter(t => t.completed).length || 0;
        if ([3, 5, 10, 20].includes(completedCount)) {
          JOURNAL_EVENTS.TASK_MILESTONE(completedCount);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tasks,
    isLoading,
    createTasks: createTasks.mutateAsync,
    updateTask: updateTask.mutateAsync,
    deleteTask: deleteTask.mutateAsync,
  };
};
