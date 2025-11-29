import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "./useTasks";

/**
 * Optimized React Query hook for fetching tasks
 * - Caches tasks per user to prevent unnecessary refetches
 * - Automatically refetches when user changes
 * - Integrates with React Query devtools for debugging
 */
export const useTasksQuery = () => {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity, // User data rarely changes during session
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', user?.id], // Cache key includes userId for proper isolation
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Tasks fetched from database (${data.length} tasks)`);
      return data as Task[];
    },
    enabled: !!user, // Only run query when user is authenticated
  });

  return {
    tasks: tasksQuery.data,
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
  };
};
