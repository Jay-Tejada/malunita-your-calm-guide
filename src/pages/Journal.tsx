import { useState } from "react";
import { Plus, PenLine, Camera, Mic } from "lucide-react";
import { PageHeader } from "@/components/journal/PageHeader";
import { JournalEntryList } from "@/components/journal/JournalEntryList";
import { EmptyJournalState } from "@/components/journal/EmptyJournalState";
import { NewEntryDialog } from "@/components/journal/NewEntryDialog";
import AddMoment from "@/components/journal/AddMoment";
import VoiceJournalEntry from "@/components/journal/VoiceJournalEntry";

type EntryMode = 'writer' | 'moment' | 'voice';

export default function Journal() {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryMode, setEntryMode] = useState<EntryMode>('writer');

  const handleOpenEntry = (mode: EntryMode) => {
    setEntryMode(mode);
    setShowNewEntry(true);
    setShowNewMenu(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Journal" />
      
      <div className="px-4 pt-4">
        <JournalEntryList />
        <EmptyJournalState />
      </div>

      {/* FAB with menu */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Menu options */}
        {showNewMenu && (
          <div className="absolute bottom-16 right-0 bg-background border border-foreground/10 rounded-lg shadow-xl py-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => handleOpenEntry('writer')}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground/70 hover:bg-foreground/5 flex items-center gap-3"
            >
              <PenLine className="w-4 h-4 text-foreground/40" />
              Write Entry
            </button>
            <button
              onClick={() => handleOpenEntry('moment')}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground/70 hover:bg-foreground/5 flex items-center gap-3"
            >
              <Camera className="w-4 h-4 text-foreground/40" />
              Add Moment
            </button>
            <button
              onClick={() => handleOpenEntry('voice')}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground/70 hover:bg-foreground/5 flex items-center gap-3"
            >
              <Mic className="w-4 h-4 text-foreground/40" />
              Voice Note
            </button>
          </div>
        )}

        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        >
          <Plus className={`w-6 h-6 text-amber-700/70 transition-transform duration-200 ${showNewMenu ? 'rotate-45' : ''}`} />
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
          onClose={() => setShowNewEntry(false)}
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
