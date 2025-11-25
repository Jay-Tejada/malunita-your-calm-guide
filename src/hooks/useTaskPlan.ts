import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Phase {
  title: string;
  description: string;
  tasks: Array<{
    id: string;
    title: string;
    tiny: boolean;
    priority: 'must' | 'should' | 'could';
    reason: string;
  }>;
}

interface Plan {
  phases: Phase[];
  dependencies: any[];
  quick_wins: any[];
  blockers: any[];
  summary: string;
}

interface Chapter {
  chapter_title: string;
  chapter_summary: string;
  steps: Array<{
    id: string;
    title: string;
    reason: string;
    tiny?: boolean;
    priority?: 'must' | 'should' | 'could';
  }>;
}

interface Quest {
  quest_title: string;
  quest_summary: string;
  chapters: Chapter[];
  motivation_boost: string;
}

export function useTaskPlan() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentQuest, setCurrentQuest] = useState<Quest | null>(null);
  const { toast } = useToast();

  const buildPlan = async (): Promise<Plan | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('task-to-plan', {
        body: {}
      });

      if (error) {
        console.error('Error building plan:', error);
        throw error;
      }

      return data?.plan || null;
    } catch (error) {
      console.error('Failed to build plan:', error);
      toast({
        title: "Failed to build plan",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
      return null;
    }
  };

  const buildQuest = async (plan: Plan): Promise<Quest | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('quest-wrapper', {
        body: { plan }
      });

      if (error) {
        console.error('Error building quest:', error);
        throw error;
      }

      return data as Quest;
    } catch (error) {
      console.error('Failed to build quest:', error);
      toast({
        title: "Failed to create quest",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
      return null;
    }
  };

  const buildFullQuest = async () => {
    setIsLoading(true);
    try {
      // Step 1: Build the plan
      const plan = await buildPlan();
      if (!plan) {
        setIsLoading(false);
        return;
      }

      // Step 2: Wrap into quest
      const quest = await buildQuest(plan);
      if (!quest) {
        setIsLoading(false);
        return;
      }

      // Step 3: Display the quest
      setCurrentQuest(quest);
      setIsPanelOpen(true);
      
      toast({
        title: "Quest ready!",
        description: `${quest.chapters.length} chapters generated`
      });
    } catch (error) {
      console.error('Failed to build full quest:', error);
      toast({
        title: "Failed to create quest",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPanel = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);

  return {
    isLoading,
    isPanelOpen,
    currentQuest,
    buildPlan,
    buildQuest,
    buildFullQuest,
    openPanel,
    closePanel
  };
}
