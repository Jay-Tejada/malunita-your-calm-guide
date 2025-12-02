import { useMemo } from 'react';
import { useTasks } from './useTasks';
import { useThoughts } from './useThoughts';
import { useDebouncedValue } from './useDebounce';

export interface SearchResult {
  id: string;
  type: 'task' | 'thought' | 'journal';
  title: string;
  subtitle?: string;
  date: string;
  completed?: boolean;
}

export const useSearch = (query: string) => {
  const { tasks } = useTasks();
  const debouncedQuery = useDebouncedValue(query, 300);
  const { thoughts } = useThoughts();
  // Add journal entries if you have them

  const results = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) return [];

    const q = debouncedQuery.toLowerCase();
    const matches: SearchResult[] = [];

    // Search tasks
    tasks?.forEach(task => {
      if (task.title.toLowerCase().includes(q)) {
        matches.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: task.category || task.scheduled_bucket || 'inbox',
          date: task.created_at,
          completed: task.completed
        });
      }
    });

    // Search thoughts
    thoughts?.forEach(thought => {
      if (thought.content.toLowerCase().includes(q)) {
        matches.push({
          id: thought.id,
          type: 'thought',
          title: thought.content.slice(0, 100) + (thought.content.length > 100 ? '...' : ''),
          subtitle: 'thought',
          date: thought.created_at
        });
      }
    });

    // Sort by date (newest first)
    return matches.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [debouncedQuery, tasks, thoughts]);

  return { results };
};
