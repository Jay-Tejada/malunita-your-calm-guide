import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanningBreakdownResult {
  extracted_goals: string[];
  subtasks: string[];
  missing_info: string[];
  blockers: string[];
  recommended_first_step: string;
  confidence: number;
}

export const usePlanningBreakdown = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanningBreakdownResult | null>(null);

  const runPlanningBreakdown = async (text: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('planning-breakdown', {
        body: { text }
      });

      if (invokeError) {
        setError(invokeError.message || 'Failed to generate breakdown');
        return { data: null, error: invokeError };
      }

      setResult(data);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    runPlanningBreakdown,
    loading,
    error,
    result,
  };
};
