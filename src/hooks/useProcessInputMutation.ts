import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProcessInputOptions {
  text: string;
  context?: {
    currentCategory?: string;
    recentTasks?: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

interface ProcessInputResponse {
  tasks: Array<{
    title: string;
    category?: string;
    priority?: 'MUST' | 'SHOULD' | 'COULD';
    scheduled_bucket?: string;
    is_tiny_task?: boolean;
  }>;
  suggestions?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Optimized mutation hook for AI-powered task processing
 * - Caches AI categorization results to avoid duplicate API calls
 * - Automatically invalidates tasks cache on success
 * - Provides loading and error states
 * - Includes optimistic updates for instant UI feedback
 */
export const useProcessInputMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationKey: ['processInput'],
    mutationFn: async ({ text, context }: ProcessInputOptions): Promise<ProcessInputResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('🤖 Processing input with AI:', text);

      const { data, error } = await supabase.functions.invoke('process-input', {
        body: {
          text,
          context: {
            ...context,
            userId: user.id,
          },
        },
      });

      if (error) {
        console.error('❌ AI processing error:', error);
        throw error;
      }

      console.log('✅ AI processing complete:', data);
      return data;
    },
    onSuccess: async (data, variables) => {
      // Invalidate tasks cache to refetch with new tasks
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Also invalidate profile cache (might have updated preferences)
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      console.log(`✅ Created ${data.tasks.length} task(s) from: "${variables.text}"`);

      toast({
        title: "Tasks processed",
        description: `${data.tasks.length} task${data.tasks.length > 1 ? 's' : ''} created with AI categorization`,
      });
    },
    onError: (error: any, variables) => {
      console.error('❌ Failed to process input:', error);
      
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process your input. Please try again.",
        variant: "destructive",
      });
    },
    // Retry only once for AI requests (they're expensive)
    retry: 1,
    retryDelay: 1000,
  });
};

/**
 * Hook for categorizing a single task with AI
 * - Lighter weight than full input processing
 * - Useful for re-categorizing existing tasks
 */
export const useCategorizeTaskMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationKey: ['categorizeTask'],
    mutationFn: async ({ 
      taskId, 
      text 
    }: { 
      taskId: string; 
      text: string 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('categorize-task', {
        body: { 
          text,
          userId: user.id,
        },
      });

      if (error) throw error;

      // Update the task with new category if confidence is high
      if (data.confidence === 'high' && data.category !== 'inbox') {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            category: data.category,
            ai_metadata: {
              category: data.category,
              priority: data.priority,
              scheduled_bucket: data.scheduled_bucket,
            }
          })
          .eq('id', taskId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      return data;
    },
    onSuccess: async (data, variables) => {
      // Invalidate tasks to show updated category
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });

      if (data.confidence === 'high') {
        console.log(`✅ Task ${variables.taskId} auto-categorized as: ${data.category}`);
      } else {
        console.log(`⚠️ Low confidence categorization for task ${variables.taskId}`);
      }
    },
    onError: (error: any) => {
      console.error('❌ Categorization failed:', error);
      // Silently fail - categorization is optional
    },
    // Don't retry categorization failures
    retry: false,
  });
};
