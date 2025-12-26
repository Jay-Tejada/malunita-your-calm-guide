import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrbStore } from "@/state/orbState";

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
    onSuccess: async (result) => {
      // Invalidate tasks cache to show new tasks
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      console.log(`✅ AI Capture complete: ${result.taskCount} task(s), AI processed: ${result.aiProcessed}`);
    },
    onError: (error: any) => {
      console.error('❌ AI Capture mutation failed:', error);
      
      toast({
        title: "Capture failed",
        description: error.message || "Failed to capture your input. Please try again.",
        variant: "destructive",
      });
    },
    retry: 1,
    retryDelay: 500,
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
