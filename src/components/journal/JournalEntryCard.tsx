import { useState } from "react";
import { format, isValid, isToday, isYesterday } from "date-fns";
import { Camera, PenLine, Mic } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

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
  onEdit?: (entry: JournalEntry) => void;
}

export const JournalEntryCard = ({ entry, onEdit }: JournalEntryCardProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const hasPhotos = entry.photos && entry.photos.length > 0;

  const EntryIcon = entry.entry_type === 'moment' ? Camera 
    : entry.entry_type === 'voice' ? Mic 
    : PenLine;

  // Smart date formatting
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return "No date";
      if (isToday(date)) return "Today";
      if (isYesterday(date)) return "Yesterday";
      return format(date, "MMM d, yyyy");
    } catch {
      return "No date";
    }
  };

  // Get content preview, skipping first line if it matches title
  const getPreview = () => {
    if (!entry.content) return null;
    
    const lines = entry.content.split('\n').filter(line => line.trim());
    const firstLine = lines[0]?.trim();
    
    // If first line matches title, skip it
    if (firstLine && entry.title && firstLine.toLowerCase() === entry.title.toLowerCase()) {
      const remainingContent = lines.slice(1).join(' ').trim();
      return remainingContent || null;
    }
    
    return entry.content.trim();
  };

  const preview = getPreview();

  const handleClick = () => {
    if (onEdit) {
      onEdit(entry);
    }
  };

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setLightboxIndex(index);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="py-5 border-b border-foreground/5 cursor-pointer hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Date with icon */}
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground/40 font-mono">
              <EntryIcon className="w-3 h-3" />
              <span>{formatDate(entry.created_at)}</span>
            </div>
            
            {/* Title */}
            {entry.title && (
              <h3 className="text-base font-medium text-foreground/70 mt-1.5 line-clamp-1">
                {entry.title}
              </h3>
            )}
            
            {/* Preview */}
            {preview && (
              <p className="text-sm text-muted-foreground/40 mt-1 line-clamp-2">
                {preview}
              </p>
            )}

            {/* Photo grid */}
            {hasPhotos && (
              <div className={`mt-3 grid gap-1.5 ${
                entry.photos!.length === 1 ? 'grid-cols-1 max-w-[200px]' : 'grid-cols-2 max-w-[300px]'
              }`}>
                {entry.photos!.slice(0, 4).map((photo, index) => (
                  <div 
                    key={index} 
                    className={`relative ${
                      entry.photos!.length === 1 ? 'aspect-video' : 'aspect-square'
                    }`}
                    onClick={(e) => handleImageClick(e, index)}
                  >
                    <img 
                      src={photo} 
                      alt="" 
                      className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
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
          </div>
          
          {/* Thumbnail on right if single image and no content preview */}
          {hasPhotos && entry.photos!.length === 1 && !preview && (
            <div className="flex-shrink-0">
              <img 
                src={entry.photos![0]} 
                alt="" 
                className="w-10 h-10 rounded object-cover"
                onClick={(e) => handleImageClick(e, 0)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && entry.photos && (
        <ImageLightbox
          images={entry.photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
};
