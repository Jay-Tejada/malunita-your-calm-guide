import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrbStore } from "@/state/orbState";
import type { Task } from "@/hooks/useTasks";

interface CaptureOptions {
  text: string;
  category?: string;
  scheduled_bucket?: string;
  project_id?: string;
  fallbackOnError?: boolean;
}

interface CaptureResult {
  success: boolean;
  taskIds: string[];
  taskCount: number;
  aiProcessed: boolean;
}

/**
 * Hook for AI-powered task capture that routes through the process-input orchestrator.
 * 
 * This ensures all captures go through the full AI pipeline:
 * - Semantic compression (ai_summary)
 * - Context indexing (memory_tags)
 * - Task extraction and classification
 * - Priority scoring
 * - Database persistence
 * 
 * Falls back to direct creation if AI processing fails.
 */
export const useAICapture = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationKey: ['aiCapture'],
    mutationFn: async ({
      text,
      category = 'inbox',
      scheduled_bucket,
      project_id,
      fallbackOnError = true
    }: CaptureOptions): Promise<CaptureResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('🧠 AI Capture: Processing input...', { text: text.substring(0, 50), category, scheduled_bucket });
      
      // Trigger orb thinking state
      useOrbStore.getState().triggerThinking();

      try {
        // Route through process-input orchestrator which now:
        // 1. Runs semantic compression
        // 2. Extracts and classifies tasks
        // 3. Runs context indexing
        // 4. Persists to database with all AI fields
        const { data, error } = await supabase.functions.invoke('process-input', {
          body: {
            text,
            user_id: user.id,
            persist: true,
            category,
            scheduled_bucket,
            project_id
          },
        });

        if (error) {
          console.error('❌ AI Capture: process-input failed:', error);
          throw error;
        }

        console.log('✅ AI Capture: Success!', {
          taskCount: data.tasks?.length,
          createdIds: data.createdTaskIds,
          aiSummary: data.tasks?.[0]?.ai_summary?.substring(0, 50)
        });

        useOrbStore.getState().reset();

        return {
          success: true,
          taskIds: data.createdTaskIds || [],
          taskCount: data.tasks?.length || 0,
          aiProcessed: true
        };

      } catch (error) {
        console.error('❌ AI Capture: Error during AI processing:', error);
        useOrbStore.getState().reset();

        // Fallback: create task directly without AI processing
        if (fallbackOnError) {
          console.log('🔄 AI Capture: Falling back to direct creation...');
          
          const { data: fallbackTask, error: fallbackError } = await supabase
            .from('tasks')
            .insert({
              user_id: user.id,
              title: text.trim(),
              raw_content: text,
              category: category || 'inbox',
              scheduled_bucket: scheduled_bucket || null,
              project_id: project_id || null,
              ai_confidence: 0, // Mark as not AI-processed
            })
            .select()
            .single();

          if (fallbackError) {
            console.error('❌ AI Capture: Fallback also failed:', fallbackError);
            throw fallbackError;
          }

          console.log('✅ AI Capture: Fallback succeeded (no AI processing)');
          
          return {
            success: true,
            taskIds: [fallbackTask.id],
            taskCount: 1,
            aiProcessed: false
          };
        }

        throw error;
      }
    },
    // Optimistic update: show the task immediately while AI pipeline runs
    onMutate: (variables) => {
      queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousQueries = queryClient.getQueriesData<Task[]>({ queryKey: ['tasks'] });
      const now = new Date().toISOString();
      const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const optimisticTask: Task = {
        id: tempId,
        user_id: 'optimistic',
        title: variables.text.trim(),
        completed: false,
        has_reminder: false,
        has_person_name: false,
        is_time_based: false,
        input_method: 'text',
        is_focus: false,
        created_at: now,
        updated_at: now,
        category: variables.category ?? 'inbox',
        scheduled_bucket: (variables.scheduled_bucket as any) ?? null,
        project_id: variables.project_id ?? null,
        // Ensure it appears at the top in /work where sorting is display_order asc
        display_order: -Date.now(),
        _optimistic: true,
      };

      queryClient.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) => {
        const existing = (old ?? []) as Task[];
        return [optimisticTask, ...existing];
      });

      return { previousQueries, tempId };
    },
    onSuccess: async (result, _variables, context) => {
      // Replace temp id with the real id when we can (single-task capture)
      if (context?.tempId) {
        if (result.taskIds.length === 1) {
          const realId = result.taskIds[0];
          queryClient.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
            (old ?? []).map((t) =>
              t.id === context.tempId ? { ...t, id: realId, _optimistic: false } : t
            )
          );
        } else {
          // If AI extracted multiple tasks, remove the placeholder and rely on refetch
          queryClient.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
            (old ?? []).filter((t) => t.id !== context.tempId)
          );
        }
      }

      // Invalidate tasks cache to sync full server data (AI fields, ordering)
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });

      console.log(
        `✅ AI Capture complete: ${result.taskCount} task(s), AI processed: ${result.aiProcessed}`
      );
    },
    onError: (error: any, _variables, context) => {
      // Roll back optimistic insert(s)
      if (context?.previousQueries?.length) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      } else if (context?.tempId) {
        queryClient.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
          (old ?? []).filter((t) => t.id !== context.tempId)
        );
      }

      console.error('❌ AI Capture mutation failed:', error);

      toast({
        title: "Capture failed",
        description: error.message || "Failed to capture your input. Please try again.",
        variant: "destructive",
      });
    },
    // IMPORTANT: No retry - the edge function persists on its own,
    // so retrying would create duplicate tasks
    retry: false,
  });
};

/**
 * Simplified hook that just exposes the capture function
 */
export const useCapture = () => {
  const mutation = useAICapture();
  
  return {
    capture: mutation.mutateAsync,
    isCapturing: mutation.isPending,
    error: mutation.error
  };
};
