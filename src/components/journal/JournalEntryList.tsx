import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JournalEntryCard } from "./JournalEntryCard";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  entry_type?: string;
  photos?: string[];
  mood?: string;
}

interface JournalEntryListProps {
  onEditEntry?: (entry: JournalEntry) => void;
}

export const JournalEntryList = ({ onEditEntry }: JournalEntryListProps) => {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/30 text-sm">Loading...</p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return null; // EmptyJournalState will show instead
  }

  return (
    <div>
      {entries.map((entry) => (
        <JournalEntryCard 
          key={entry.id} 
          entry={entry} 
          onEdit={onEditEntry}
        />
      ))}
    </div>
  );
};
