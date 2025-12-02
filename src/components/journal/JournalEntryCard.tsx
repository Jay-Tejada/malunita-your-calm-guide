import { format } from "date-fns";
import { useState } from "react";
import { Camera, PenLine, Mic } from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  entry_type?: string;
  photos?: string[];
}

interface JournalEntryCardProps {
  entry: JournalEntry;
}

export const JournalEntryCard = ({ entry }: JournalEntryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get first line of content for preview
  const firstLine = entry.content.split('\n')[0];
  const preview = firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;

  const hasPhotos = entry.photos && entry.photos.length > 0;

  const EntryIcon = entry.entry_type === 'moment' ? Camera 
    : entry.entry_type === 'voice' ? Mic 
    : PenLine;

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="py-4 border-b border-foreground/5 cursor-pointer hover:bg-muted/5 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground/40 mb-1">
        <EntryIcon className="w-3 h-3" />
        <span>{format(new Date(entry.created_at), "MMM d, yyyy")}</span>
      </div>
      
      {/* Photo thumbnail for moments */}
      {hasPhotos && !isExpanded && (
        <div className="mb-2">
          <img 
            src={entry.photos![0]} 
            alt="" 
            className="w-16 h-16 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="text-sm text-foreground/70">
        {isExpanded ? (
          <div className="space-y-3">
            {/* Full photos */}
            {hasPhotos && (
              <div className="flex flex-wrap gap-2">
                {entry.photos!.map((photo, idx) => (
                  <img 
                    key={idx}
                    src={photo} 
                    alt="" 
                    className="w-full max-w-xs aspect-square object-cover rounded-xl"
                  />
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap">
              <div className="font-medium mb-2">{entry.title}</div>
              {entry.content}
            </div>
          </div>
        ) : (
          preview
        )}
      </div>
    </div>
  );
};
