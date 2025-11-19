import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PersonalityType = 'zen' | 'spark' | 'cosmo';

export interface CompanionIdentity {
  name: string | null;
  personalityType: PersonalityType;
  colorway: string;
  stage: number;
  xp: number;
}

export const useCompanionIdentity = () => {
  const [companion, setCompanion] = useState<CompanionIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanionIdentity();
  }, []);

  const fetchCompanionIdentity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('companion_name, companion_personality_type, companion_colorway, companion_stage, companion_xp')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setCompanion({
        name: data.companion_name,
        personalityType: (data.companion_personality_type || 'zen') as PersonalityType,
        colorway: data.companion_colorway || 'zen-default',
        stage: data.companion_stage || 1,
        xp: data.companion_xp || 0,
      });
    } catch (error) {
      console.error('Error fetching companion identity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompanion = async (updates: Partial<CompanionIdentity>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.companion_name = updates.name;
      if (updates.personalityType !== undefined) dbUpdates.companion_personality_type = updates.personalityType;
      if (updates.colorway !== undefined) dbUpdates.companion_colorway = updates.colorway;
      if (updates.stage !== undefined) dbUpdates.companion_stage = updates.stage;
      if (updates.xp !== undefined) dbUpdates.companion_xp = updates.xp;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (error) throw error;

      setCompanion(prev => prev ? { ...prev, ...updates } : null);

      toast({
        title: "Companion updated",
        description: "Your companion's identity has been saved.",
      });
    } catch (error) {
      console.error('Error updating companion:', error);
      toast({
        title: "Error",
        description: "Failed to update companion identity.",
        variant: "destructive",
      });
    }
  };

  const needsOnboarding = companion !== null && !companion.name;

  return {
    companion,
    isLoading,
    updateCompanion,
    needsOnboarding,
    refetch: fetchCompanionIdentity,
  };
};
