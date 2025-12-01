import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { JournalEditor } from './JournalEditor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface JournalEntryData {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const SimpleJournal = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntryData | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch journal entries
  const { data: entries, isLoading, error, refetch } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as JournalEntryData[];
    },
  });

  // Save entry mutation
  const saveEntry = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (selectedEntry) {
        // Update existing
        const { error } = await supabase
          .from('journal_entries')
          .update({ title, content, updated_at: new Date().toISOString() })
          .eq('id', selectedEntry.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            title,
            content,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setIsEditorOpen(false);
      setSelectedEntry(undefined);
      toast({
        title: "Saved",
        description: "Your journal entry has been saved.",
      });
    },
    onError: (error: any) => {
      console.error('Failed to save entry:', error);
      toast({
        title: "Error",
        description: "Failed to save entry.",
        variant: "destructive",
      });
    },
  });

  const handleNewEntry = () => {
    setSelectedEntry(undefined);
    setIsEditorOpen(true);
  };

  const handleEditEntry = (entry: JournalEntryData) => {
    setSelectedEntry(entry);
    setIsEditorOpen(true);
  };

  const handleSave = (data: { title: string; content: string }) => {
    saveEntry.mutate(data);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedEntry(undefined);
  };

  // Group entries by date
  const groupedEntries = entries?.reduce((acc, entry) => {
    const date = format(parseISO(entry.created_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntryData[]>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading journal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Failed to load journal entries</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-8 mt-8">
        {/* New Entry button - subtle top right */}
        <div className="flex justify-end">
          <Button
            onClick={handleNewEntry}
            variant="ghost"
            className="gap-2 text-foreground/40 hover:text-foreground/60"
          >
            <Plus className="w-4 h-4" />
            New entry
          </Button>
        </div>

        {/* Entries List */}
        {Object.keys(groupedEntries).length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <p className="text-muted-foreground/40 text-sm">No entries yet</p>
            <Button
              onClick={handleNewEntry}
              variant="ghost"
              className="text-foreground/40 hover:text-foreground/60"
            >
              Start writing
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date}>
                {dateEntries.map((entry) => (
                  <motion.button
                    key={entry.id}
                    onClick={() => handleEditEntry(entry)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors group"
                    whileTap={{ scale: 0.995 }}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/80 truncate group-hover:text-foreground">
                          {entry.title}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-muted-foreground/60 font-mono">
                        {format(parseISO(entry.created_at), 'MMM d')}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <JournalEditor
            entry={selectedEntry}
            onSave={handleSave}
            onClose={handleCloseEditor}
          />
        )}
      </AnimatePresence>
    </>
  );
};
