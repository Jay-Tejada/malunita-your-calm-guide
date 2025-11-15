import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SmartNotification {
  id: string;
  user_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  suggested_day?: string;
  suggested_time?: string;
  is_active: boolean;
  dismissed: boolean;
  created_from_week: string;
  created_at: string;
  updated_at: string;
}

export const useSmartNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['smart-notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('smart_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SmartNotification[];
    },
  });

  const dismissNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('smart_notifications')
        .update({ dismissed: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
      toast({
        title: "Notification dismissed",
        description: "You won't see this suggestion again",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deactivateNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('smart_notifications')
        .update({ is_active: false })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    notifications,
    isLoading,
    dismissNotification: dismissNotification.mutateAsync,
    deactivateNotification: deactivateNotification.mutateAsync,
  };
};
