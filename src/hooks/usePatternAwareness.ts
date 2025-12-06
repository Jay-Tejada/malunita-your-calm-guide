import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PatternStats {
  completed_last_14_days: number;
  tiny_tasks_completed: number;
  morning_rituals: number;
  night_rituals: number;
  top_category: string | null;
  most_productive_day: string | null;
  active_task_count: number;
}

export interface PatternResult {
  has_patterns: boolean;
  observation: string | null;
  trend: 'improving' | 'steady' | 'declining' | 'unclear';
  stats: PatternStats;
}

export function usePatternAwareness() {
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectPatterns = useCallback(async (): Promise<PatternResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('detect-patterns');
      if (error) throw error;
      setPattern(data);
      return data;
    } catch (e: any) {
      console.error('Pattern detection error:', e);
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { pattern, detectPatterns, loading, error };
}
