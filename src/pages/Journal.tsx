import { useState, useEffect } from "react";
import { Plus, PenLine, Camera, Mic, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { JournalEntryList } from "@/components/journal/JournalEntryList";
import { EmptyJournalState } from "@/components/journal/EmptyJournalState";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import AddMoment from "@/components/journal/AddMoment";
import VoiceJournalEntry from "@/components/journal/VoiceJournalEntry";
import { supabase } from "@/integrations/supabase/client";

type EntryMode = 'writer' | 'moment' | 'voice';

interface Suggestion {
  type: string;
  title: string;
  prompt: string;
  prefill: string;
  sessionId?: string;
}

export default function Journal() {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>('writer');
  const [prefillContent, setPrefillContent] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

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
    setShowNewEntry(true);
    setShowNewMenu(false);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    handleOpenEntry('writer', suggestion.prefill);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Journal" />
      
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
        <JournalEntryList />
        <EmptyJournalState />
      </div>

      {/* FAB with menu */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Menu options */}
        {showNewMenu && (
          <div className="absolute bottom-16 right-0 bg-background border border-foreground/5 rounded-lg shadow-md py-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => handleOpenEntry('writer')}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground/60 hover:text-foreground/90 hover:bg-foreground/[0.03] flex items-center gap-3 transition-colors"
            >
              <PenLine className="w-4 h-4 text-foreground/40" />
              Write Entry
            </button>
            <button
              onClick={() => handleOpenEntry('moment')}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground/60 hover:text-foreground/90 hover:bg-foreground/[0.03] flex items-center gap-3 transition-colors"
            >
              <Camera className="w-4 h-4 text-foreground/40" />
              Add Moment
            </button>
            <button
              onClick={() => handleOpenEntry('voice')}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground/60 hover:text-foreground/90 hover:bg-foreground/[0.03] flex items-center gap-3 transition-colors"
            >
              <Mic className="w-4 h-4 text-foreground/40" />
              Voice Note
            </button>
          </div>
        )}

        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #fffbf0, #fef3e2, #fde9c9)',
            boxShadow: '0 10px 25px -5px rgba(200, 170, 120, 0.15), 0 8px 10px -6px rgba(200, 170, 120, 0.1)'
          }}
        >
          <Plus className={`w-6 h-6 text-foreground/40 transition-transform duration-200 ${showNewMenu ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Click outside to close menu */}
      {showNewMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowNewMenu(false)} 
        />
      )}

      {/* Entry dialogs */}
      {showNewEntry && entryMode === 'writer' && (
        <NewEntryDialog
          isOpen={showNewEntry}
          onClose={() => {
            setShowNewEntry(false);
            setPrefillContent('');
          }}
          prefillContent={prefillContent}
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
