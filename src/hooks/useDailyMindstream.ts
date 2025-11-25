import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCognitiveLoad } from '@/state/cognitiveLoad';
import { useEmotionalMemory } from '@/state/emotionalMemory';

interface MindstreamData {
  oneThing: string | null;
  aiFocus: string | null;
  quickWins: Array<{ id: string; title: string }>;
  predictedHabits: Array<{ time: string; task: string; confidence: number }>;
  clusters: Array<{ label: string; tasks: string[]; theme: string }>;
  nudges: string[];
  summaryMarkdown: string | null;
  emotionalState: {
    joy: number;
    stress: number;
    affection: number;
    fatigue: number;
  };
  cognitiveLoad: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  isLoading: boolean;
}

export function useDailyMindstream(): MindstreamData {
  const [data, setData] = useState<Omit<MindstreamData, 'emotionalState' | 'cognitiveLoad' | 'isLoading'>>({
    oneThing: null,
    aiFocus: null,
    quickWins: [],
    predictedHabits: [],
    clusters: [],
    nudges: [],
    summaryMarkdown: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const cognitiveLoadState = useCognitiveLoad();
  const emotionalMemoryState = useEmotionalMemory();

  useEffect(() => {
    const fetchMindstreamData = async () => {
      setIsLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Call only the edge functions that work without specific user input
        const [
          commandCenterResult,
          suggestFocusResult,
          personalizationResult,
        ] = await Promise.allSettled([
          supabase.functions.invoke('daily-command-center', {
            body: { mode: 'home_screen' }
          }),
          supabase.functions.invoke('suggest-focus'),
          supabase.functions.invoke('personalization-agent').catch(() => ({ data: null })),
        ]);

        // Extract data from results
        const commandCenter = commandCenterResult.status === 'fulfilled' ? commandCenterResult.value.data : null;
        const suggestFocus = suggestFocusResult.status === 'fulfilled' ? suggestFocusResult.value.data : null;
        const personalization = personalizationResult.status === 'fulfilled' ? personalizationResult.value.data : null;

        setData({
          oneThing: commandCenter?.oneThing || null,
          aiFocus: suggestFocus?.focusTask || commandCenter?.focusMessage || null,
          quickWins: commandCenter?.quickWins || [],
          predictedHabits: [],
          clusters: [],
          nudges: [
            ...(personalization?.recommendations || []),
            ...(cognitiveLoadState.recommendations || []),
          ],
          summaryMarkdown: commandCenter?.dailySummary || null,
        });
      } catch (error) {
        console.error('Failed to fetch mindstream data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMindstreamData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchMindstreamData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    ...data,
    emotionalState: {
      joy: emotionalMemoryState.joy,
      stress: emotionalMemoryState.stress,
      affection: emotionalMemoryState.affection,
      fatigue: emotionalMemoryState.fatigue,
    },
    cognitiveLoad: {
      score: cognitiveLoadState.score,
      level: cognitiveLoadState.level,
    },
    isLoading,
  };
}
