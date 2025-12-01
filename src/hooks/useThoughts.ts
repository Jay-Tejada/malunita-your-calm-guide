import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Thought {
  id: string;
  content: string;
  tags: string[] | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export const useThoughts = () => {
  const queryClient = useQueryClient();

  const { data: thoughts, isLoading } = useQuery({
    queryKey: ['thoughts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Thought[];
    }
  });

  const addThought = useMutation({
    mutationFn: async ({ content, source = 'manual' }: { content: string; source?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          user_id: user.id,
          content,
          source
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    }
  });

  const deleteThought = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    }
  });

  const convertToTask = useMutation({
    mutationFn: async (thought: Thought) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create task from thought
      await supabase.from('tasks').insert({
        user_id: user.id,
        title: thought.content,
        category: 'inbox'
      });

      // Delete the thought
      await supabase.from('thoughts').delete().eq('id', thought.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return {
    thoughts,
    isLoading,
    addThought: addThought.mutate,
    deleteThought: deleteThought.mutate,
    convertToTask: convertToTask.mutate,
  };
};
