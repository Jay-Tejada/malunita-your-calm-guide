import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DailySession {
  id: string;
  user_id: string;
  date: string;
  top_focus?: string;
  priority_two?: string;
  priority_three?: string;
  deep_work_blocks?: Array<{ start: string; end: string; description: string }>;
  idea_dump_raw?: string;
  idea_dump_processed?: any[];
  reflection_wins?: string;
  reflection_improve?: string;
  reflection_gratitude?: string;
  tomorrow_focus?: string;
  created_at: string;
  updated_at: string;
}

export const useDailySessions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today's session
  const { data: todaySession, isLoading } = useQuery({
    queryKey: ['daily-session-today'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data as DailySession | null;
    },
  });

  // Get all sessions (for history)
  const { data: sessions, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['daily-sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as DailySession[];
    },
  });

  const createSession = useMutation({
    mutationFn: async (sessionData: Partial<DailySession>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_sessions')
        .insert({
          user_id: user.id,
          date: today,
          ...sessionData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-session-today'] });
      queryClient.invalidateQueries({ queryKey: ['daily-sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DailySession> }) => {
      const { data, error } = await supabase
        .from('daily_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-session-today'] });
      queryClient.invalidateQueries({ queryKey: ['daily-sessions'] });
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
    todaySession,
    sessions,
    isLoading,
    isLoadingHistory,
    createSession: createSession.mutateAsync,
    updateSession: updateSession.mutateAsync,
  };
};
