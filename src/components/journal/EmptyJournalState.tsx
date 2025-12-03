import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const EmptyJournalState = () => {
  const { data: entries } = useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
  });

  // Only show if there are no entries
  if (!entries || entries.length > 0) return null;

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground/30 text-sm font-mono tracking-wide">
        Your journal awaits
      </p>
    </div>
  );
};
