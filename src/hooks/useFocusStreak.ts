import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface FocusStreak {
  current_streak: number;
  longest_streak: number;
  last_updated_date: string;
}

export const useFocusStreak = () => {
  const [streak, setStreak] = useState<FocusStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('focus_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStreak({
          current_streak: data.current_streak,
          longest_streak: data.longest_streak,
          last_updated_date: data.last_updated_date,
        });
      } else {
        // Initialize streak record if it doesn't exist
        const { data: newStreak, error: insertError } = await supabase
          .from('focus_streaks')
          .insert({
            user_id: user.id,
            current_streak: 0,
            longest_streak: 0,
            last_updated_date: format(new Date(), 'yyyy-MM-dd'),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setStreak({
          current_streak: newStreak.current_streak,
          longest_streak: newStreak.longest_streak,
          last_updated_date: newStreak.last_updated_date,
        });
      }
    } catch (error) {
      console.error('Error fetching focus streak:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStreak = async (outcome: 'done' | 'partial' | 'missed', date: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current streak
      const { data: currentData } = await supabase
        .from('focus_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let newCurrentStreak = 0;
      let newLongestStreak = currentData?.longest_streak || 0;

      if (outcome === 'done') {
        // Increment streak if completed
        newCurrentStreak = (currentData?.current_streak || 0) + 1;
        
        // Update longest streak if needed
        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }
      } else {
        // Reset streak for partial or missed
        newCurrentStreak = 0;
      }

      // Update or insert streak record
      const { error } = await supabase
        .from('focus_streaks')
        .upsert({
          user_id: user.id,
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_updated_date: date,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Update local state
      setStreak({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_updated_date: date,
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating focus streak:', error);
      return { error };
    }
  };

  return {
    streak,
    isLoading,
    updateStreak,
    refetch: fetchStreak,
  };
};
