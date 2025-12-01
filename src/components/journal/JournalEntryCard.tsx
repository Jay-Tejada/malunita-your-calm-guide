import { formatDistanceToNow } from "date-fns";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface JournalEntryCardProps {
  entry: JournalEntry;
}

export const JournalEntryCard = ({ entry }: JournalEntryCardProps) => {
  return (
    <div className="p-4 border border-foreground/10 rounded-lg hover:border-foreground/20 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-mono text-foreground/80">{entry.title}</h3>
        <span className="text-[10px] text-muted-foreground/30 uppercase tracking-widest">
          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-foreground/60 whitespace-pre-wrap line-clamp-3">
        {entry.content}
      </p>
    </div>
  );
};
