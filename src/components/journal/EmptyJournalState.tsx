import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NewEntryDialog } from "./NewEntryDialog";

export const EmptyJournalState = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
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
    <>
      <div className="text-center py-12">
        <p className="text-muted-foreground/30 mb-4">No entries yet</p>
        <button
          onClick={() => setIsEditorOpen(true)}
          className="border border-foreground/15 text-foreground/40 hover:text-foreground/60 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Start writing
        </button>
      </div>

      {isEditorOpen && (
        <NewEntryDialog
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </>
  );
};
