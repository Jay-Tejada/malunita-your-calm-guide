import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch multiple dashboard queries at once
 * More efficient than sequential fetches
 */
export function useDashboardData() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['tasks', { completed: false, scheduled_bucket: 'today' }],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          
          const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('completed', false)
            .eq('scheduled_bucket', 'today')
            .order('created_at', { ascending: false });
          
          return data || [];
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      },
      {
        queryKey: ['focus-suggestion'],
        queryFn: async () => {
          const { data } = await supabase.functions.invoke('suggest-focus');
          return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
      {
        queryKey: ['tasks', { is_tiny_task: true, completed: false }],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          
          const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_tiny_task', true)
            .eq('completed', false)
            .limit(10);
          
          return data || [];
        },
        staleTime: 3 * 60 * 1000, // 3 minutes
      },
      {
        queryKey: ['inbox-count'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return 0;
          
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('completed', false)
            .or('category.eq.inbox,category.is.null');
          
          return count || 0;
        },
        staleTime: 1 * 60 * 1000, // 1 minute
      }
    ]
  });
  
  return {
    todayTasks: queries[0].data || [],
    isLoadingTodayTasks: queries[0].isLoading,
    
    oneThing: queries[1].data,
    isLoadingOneThing: queries[1].isLoading,
    
    quickWins: queries[2].data || [],
    isLoadingQuickWins: queries[2].isLoading,
    
    inboxCount: queries[3].data || 0,
    isLoadingInboxCount: queries[3].isLoading,
    
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  };
}

/**
 * Fetch profile and companion data together
 */
export function useProfileData() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['profile'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      },
      {
        queryKey: ['focus-streak'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return null;
          
          const { data } = await supabase
            .from('focus_streaks')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        queryKey: ['custom-categories'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          
          const { data } = await supabase
            .from('custom_categories')
            .select('*')
            .eq('user_id', user.id)
            .order('display_order', { ascending: true });
          
          return data || [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      }
    ]
  });
  
  return {
    profile: queries[0].data,
    isLoadingProfile: queries[0].isLoading,
    
    focusStreak: queries[1].data,
    isLoadingFocusStreak: queries[1].isLoading,
    
    categories: queries[2].data || [],
    isLoadingCategories: queries[2].isLoading,
    
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  };
}
