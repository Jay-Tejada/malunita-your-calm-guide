import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { offlineQueue } from "@/lib/offline/OfflineQueue";
import { logHabitCompletion } from "@/ai/habitPredictor";
import { useCognitiveLoad } from "@/state/cognitiveLoad";
import { recordPrimaryFocusCompleted } from "@/state/cognitiveLoad";
import { JOURNAL_EVENTS } from "@/features/journal/journalEvents";
import { questTracker } from "@/lib/questTracker";
import { bondingMeter, BONDING_INCREMENTS } from "@/state/bondingMeter";
import { useSeasonalEvent } from "./useSeasonalEvent";
import { useCustomizationStore } from "@/features/customization/useCustomizationStore";
import { useOneThingAvoidance } from "./useOneThingAvoidance";
import { updateBurnoutStatus } from "@/ai/burnoutDetector";
import { updatePriorityStorms } from "@/ai/priorityStormPredictor";
import { celebrations, getRandomToast } from "@/lib/celebrations";
import { useTaskStreak } from "./useTaskStreak";
import { useProgressVisibility } from "@/contexts/ProgressContext";
import { captureLearnSignal } from "./useLearnSignal";

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
  plan_id?: string | null;
  project_id?: string | null;
  display_order?: number | null;
  link_url?: string | null;
  // Task Intelligence Fields
  priority?: 'MUST' | 'SHOULD' | 'COULD';
  effort?: 'tiny' | 'small' | 'medium' | 'large';
  scheduled_bucket?: 'today' | 'tomorrow' | 'this_week' | 'upcoming' | 'someday';
  is_tiny?: boolean;
  is_tiny_task?: boolean;
  future_priority_score?: number | null;
  follow_up?: string | null;
  cluster?: {
    domain?: string | null;
    label?: string | null;
  } | null;
  idea_metadata?: any;
  ai_metadata?: {
    category?: string;
    priority?: 'MUST' | 'SHOULD' | 'COULD';
    project?: string;
    deadline?: string;
    subtasks?: string[];
    scheduled_bucket?: string;
  } | null;
  // Optimistic update flag - task is pending server confirmation
  _optimistic?: boolean;
}

