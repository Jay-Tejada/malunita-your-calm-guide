import { useState, useEffect } from "react";

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get token from environment variables
    const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    if (envToken) {
      setToken(envToken);
      setLoading(false);
      return;
    }

    // For production, you might want to fetch from edge function
    // that has access to secrets
    setLoading(false);
  }, []);

  return { token, loading };
};
