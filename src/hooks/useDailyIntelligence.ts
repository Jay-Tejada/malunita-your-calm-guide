import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DailyIntelligenceData {
  headline: string | null;
  primary_focus: string | null;
  quick_wins: Array<{ id: string; title: string }>;
  summary_markdown: string | null;
  focus_message: string | null;
}

interface UseDailyIntelligenceReturn {
  data: DailyIntelligenceData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const getStorageKey = () => {
  const today = new Date().toISOString().split('T')[0];
  return `malunita_daily_intel_${today}`;
};

const getCachedData = (): DailyIntelligenceData | null => {
  try {
    const key = getStorageKey();
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to parse cached daily intelligence:', error);
  }
  return null;
};

const setCachedData = (data: DailyIntelligenceData) => {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(data));
    
    // Clean up old cache entries
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('malunita_daily_intel_') && key !== getStorageKey()) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to cache daily intelligence:', error);
  }
};

export function useDailyIntelligence(): UseDailyIntelligenceReturn {
  const [data, setData] = useState<DailyIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for cached data first
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // DEPRECATED: daily-command-center deleted in Phase 3C
      // TODO: Replace with suggest-focus for daily intelligence
      // const { data: responseData, error: functionError } = await supabase.functions.invoke(
      //   'daily-command-center',
      //   { body: { mode: 'home_screen' } }
      // );
      // if (functionError) { throw functionError; }
      const responseData = null; // Fallback to local data

      const intelligenceData: DailyIntelligenceData = {
        headline: responseData?.headline || null,
        primary_focus: responseData?.primary_focus || responseData?.oneThing || null,
        quick_wins: responseData?.quick_wins || responseData?.quickWins || [],
        summary_markdown: responseData?.summary_markdown || responseData?.dailySummary || null,
        focus_message: responseData?.focus_message || responseData?.focusMessage || null,
      };

      setData(intelligenceData);
      setCachedData(intelligenceData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch daily intelligence');
      setError(error);
      console.error('Error fetching daily intelligence:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch at midnight (new day)
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      fetchData();
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [fetchData]);

  // Listen for task changes
  useEffect(() => {
    const handleTaskCreated = () => fetchData();
    const handleTaskUpdated = () => fetchData();

    window.addEventListener("task:created", handleTaskCreated);
    window.addEventListener("task:updated", handleTaskUpdated);

    return () => {
      window.removeEventListener("task:created", handleTaskCreated);
      window.removeEventListener("task:updated", handleTaskUpdated);
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
