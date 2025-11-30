import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserPattern {
  lastCheck: string;
  averageInterval: number;
  preferredViews: Record<string, number>;
}

export function usePredictiveLoad() {
  const queryClient = useQueryClient();
  const hour = new Date().getHours();
  
  useEffect(() => {
    const prefetchData = async () => {
      // Morning routine (6am - 9am)
      if (hour >= 6 && hour < 9) {
        // Preload daily plan
        queryClient.prefetchQuery({
          queryKey: ['daily-intelligence'],
          queryFn: async () => {
            const { data } = await supabase.functions.invoke('daily-command-center');
            return data;
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
        
        // Preload ONE thing suggestion
        queryClient.prefetchQuery({
          queryKey: ['focus-suggestion'],
          queryFn: async () => {
            const { data } = await supabase.functions.invoke('suggest-focus');
            return data;
          },
          staleTime: 5 * 60 * 1000,
        });
        
        // Preload today's tasks
        queryClient.prefetchQuery({
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
        });
      }
      
      // Midday check (12pm - 1pm)
      if (hour >= 12 && hour < 13) {
        // Preload quick wins (tiny tasks)
        queryClient.prefetchQuery({
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
          staleTime: 5 * 60 * 1000,
        });
        
        // Preload focus reflection if user has set ONE thing
        queryClient.prefetchQuery({
          queryKey: ['focus-reflection'],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_focus', true)
              .eq('focus_date', today)
              .single();
            return data;
          },
          staleTime: 10 * 60 * 1000,
        });
      }
      
      // Evening routine (6pm - 9pm)
      if (hour >= 18 && hour < 21) {
        // Preload journal entries
        queryClient.prefetchQuery({
          queryKey: ['memory-journal', 'today'],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
              .from('memory_journal')
              .select('*')
              .eq('user_id', user.id)
              .eq('date', today)
              .order('created_at', { ascending: false });
            return data || [];
          },
          staleTime: 5 * 60 * 1000,
        });
        
        // Preload daily wrap-up data
        queryClient.prefetchQuery({
          queryKey: ['runway-review'],
          queryFn: async () => {
            const { data } = await supabase.functions.invoke('runway-review');
            return data;
          },
          staleTime: 10 * 60 * 1000,
        });
        
        // Preload completed tasks for the day
        queryClient.prefetchQuery({
          queryKey: ['tasks', 'completed-today'],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { data } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', user.id)
              .eq('completed', true)
              .gte('completed_at', today.toISOString())
              .order('completed_at', { ascending: false });
            return data || [];
          },
          staleTime: 5 * 60 * 1000,
        });
      }
      
      // User activity patterns - check inbox
      const patterns = getStoredPatterns();
      if (patterns?.lastCheck) {
        const lastCheck = new Date(patterns.lastCheck);
        const hoursSince = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60);
        
        // If user typically checks every 3 hours or hasn't checked in 4 hours
        if (hoursSince >= Math.min(patterns.averageInterval || 3, 4)) {
          queryClient.prefetchQuery({
            queryKey: ['tasks', { category: 'inbox', completed: false }],
            queryFn: async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return [];
              
              const { data } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('completed', false)
                .or('category.eq.inbox,category.is.null')
                .order('created_at', { ascending: false });
              return data || [];
            },
            staleTime: 5 * 60 * 1000,
          });
        }
      }
    };
    
    prefetchData();
  }, [hour, queryClient]);
  
  // Preload on user actions
  const preloadRelated = useCallback((currentView: string) => {
    // Track view navigation
    trackViewNavigation(currentView);
    
    switch (currentView) {
      case 'home':
        // If on home, preload inbox (likely next view)
        queryClient.prefetchQuery({
          queryKey: ['tasks', { category: 'inbox' }],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const { data } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', user.id)
              .or('category.eq.inbox,category.is.null')
              .order('created_at', { ascending: false });
            return data || [];
          },
          staleTime: 2 * 60 * 1000,
        });
        
        // Preload companion state
        queryClient.prefetchQuery({
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
          staleTime: 10 * 60 * 1000,
        });
        break;
        
      case 'inbox':
        // If in inbox, preload custom categories
        queryClient.prefetchQuery({
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
          staleTime: 10 * 60 * 1000,
        });
        
        // Preload AI suggestions for categorization
        queryClient.prefetchQuery({
          queryKey: ['ai-corrections'],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const { data } = await supabase
              .from('ai_corrections')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(20);
            return data || [];
          },
          staleTime: 15 * 60 * 1000,
        });
        break;
        
      case 'today':
      case 'tasks':
        // If viewing today, preload upcoming tasks
        queryClient.prefetchQuery({
          queryKey: ['tasks', { scheduled_bucket: 'upcoming' }],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const { data } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', user.id)
              .eq('completed', false)
              .eq('scheduled_bucket', 'upcoming')
              .order('created_at', { ascending: false });
            return data || [];
          },
          staleTime: 5 * 60 * 1000,
        });
        
        // Preload task clusters
        queryClient.prefetchQuery({
          queryKey: ['knowledge-clusters'],
          queryFn: async () => {
            const { data } = await supabase.functions.invoke('cluster-tasks');
            return data;
          },
          staleTime: 10 * 60 * 1000,
        });
        break;
        
      case 'journal':
        // Preload recent journal entries
        queryClient.prefetchQuery({
          queryKey: ['memory-journal', 'recent'],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const { data } = await supabase
              .from('memory_journal')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(30);
            return data || [];
          },
          staleTime: 5 * 60 * 1000,
        });
        break;
        
      case 'trends':
        // Preload insights data
        queryClient.prefetchQuery({
          queryKey: ['habit-logs'],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const { data } = await supabase
              .from('habit_logs')
              .select('*')
              .eq('user_id', user.id)
              .order('completed_at', { ascending: false })
              .limit(100);
            return data || [];
          },
          staleTime: 10 * 60 * 1000,
        });
        break;
    }
  }, [queryClient]);
  
  return { preloadRelated };
}

// Helper functions for pattern tracking
function getStoredPatterns(): UserPattern | null {
  try {
    const stored = localStorage.getItem('user-navigation-patterns');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function trackViewNavigation(view: string) {
  try {
    const patterns = getStoredPatterns() || {
      lastCheck: new Date().toISOString(),
      averageInterval: 3,
      preferredViews: {},
    };
    
    // Update last check time for inbox
    if (view === 'inbox') {
      const now = new Date();
      const lastCheck = patterns.lastCheck ? new Date(patterns.lastCheck) : now;
      const hoursSince = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
      
      // Update average interval (exponential moving average)
      if (hoursSince > 0.5) { // Only count if more than 30 mins
        patterns.averageInterval = patterns.averageInterval 
          ? (patterns.averageInterval * 0.7 + hoursSince * 0.3)
          : hoursSince;
      }
      
      patterns.lastCheck = now.toISOString();
    }
    
    // Track view preferences
    patterns.preferredViews[view] = (patterns.preferredViews[view] || 0) + 1;
    
    localStorage.setItem('user-navigation-patterns', JSON.stringify(patterns));
  } catch (error) {
    console.warn('Failed to track navigation pattern:', error);
  }
}
