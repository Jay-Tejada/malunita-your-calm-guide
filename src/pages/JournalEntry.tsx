import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2, X, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const JournalEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<number | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) setEntry(data);
      setLoading(false);
    };
    fetchEntry();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this entry?')) return;
    
    await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    navigate('/journal');
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxPhoto === null || !entry?.photos) return;
    
    if (direction === 'prev' && lightboxPhoto > 0) {
      setLightboxPhoto(lightboxPhoto - 1);
    } else if (direction === 'next' && lightboxPhoto < entry.photos.length - 1) {
      setLightboxPhoto(lightboxPhoto + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-foreground/40">Loading...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-foreground/40">Entry not found</p>
        <button 
          onClick={() => navigate('/journal')}
          className="text-sm text-foreground/50 hover:text-foreground/70"
        >
          Back to Journal
        </button>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-foreground/5 sticky top-0 bg-background z-10">
        <button onClick={() => navigate('/journal')} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-foreground/40" />
        </button>
        <span className="text-xs text-foreground/40">
          {format(new Date(entry.created_at), 'EEEE, MMMM d, yyyy')}
        </span>
        <button onClick={handleDelete} className="p-2 -mr-2 text-foreground/40 hover:text-red-400">
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {/* Photo gallery */}
      {entry.photos && entry.photos.length > 0 && (
        <div className={`grid gap-1 ${
          entry.photos.length === 1 ? 'grid-cols-1' :
          entry.photos.length === 2 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {entry.photos.map((photo: string, index: number) => (
            <button
              key={index}
              onClick={() => setLightboxPhoto(index)}
              className={`relative ${
                entry.photos.length === 1 ? 'aspect-video' : 'aspect-square'
              } overflow-hidden`}
            >
              <img 
                src={photo} 
                alt="" 
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
            </button>
          ))}
        </div>
      )}

      {/* Mood badge */}
      {entry.mood && (
        <div className="px-4 pt-4">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-foreground/5 rounded-full text-sm">
            {getMoodEmoji(entry.mood)}
            <span className="text-xs text-foreground/50 capitalize">{entry.mood}</span>
          </span>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {entry.title && (
          <h1 className="font-mono text-lg text-foreground/80 mb-3">
            {entry.title}
          </h1>
        )}
        <div className="font-mono text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
          {entry.content}
        </div>
      </div>

      {/* Metadata */}
      <div className="px-4 py-4 border-t border-foreground/5">
        <div className="flex items-center justify-between text-xs text-foreground/30">
          <span>{entry.content?.split(/\s+/).filter(Boolean).length || 0} words</span>
          <span>{format(new Date(entry.created_at), 'h:mm a')}</span>
        </div>
      </div>

      {/* Photo lightbox */}
      {lightboxPhoto !== null && entry.photos && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setLightboxPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>

          {entry.photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                disabled={lightboxPhoto === 0}
                className="absolute left-4 p-2 text-white/70 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                disabled={lightboxPhoto === entry.photos.length - 1}
                className="absolute right-4 p-2 text-white/70 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img 
            src={entry.photos[lightboxPhoto]} 
            alt="" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {entry.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white/70 text-sm">
              {lightboxPhoto + 1} / {entry.photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalEntry;
