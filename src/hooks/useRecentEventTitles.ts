import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RecentEventTitle {
  id: string;
  title: string;
  usage_count: number;
  last_used_at: string;
}

export const useRecentEventTitles = () => {
  const [recentTitles, setRecentTitles] = useState<RecentEventTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecentTitles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("recent_event_titles")
        .select("*")
        .eq("user_id", user.id)
        .order("usage_count", { ascending: false })
        .order("last_used_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentTitles(data || []);
    } catch (error) {
      console.error("Error fetching recent titles:", error);
    }
  }, []);

  useEffect(() => {
    fetchRecentTitles();
  }, [fetchRecentTitles]);

  const recordEventTitle = useCallback(async (title: string) => {
    if (!title.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if title already exists
      const { data: existing } = await supabase
        .from("recent_event_titles")
        .select("*")
        .eq("user_id", user.id)
        .eq("title", title)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from("recent_event_titles")
          .update({
            usage_count: existing.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase
          .from("recent_event_titles")
          .insert({
            user_id: user.id,
            title,
            usage_count: 1,
            last_used_at: new Date().toISOString(),
          });
      }

      // Refresh the list
      await fetchRecentTitles();
    } catch (error) {
      console.error("Error recording event title:", error);
    }
  }, [fetchRecentTitles]);

  const getSuggestions = useCallback((input: string): RecentEventTitle[] => {
    if (!input.trim()) return [];

    const searchTerm = input.toLowerCase();
    
    return recentTitles
      .filter(item => item.title.toLowerCase().includes(searchTerm))
      .slice(0, 5);
  }, [recentTitles]);

  return {
    recentTitles,
    loading,
    recordEventTitle,
    getSuggestions,
    refetch: fetchRecentTitles,
  };
};
