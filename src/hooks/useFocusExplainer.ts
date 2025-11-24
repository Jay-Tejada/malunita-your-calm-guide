import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FocusExplanation {
  explanation: string;
  metadata: {
    clusterLabel?: string;
    unlocksCount?: number;
    burnoutRisk: string;
    hasUpcomingStorm: boolean;
  };
}

export const useFocusExplainer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<FocusExplanation | null>(null);
  const { toast } = useToast();

  const generateExplanation = async (
    taskId: string,
    taskTitle: string,
    clusterLabel?: string,
    unlocksCount?: number
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('focus-explainer', {
        body: {
          taskId,
          taskTitle,
          clusterLabel,
          unlocksCount: unlocksCount || 0,
        },
      });

      if (error) throw error;

      setExplanation(data);
      return data;
    } catch (error) {
      console.error('Error generating focus explanation:', error);
      toast({
        title: 'Could not generate explanation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearExplanation = () => {
    setExplanation(null);
  };

  return {
    generateExplanation,
    clearExplanation,
    explanation,
    isLoading,
  };
};
