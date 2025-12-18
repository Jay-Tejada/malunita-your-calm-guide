import { useState, useEffect } from "react";
import { Plus, PenLine, Camera, Mic, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { JournalEntryList } from "@/components/journal/JournalEntryList";
import { EmptyJournalState } from "@/components/journal/EmptyJournalState";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import AddMoment from "@/components/journal/AddMoment";
import VoiceJournalEntry from "@/components/journal/VoiceJournalEntry";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";


type EntryMode = 'writer' | 'moment' | 'voice';

interface Suggestion {
  type: string;
  title: string;
  prompt: string;
  prefill: string;
  sessionId?: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  photos?: string[];
}

export default function Journal() {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>('writer');
  const [prefillContent, setPrefillContent] = useState('');
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasEntries, setHasEntries] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSuggestions: Suggestion[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check completed tasks today
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('id, title, category, completed_at')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', today.toISOString());

      if (completedTasks && completedTasks.length >= 5) {
        newSuggestions.push({
          type: 'productivity',
          title: `You completed ${completedTasks.length} tasks today`,
          prompt: 'Want to reflect on what made today productive?',
          prefill: `Today I got ${completedTasks.length} things done. `,
        });
      }

      // Check for category milestones
      if (completedTasks) {
        const categoryCounts: Record<string, number> = {};
        completedTasks.forEach(t => {
          if (t.category && t.category !== 'inbox') {
            categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
          }
        });
        
        Object.entries(categoryCounts).forEach(([category, count]) => {
          if (count >= 3) {
            newSuggestions.push({
              type: 'milestone',
              title: `Big progress on ${category}`,
              prompt: `You knocked out ${count} ${category} tasks. Document this win?`,
              prefill: `Made solid progress on ${category} today. `,
            });
          }
        });
      }

      // Check for flow sessions completed
      const { data: flowSessions } = await supabase
        .from('flow_sessions')
        .select('id, title, tasks_completed, reflection')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('ended_at', today.toISOString())
        .is('reflection', null);

      if (flowSessions && flowSessions.length > 0) {
        flowSessions.forEach(session => {
          newSuggestions.push({
            type: 'flow_session',
            title: `${session.title} completed`,
            prompt: 'Add a reflection on your focus session?',
            prefill: `Finished a ${session.title} session. `,
            sessionId: session.id,
          });
        });
      }

      setSuggestions(newSuggestions.slice(0, 3));
    };

    fetchSuggestions();
  }, []);

  const handleOpenEntry = (mode: EntryMode, prefill = '') => {
    setEntryMode(mode);
    setPrefillContent(prefill);
    setEditEntry(null);
    setShowNewEntry(true);
    setShowNewMenu(false);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEntryMode('writer');
    setEditEntry(entry);
    setPrefillContent('');
    setShowNewEntry(true);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    handleOpenEntry('writer', suggestion.prefill);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Journal"
        rightAction={
          <DropdownMenu open={showNewMenu} onOpenChange={setShowNewMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="New journal entry"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => handleOpenEntry('writer')}
                className="font-mono text-sm cursor-pointer"
              >
                <PenLine className="mr-2 h-4 w-4" />
                Write Entry
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenEntry('moment')}
                className="font-mono text-sm cursor-pointer"
              >
                <Camera className="mr-2 h-4 w-4" />
                Add Moment
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenEntry('voice')}
                className="font-mono text-sm cursor-pointer"
              >
                <Mic className="mr-2 h-4 w-4" />
                Voice Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Suggestions section */}
      {suggestions.length > 0 && (
        <div className="px-4 py-3 border-b border-foreground/5">
          <p className="text-[10px] uppercase tracking-widest text-foreground/30 mb-2">
            Suggested Entries
          </p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full p-3 bg-foreground/[0.02] hover:bg-foreground/[0.04] border border-foreground/5 rounded-lg text-left transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500/50 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground/70">{suggestion.title}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">{suggestion.prompt}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        <JournalEntryList onEditEntry={handleEditEntry} onHasEntries={setHasEntries} />
        {hasEntries === false && <EmptyJournalState />}
      </div>

      {/* Entry dialogs */}
      {showNewEntry && entryMode === 'writer' && (
        <NewEntryDialog
          isOpen={showNewEntry}
          onClose={() => {
            setShowNewEntry(false);
            setPrefillContent('');
            setEditEntry(null);
          }}
          prefillContent={prefillContent}
          editEntry={editEntry}
        />
      )}

      {showNewEntry && entryMode === 'moment' && (
        <AddMoment onClose={() => setShowNewEntry(false)} />
      )}

      {showNewEntry && entryMode === 'voice' && (
        <VoiceJournalEntry onClose={() => setShowNewEntry(false)} />
      )}
    </div>
  );
}
