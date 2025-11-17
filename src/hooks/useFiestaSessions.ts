import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FiestaSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  tasks_included: string[];
  tasks_completed: string[];
  completion_rate?: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export const useFiestaSessions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['fiesta-sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tiny_task_fiesta_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as FiestaSession[];
    },
  });

  const { data: activeSession } = useQuery({
    queryKey: ['active-fiesta-session'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tiny_task_fiesta_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as FiestaSession | null;
    },
  });

  const createSession = useMutation({
    mutationFn: async (params: { tasks_included: string[]; duration_minutes: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tiny_task_fiesta_sessions')
        .insert({
          user_id: user.id,
          tasks_included: params.tasks_included,
          duration_minutes: params.duration_minutes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FiestaSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiesta-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-fiesta-session'] });
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
    mutationFn: async (params: { id: string; updates: Partial<FiestaSession> }) => {
      const { data, error } = await supabase
        .from('tiny_task_fiesta_sessions')
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiesta-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-fiesta-session'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const endSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const session = sessions?.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');

      const completionRate = session.tasks_included.length > 0
        ? (session.tasks_completed.length / session.tasks_included.length) * 100
        : 0;

      const { data, error } = await supabase
        .from('tiny_task_fiesta_sessions')
        .update({
          ended_at: new Date().toISOString(),
          completion_rate: completionRate,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiesta-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-fiesta-session'] });
      toast({
        title: "Fiesta Complete!",
        description: "Great job clearing those tiny tasks!",
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
    sessions,
    activeSession,
    isLoading,
    createSession: createSession.mutateAsync,
    updateSession: updateSession.mutateAsync,
    endSession: endSession.mutateAsync,
  };
};
