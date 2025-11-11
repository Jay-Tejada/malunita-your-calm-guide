import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  context?: string;
  category?: string;
  completed: boolean;
  completed_at?: string;
  has_reminder: boolean;
  has_person_name: boolean;
  is_time_based: boolean;
  keywords?: string[];
  input_method: 'voice' | 'text';
  is_focus: boolean;
  focus_date?: string;
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  const createTasks = useMutation({
    mutationFn: async (tasks: Array<Omit<Partial<Task>, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { title: string }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tasksWithUser = tasks.map(task => ({
        ...task,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksWithUser)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Tasks saved",
        description: `${data.length} task${data.length > 1 ? 's' : ''} created successfully.`,
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

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task deleted",
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
    tasks,
    isLoading,
    createTasks: createTasks.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
  };
};
