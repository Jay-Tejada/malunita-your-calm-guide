import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdmin = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-check'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { isAdmin: false };
      }

      // TODO: legacy reference, removed in consolidation
      // const { data, error } = await supabase.functions.invoke('check-admin', {
      //   headers: {
      //     Authorization: `Bearer ${session.access_token}`
      //   }
      // });
      const data = { isAdmin: false };
      const error = null;

      if (error) {
        console.error('Error checking admin status:', error);
        return { isAdmin: false };
      }

      return data;
    },
    retry: false,
  });

  return {
    isAdmin: data?.isAdmin || false,
    isLoading,
  };
};
