import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanStep {
  title: string;
  suggested_category: string;
  suggested_timeframe: string | null;
  is_tiny: boolean;
  parent_task_title?: string;
}

interface PlanResult {
  plan_title: string;
  overall_goal: string;
  estimated_load: 'light' | 'moderate' | 'heavy';
  steps: PlanStep[];
}

export function usePlanTasks() {
  const queryClient = useQueryClient();

  const generatePlan = useMutation({
    mutationFn: async (taskIds: string[]): Promise<PlanResult> => {
      const { data, error } = await supabase.functions.invoke('plan-tasks', {
        body: { task_ids: taskIds },
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Error generating plan:', error);
      toast.error('Failed to generate plan');
    },
  });

  const createPlanTasks = useMutation({
    mutationFn: async ({ 
      planTitle, 
      steps 
    }: { 
      planTitle: string; 
      steps: PlanStep[] 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the parent plan task
      const { data: planTask, error: planError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: planTitle,
          category: 'focus',
          is_focus: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create all step tasks with plan_id reference
      const stepTasks = steps.map(step => ({
        user_id: user.id,
        title: step.title,
        category: step.suggested_category || 'inbox',
        plan_id: planTask.id,
        is_tiny_task: step.is_tiny,
        context: step.parent_task_title ? `Part of: ${step.parent_task_title}` : null,
      }));

      const { error: stepsError } = await supabase
        .from('tasks')
        .insert(stepTasks);

      if (stepsError) throw stepsError;

      return planTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Plan created successfully! 🎯');
    },
    onError: (error) => {
      console.error('Error creating plan tasks:', error);
      toast.error('Failed to create plan tasks');
    },
  });

  return {
    generatePlan: generatePlan.mutateAsync,
    createPlanTasks: createPlanTasks.mutateAsync,
    isGenerating: generatePlan.isPending,
    isCreating: createPlanTasks.isPending,
  };
}
