import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface Task {
  id: string;
  title: string;
  category?: string;
  reminder_time?: string;
  is_tiny_task?: boolean;
  created_at: string;
}

interface InboxAnalysis {
  overdue: Task[];
  urgent: Task[];
  tiny_tasks: Task[];
  themes: string[];
  task_count: number;
  energy_estimate: 'low' | 'medium' | 'high';
  top_focus: Task | null;
  pattern: string | null;
}

export interface MorningInsight {
  top_three: Task[];
  focus: Task | null;
  energy: 'low' | 'medium' | 'high';
  tiny_wins: Task[];
  pattern: string | null;
}

export interface NightInsight {
  completed_count: number;
  remaining_count: number;
  themes: string[];
  pattern: string | null;
  tomorrow_focus: Task | null;
}

export function useRitualInsights() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeInbox = async (): Promise<InboxAnalysis | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-inbox');
      if (fnError) throw fnError;
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getMorningInsight = async (): Promise<MorningInsight | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const analysis = await analyzeInbox();
    if (!analysis) return null;

    const insight: MorningInsight = {
      top_three: [
        analysis.top_focus,
        ...analysis.urgent.slice(0, 2)
      ].filter(Boolean).slice(0, 3) as Task[],
      focus: analysis.top_focus,
      energy: analysis.energy_estimate,
      tiny_wins: analysis.tiny_tasks.slice(0, 5),
      pattern: analysis.pattern
    };

    // Save to ritual history - use array for insert
    await supabase.from('ritual_history').insert([{
      user_id: user.id,
      type: 'morning' as const,
      payload: JSON.parse(JSON.stringify(insight)) as Json
    }]);

    return insight;
  };

  const getNightInsight = async (): Promise<NightInsight | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get today's completed tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: completed } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('completed_at', today.toISOString());

    const analysis = await analyzeInbox();

    const insight: NightInsight = {
      completed_count: completed?.length || 0,
      remaining_count: analysis?.task_count || 0,
      themes: analysis?.themes || [],
      pattern: analysis?.pattern || null,
      tomorrow_focus: analysis?.top_focus || null
    };

    // Save to ritual history
    await supabase.from('ritual_history').insert([{
      user_id: user.id,
      type: 'night' as const,
      payload: JSON.parse(JSON.stringify(insight)) as Json
    }]);

    return insight;
  };

  return {
    analyzeInbox,
    getMorningInsight,
    getNightInsight,
    loading,
    error
  };
}
