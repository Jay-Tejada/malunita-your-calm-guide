import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CaptureSession {
  id: string;
  user_id: string;
  created_at: string;
  raw_text: string;
  summary: string | null;
  task_ids: string[];
  intent_tags: string[];
}

export const useCaptureSessions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['capture-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capture_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as CaptureSession[];
    },
  });

  const createSession = useMutation({
    mutationFn: async (session: {
      raw_text: string;
      summary: string | null;
      task_ids: string[];
      intent_tags: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('capture_sessions')
        .insert({
          user_id: user.id,
          raw_text: session.raw_text,
          summary: session.summary,
          task_ids: session.task_ids,
          intent_tags: session.intent_tags,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capture-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to save capture session:', error);
      toast({
        title: 'Error',
        description: 'Failed to save capture session',
        variant: 'destructive',
      });
    },
  });

  return {
    sessions,
    isLoading,
    createSession: createSession.mutate,
    lastSession: sessions?.[0] || null,
  };
};
