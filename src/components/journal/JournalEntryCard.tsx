import { format } from "date-fns";
import { useState } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false);

  // Get first line of content for preview
  const firstLine = entry.content.split('\n')[0];
  const preview = firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="py-4 border-b border-foreground/5 cursor-pointer hover:bg-muted/5 transition-colors"
    >
      <div className="text-xs text-muted-foreground/40 mb-1">
        {format(new Date(entry.created_at), "MMM d, yyyy")}
      </div>
      <div className="text-sm text-foreground/70">
        {isExpanded ? (
          <div className="whitespace-pre-wrap">
            <div className="font-medium mb-2">{entry.title}</div>
            {entry.content}
          </div>
        ) : (
          preview
        )}
      </div>
    </div>
  );
};
