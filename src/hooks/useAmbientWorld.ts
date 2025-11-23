import { useProfile } from "./useProfile";
import { useLevelSystem } from "@/state/levelSystem";
import { WorldId, getUnlockedWorlds, isWorldUnlocked } from "@/features/ambientWorlds/worldDefinitions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const useAmbientWorld = () => {
  const { profile } = useProfile();
  const { level } = useLevelSystem();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentWorld = ((profile as any)?.selected_ambient_world as WorldId) || 'cozy-room';
  const unlockedWorlds = getUnlockedWorlds(level);

  const setWorld = async (worldId: WorldId) => {
    if (!isWorldUnlocked(worldId, level)) {
      toast({
        title: "World Locked",
        description: "You need to reach a higher level to unlock this world.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_ambient_world: worldId })
        .eq('id', profile?.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast({
        title: "World Changed",
        description: "Your ambient world has been updated!",
      });
    } catch (error) {
      console.error('Error updating ambient world:', error);
      toast({
        title: "Error",
        description: "Failed to change ambient world.",
        variant: "destructive",
      });
    }
  };

  return {
    currentWorld,
    unlockedWorlds,
    setWorld,
    level,
  };
};
