import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Sparkles } from 'lucide-react';
import { startOfWeek, format } from 'date-fns';

export const QuestProgressNotification = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Subscribe to quest updates
    const channel = supabase
      .channel('quest-progress-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'weekly_quests',
          filter: `week_start=eq.${weekStart}`,
        },
        (payload) => {
          const quest = payload.new as any;
          const oldQuest = payload.old as any;

          // Quest just completed
          if (quest.completed && !oldQuest.completed) {
            toast({
              title: '🎉 Quest Completed!',
              description: (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>{quest.title}</span>
                </div>
              ),
            });
          }
          
          // Significant progress made (50% milestone)
          else if (
            !quest.completed &&
            oldQuest.current_value < quest.target_value / 2 &&
            quest.current_value >= quest.target_value / 2
          ) {
            toast({
              title: 'Halfway There! 🎯',
              description: `${quest.title}: ${quest.current_value}/${quest.target_value}`,
            });
          }

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['weekly-quests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, queryClient]);

  return null; // This is a notification-only component
};
