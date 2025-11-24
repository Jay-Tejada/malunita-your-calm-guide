import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) throw error;
        
        if (data?.token) {
          setToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, loading };
};
