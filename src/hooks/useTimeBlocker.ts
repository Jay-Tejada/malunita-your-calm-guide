import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TimeBlock {
  start_time: string;
  end_time: string;
  label: string;
  tasks: { id: string; title: string }[];
}

export const useTimeBlocker = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);

  const generateTimeBlocks = async (date: string = new Date().toISOString().split('T')[0]) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('time-blocker', {
        body: { user_id: user.id, date }
      });

      if (error) throw error;

      setBlocks(data.blocks || []);
      toast.success('Day plan generated!');
    } catch (error) {
      console.error('Error generating time blocks:', error);
      toast.error('Failed to generate day plan');
      setBlocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    blocks,
    isLoading,
    generateTimeBlocks
  };
};
