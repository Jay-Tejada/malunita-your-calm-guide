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
  mood?: string;
}

interface JournalEntryCardProps {
  entry: JournalEntry;
}

export const JournalEntryCard = ({ entry }: JournalEntryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasPhotos = entry.photos && entry.photos.length > 0;

  const EntryIcon = entry.entry_type === 'moment' ? Camera 
    : entry.entry_type === 'voice' ? Mic 
    : PenLine;

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'great': return '😊';
      case 'good': return '🙂';
      case 'okay': return '😐';
      case 'low': return '😔';
      case 'stressed': return '😰';
      case 'rough': return '😕';
      case 'bad': return '😢';
      default: return null;
    }
  };

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="py-4 border-b border-foreground/5 cursor-pointer hover:bg-muted/5 transition-colors"
    >
      {/* Photo grid - collapsed view */}
      {hasPhotos && !isExpanded && (
        <div className={`mb-3 grid gap-1 ${
          entry.photos!.length === 1 ? 'grid-cols-1' :
          entry.photos!.length === 2 ? 'grid-cols-2' :
          entry.photos!.length === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {entry.photos!.slice(0, 4).map((photo, index) => (
            <div 
              key={index} 
              className={`relative ${
                entry.photos!.length === 1 ? 'aspect-video' : 'aspect-square'
              }`}
            >
              <img 
                src={photo} 
                alt="" 
                className="w-full h-full object-cover rounded-lg"
              />
              {/* Show +N overlay on 4th photo if more exist */}
              {entry.photos!.length > 4 && index === 3 && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <span className="text-white font-mono text-sm">
                    +{entry.photos!.length - 4}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/40 mb-1">
            <EntryIcon className="w-3 h-3" />
            <span>{format(new Date(entry.created_at), "MMM d, yyyy")}</span>
          </div>
          
          {isExpanded ? (
            <div className="space-y-3">
              {/* Full photos in expanded view */}
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
              <div className="whitespace-pre-wrap text-sm text-foreground/70">
                <div className="font-medium mb-2">{entry.title}</div>
                {entry.content}
              </div>
            </div>
          ) : (
            <>
              {entry.title && (
                <p className="font-mono text-sm text-foreground/70 mb-1 truncate">
                  {entry.title}
                </p>
              )}
              {entry.content && (
                <p className="text-sm text-foreground/50 line-clamp-2">
                  {entry.content.slice(0, 150)}{entry.content.length > 150 ? '...' : ''}
                </p>
              )}
            </>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {entry.mood && (
            <span className="text-base">
              {getMoodEmoji(entry.mood)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