export const useTasks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { recordTaskAdded, recordTaskCompleted, updateOverdueTasks } = useCognitiveLoad();
  const { isStarfallNight } = useSeasonalEvent();
  const { unlockCosmetic } = useCustomizationStore();
  const { checkAfterTaskCompletion } = useOneThingAvoidance();
  const { streakCount, isStreakActive, registerCompletion } = useTaskStreak();
  const { showProgress } = useProgressVisibility();

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

      // If offline, queue the actions
      if (!offlineQueue.isOnline()) {
        tasksWithUser.forEach(task => {
          offlineQueue.addAction('create_task', task);
        });
        toast({
          title: "Saved offline",
          description: "Tasks will sync when you're back online",
        });
        return tasksWithUser as any;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    // Optimistic update for instant feedback - NO async calls here for true instant UI
    onMutate: (newTasks) => {
      queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      
      // Create optimistic tasks with temp IDs - use placeholder user_id (will be replaced on success)
      const now = new Date().toISOString();
      const optimisticTasks = newTasks.map((task, index) => ({
        id: `temp-${Date.now()}-${index}`,
        user_id: 'optimistic',
        title: task.title,
        completed: false,
        has_reminder: false,
        has_person_name: false,
        is_time_based: false,
        input_method: 'text' as const,
        is_focus: false,
        created_at: now,
        updated_at: now,
        _optimistic: true, // Flag for pending visual state
        ...task,
      })) as Task[];
      
      queryClient.setQueryData<Task[]>(['tasks'], (old) => 
        [...optimisticTasks, ...(old || [])]
      );
      
      return { previousTasks, tempIds: optimisticTasks.map(t => t.id) };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
    onSuccess: async (data, variables, context) => {
      // Replace temp tasks with real ones
      if (context?.tempIds && data) {
        queryClient.setQueryData<Task[]>(['tasks'], (old) => {
          const withoutTemp = old?.filter(t => !context.tempIds.includes(t.id)) || [];
          return [...data, ...withoutTemp];
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Record task additions for cognitive load tracking
      data.forEach(() => recordTaskAdded());
      
      // Update priority storm predictions when new tasks are added
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        updatePriorityStorms(user.id);
      }
      
      toast({
        title: "Tasks saved",
        description: `${data.length} task${data.length > 1 ? 's' : ''} created successfully.`,
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      // If offline, queue the action
      if (!offlineQueue.isOnline()) {
        offlineQueue.addAction('update_task', { id, ...updates });
        return { id, ...updates } as Task;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update for instant feedback - synchronous for true instant UI
    onMutate: ({ id, updates }) => {
      queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      
      // Find the original task before update for learning signal capture
      const originalTask = previousTasks?.find(t => t.id === id);

      // Optimistically update the cache immediately
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old?.map((task) =>
          task.id === id ? { ...task, ...updates, _optimistic: true } : task
        )
      );

      return { previousTasks, originalTask, updates };
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
    onSuccess: async (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // === LEARNING SIGNAL CAPTURE ===
      const originalTask = context?.originalTask;
      const updates = context?.updates;
      
      if (originalTask && updates) {
        // Capture destination/category corrections
        if (updates.category && updates.category !== originalTask.category) {
          captureLearnSignal({
            type: 'destination_correction',
            from: originalTask.category || 'inbox',
            to: updates.category,
          }, data.id);
        }
        
        // Capture scheduled_bucket corrections
        if (updates.scheduled_bucket && updates.scheduled_bucket !== originalTask.scheduled_bucket) {
          captureLearnSignal({
            type: 'destination_correction',
            from: originalTask.scheduled_bucket || 'inbox',
            to: updates.scheduled_bucket,
          }, data.id);
        }
        
        // Capture title/summary edits
        if (updates.title && updates.title !== originalTask.title) {
          captureLearnSignal({
            type: 'summary_edit',
            original: originalTask.title?.substring(0, 50),
            edited: updates.title?.substring(0, 50),
          }, data.id);
        }
      }
      // If task is marked as ONE-thing (is_focus), store embedding and update burnout status
      if (data.is_focus && !data.completed) {
        try {
          // Invoke focus-memory-store to create embedding
          await supabase.functions.invoke('focus-memory-store', {
            body: {
              taskText: data.title,
              clusterId: data.category || null,
              unlocksCount: 0,
              taskId: data.id,
              outcome: null,
            },
          });
          console.log('✅ Focus memory embedding created for ONE-thing task');
        } catch (error) {
          console.error('Failed to store focus memory:', error);
        }

        // Update burnout status when ONE thing is set
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateBurnoutStatus(user.id);
        }
      }
      
      // Log habit completion when task is marked as completed
      if (data.completed && !data.completed_at) {
        recordTaskCompleted();
        
        // Register completion for streak tracking
        const currentStreak = registerCompletion(data.id);
        
        // Show progress indicator as reward
        showProgress();
        
        // Trigger appropriate celebration
        if (data.is_focus) {
          // ONE thing completed - special celebration
          celebrations.oneThingComplete();
          toast({
            title: getRandomToast('oneThingComplete'),
            duration: 3000,
          });
        } else if (currentStreak >= 3) {
          // Task streak - multiple tasks in quick succession
          celebrations.taskStreak(currentStreak);
          toast({
            title: getRandomToast('taskStreak', currentStreak),
            duration: 2000,
          });
        } else {
          // Regular task completion
          celebrations.taskComplete();
          toast({
            title: getRandomToast('taskComplete'),
            duration: 2000,
          });
        }
        
        const category = data.category || data.custom_category_id || 'uncategorized';
        logHabitCompletion(
          data.id,
          category,
          data.title,
          undefined // We don't track duration yet
        );
        
        // Track user patterns for companion intelligence
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const now = new Date();
            const hour = now.getHours();
            const dayOfWeek = now.getDay();

            // Track completion hours pattern
            await supabase.rpc('update_user_pattern', {
              p_user_id: user.id,
              p_pattern_type: 'completion_hours',
              p_data: { hour: hour.toString(), dayOfWeek }
            });

            // Track category patterns
            if (category !== 'uncategorized') {
              await supabase.rpc('update_user_pattern', {
                p_user_id: user.id,
                p_pattern_type: 'common_categories',
                p_data: { [category]: 1 }
              });
            }
          }
        } catch (error) {
          console.error('Failed to track user pattern:', error);
        }
        
        // Insert into task_history for analytics
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const metadata = data.ai_metadata as any;
            await supabase.from('task_history').insert({
              user_id: user.id,
              task_text: data.title,
              completed_at: new Date().toISOString(),
              category: category,
              sentiment: metadata?.priority === 'MUST' ? 'urgent' : 'neutral',
              difficulty: data.is_tiny_task ? 'tiny' : 'medium',
              emotional_context: data.context || null,
            });
          }
        } catch (error) {
          console.error('Failed to log task history:', error);
        }
        
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
        
        // If this was the ONE thing (primary focus), reduce cognitive load and update burnout status
        if (data.is_focus) {
          console.log('Primary focus task completed:', data.title);
          recordPrimaryFocusCompleted();
          
          // Update focus embedding with outcome
          try {
            const { data: embeddingData } = await supabase
              .from('focus_embeddings')
              .select('id')
              .eq('task_id', data.id)
              .maybeSingle();

            if (embeddingData) {
              await supabase
                .from('focus_embeddings')
                .update({ outcome: 'achieved' })
                .eq('id', embeddingData.id);
              console.log('✅ Focus embedding outcome updated');
            }
          } catch (error) {
            console.error('Failed to update focus embedding outcome:', error);
          }

          // Update burnout status after primary focus completion
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            updateBurnoutStatus(user.id);
          }
        }
        
        // Check for task milestone and create journal entry
        const completedCount = tasks?.filter(t => t.completed).length || 0;
        if ([3, 5, 10, 20].includes(completedCount)) {
          JOURNAL_EVENTS.TASK_MILESTONE(completedCount);
        }
      }
    },
  });

  // Helper to update plan quest progress (only defined once)
  const updatePlanQuestProgress = async (planId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all tasks in this plan
      const { data: planTasks } = await supabase
        .from('tasks')
        .select('id, completed')
        .eq('plan_id', planId)
        .eq('user_id', user.id);

      if (!planTasks) return;

      const completedCount = planTasks.filter(t => t.completed).length;
      const totalCount = planTasks.length;

      // Update the corresponding quest
      const questType = `plan_${planId}`;
      const { data: quest } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('quest_type', questType)
        .eq('user_id', user.id)
        .single();

      if (quest) {
        const completed = completedCount >= totalCount;
        
        await supabase
          .from('weekly_quests')
          .update({
            current_value: completedCount,
            completed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', quest.id);

        // If quest just completed, show celebration
        if (completed && !quest.completed) {
          toast({
            title: "🎉 Quest Complete!",
            description: `You've finished all steps in your plan!`,
          });
        }

        queryClient.invalidateQueries({ queryKey: ['weekly-quests'] });
      }
    } catch (error) {
      console.error('Error updating plan quest progress:', error);
    }
  };

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      // If offline, queue the action
      if (!offlineQueue.isOnline()) {
        offlineQueue.addAction('delete_task', { id });
        toast({
          title: "Saved offline",
          description: "Deletion will sync when you're back online",
        });
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    // Optimistic update for instant feedback - synchronous for true instant UI
    onMutate: (id) => {
      queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      
      // Find the task being deleted for learning signal capture
      const deletedTask = previousTasks?.find(t => t.id === id);
      
      // Optimistically remove the task immediately
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old?.filter((task) => task.id !== id)
      );
      
      return { previousTasks, deletedTask };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
    onSuccess: async (_, id, context) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // === LEARNING SIGNAL CAPTURE ===
      const deletedTask = context?.deletedTask;
      
      if (deletedTask) {
        // If this was a subtask (has parent), capture as decomposition rejection
        if (deletedTask.parent_task_id) {
          captureLearnSignal({
            type: 'decomposition_rejection',
            action: 'delete',
          }, deletedTask.parent_task_id);
        }
      }
      // Update priority storm predictions when tasks are deleted
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        updatePriorityStorms(user.id);
      }
      
      toast({
        title: "Task deleted",
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
