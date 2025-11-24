import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to manage focus memory embeddings
 * Stores ONE-thing tasks as embeddings for semantic search
 */
export const useFocusMemory = () => {
  const { toast } = useToast();

  /**
   * Store a focus task embedding
   */
  const storeFocusMemory = async (
    taskText: string,
    clusterId?: string,
    unlocksCount?: number,
    taskId?: string,
    outcome?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('focus-memory-store', {
        body: {
          taskText,
          clusterId,
          unlocksCount,
          taskId,
          outcome,
        },
      });

      if (error) {
        console.error('Error storing focus memory:', error);
        return null;
      }

      console.log('✅ Focus memory stored:', data);
      return data;
    } catch (error) {
      console.error('Error in storeFocusMemory:', error);
      return null;
    }
  };

  /**
   * Query similar focus tasks
   */
  const querySimilarTasks = async (
    queryText: string,
    limit: number = 10,
    includePatterns: boolean = true
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('focus-memory-query', {
        body: {
          queryText,
          limit,
          includePatterns,
        },
      });

      if (error) {
        console.error('Error querying focus memory:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in querySimilarTasks:', error);
      return null;
    }
  };

  /**
   * Get emerging patterns from focus history
   */
  const getFocusPatterns = async (queryText: string) => {
    const result = await querySimilarTasks(queryText, 20, true);
    return result?.patterns || null;
  };

  return {
    storeFocusMemory,
    querySimilarTasks,
    getFocusPatterns,
  };
};
