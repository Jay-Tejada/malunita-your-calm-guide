import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";

interface Note {
  id: string;
  text: string;
  response: string;
  timestamp: Date;
}

interface RecentNotesProps {
  notes: Note[];
  onDelete?: (id: string) => void;
}

export const RecentNotes = ({ notes, onDelete }: RecentNotesProps) => {
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  if (notes.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Recent Notes</h2>
        <p className="text-muted-foreground text-center py-8">No notes yet. Tap the microphone to start.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Recent Notes</h2>
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-card rounded-xl p-4 border border-secondary hover:border-accent transition-colors group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted-foreground">{formatTime(note.timestamp)}</span>
                {onDelete && (
                  <button
                    onClick={() => onDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-foreground mb-2">{note.text}</p>
              <div className="pt-2 border-t border-secondary/50">
                <p className="text-xs text-muted-foreground italic">{note.response}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
