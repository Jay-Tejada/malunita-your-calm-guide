import { QueryClient } from '@tanstack/react-query';

/**
 * Smart cache invalidation strategies
 * Minimizes redundant refetches by only invalidating what changed
 */
export const cacheInvalidation = {
  /**
   * When task is created - invalidate related queries
   */
  onTaskCreated: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['daily-intelligence'] });
    queryClient.invalidateQueries({ queryKey: ['focus-suggestion'] });
    queryClient.invalidateQueries({ queryKey: ['inbox-tasks'] });
  },
  
  /**
   * When task is completed - optimistically update + invalidate
   */
  onTaskCompleted: (queryClient: QueryClient, taskId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['quick-wins'] });
    queryClient.invalidateQueries({ queryKey: ['daily-intelligence'] });
    
    // Optimistically update cache - instant UI feedback
    queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.map((task: any) => 
          task.id === taskId ? { ...task, completed: true, completed_at: new Date().toISOString() } : task
        );
      }
      return old;
    });
  },
  
  /**
   * When task is updated - optimistically update + invalidate
   */
  onTaskUpdated: (queryClient: QueryClient, taskId: string, updates: any) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    
    // Optimistically update cache
    queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.map((task: any) => 
          task.id === taskId ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
        );
      }
      return old;
    });
  },
  
  /**
   * When task is deleted - optimistically remove + invalidate
   */
  onTaskDeleted: (queryClient: QueryClient, taskId: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['daily-intelligence'] });
    
    // Optimistically remove from cache - instant UI feedback
    queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
      if (!old) return old;
      if (Array.isArray(old)) {
        return old.filter((task: any) => task.id !== taskId);
      }
      return old;
    });
  },
  
  /**
   * When journal entry is created
   */
  onJournalCreated: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['memory-journal'] });
    queryClient.invalidateQueries({ queryKey: ['runway-review'] });
    queryClient.invalidateQueries({ queryKey: ['daily-wrap-up'] });
  },
  
  /**
   * When profile is updated
   */
  onProfileUpdated: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['companion'] });
  },
  
  /**
   * When category is created or updated
   */
  onCategoryChanged: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['custom-categories'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
  
  /**
   * Clear all cache (use sparingly)
   */
  clearAll: (queryClient: QueryClient) => {
    queryClient.clear();
  }
};
