import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cacheInvalidation } from '@/lib/cache/invalidation';
import { useToast } from '@/hooks/use-toast';

interface NewTask {
  title: string;
  category?: string;
  user_id: string;
  [key: string]: any;
}

interface UpdateTask {
  id: string;
  updates: Record<string, any>;
}

/**
 * Hook for optimistic task updates
 * Shows changes immediately in UI while saving to server
 */
export function useOptimisticTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  /**
   * Create task with optimistic update
   */
  const createTask = useMutation({
    mutationFn: async (task: NewTask) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    // Optimistic update - show immediately
    onMutate: async (newTask) => {
      // Cancel ongoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot previous value for rollback
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically update cache with temporary ID
      queryClient.setQueryData(['tasks'], (old: any) => {
        const tempTask = {
          ...newTask,
          id: 'temp-' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          completed: false,
        };
        
        if (Array.isArray(old)) {
          return [tempTask, ...old];
        }
        return [tempTask];
      });
      
      return { previousTasks };
    },
    
    // On error, rollback to previous state
    onError: (err, newTask, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      
      toast({
        title: "Failed to create task",
        description: "Please try again",
        variant: "destructive"
      });
    },
    
    // On success, replace temp with real data
    onSuccess: (data) => {
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (Array.isArray(old)) {
          return old.map((task: any) => 
            task.id.toString().startsWith('temp-') ? data : task
          );
        }
        return [data];
      });
      
      cacheInvalidation.onTaskCreated(queryClient);
    }
  });
  
  /**
   * Update task with optimistic update
   */
  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: UpdateTask) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically update
      cacheInvalidation.onTaskUpdated(queryClient, id, updates);
      
      return { previousTasks };
    },
    
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      
      toast({
        title: "Failed to update task",
        description: "Please try again",
        variant: "destructive"
      });
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
  
  /**
   * Delete task with optimistic update
   */
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      return taskId;
    },
    
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically remove
      cacheInvalidation.onTaskDeleted(queryClient, taskId);
      
      return { previousTasks };
    },
    
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      
      toast({
        title: "Failed to delete task",
        description: "Please try again",
        variant: "destructive"
      });
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
  
  /**
   * Complete task with optimistic update
   */
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      // TODO: Add useOrbTriggers().onTaskComplete() here
      return data;
    },
    
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically complete
      cacheInvalidation.onTaskCompleted(queryClient, taskId);
      
      return { previousTasks };
    },
    
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      
      toast({
        title: "Failed to complete task",
        description: "Please try again",
        variant: "destructive"
      });
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
  
  return {
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
}
