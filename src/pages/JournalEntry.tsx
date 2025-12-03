import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2, X, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { MiniOrb } from '@/components/journal/MiniOrb';

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
        <p className="text-xs uppercase tracking-widest text-foreground/30 font-mono">Loading...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-xs uppercase tracking-widest text-foreground/30 font-mono">Entry not found</p>
        <button 
          onClick={() => navigate('/journal')}
          className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
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
      {/* Navigation bar */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <button onClick={() => navigate('/journal')} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-foreground/30" />
        </button>
        <button onClick={handleDelete} className="p-2 -mr-2 text-foreground/30 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      {/* Main content area */}
      <div className="max-w-2xl mx-auto px-6 md:px-12">
        {/* Header */}
        <header className="pt-8 md:pt-12 mb-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/40 font-mono mb-3">
            {format(new Date(entry.created_at), 'MMMM d, yyyy')}
          </p>
          {entry.title && (
            <h1 className="text-xl font-light text-foreground/70 tracking-wide">
              {entry.title}
            </h1>
          )}
          {entry.mood && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/40">
                {getMoodEmoji(entry.mood)}
                <span className="capitalize">{entry.mood}</span>
              </span>
            </div>
          )}
        </header>

        {/* Writing surface with optional guide line */}
        <div className="border-l border-foreground/[0.03] pl-6">
          {/* Content */}
          <article className="text-foreground/70 leading-relaxed font-mono text-sm whitespace-pre-wrap">
            {entry.content?.split('\n\n').map((paragraph: string, index: number) => (
              <p 
                key={index} 
                className={`mb-6 ${index === 0 ? 'first-letter:text-lg first-letter:font-medium' : ''}`}
              >
                {paragraph}
              </p>
            ))}
          </article>

          {/* Photo gallery */}
          {entry.photos && entry.photos.length > 0 && (
            <div className={`mt-10 grid gap-3 ${
              entry.photos.length === 1 ? 'grid-cols-1' :
              'grid-cols-2'
            }`}>
              {entry.photos.map((photo: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setLightboxPhoto(index)}
                  className={`relative overflow-hidden rounded-lg ${
                    entry.photos.length === 1 ? 'aspect-video' : 'aspect-square'
                  }`}
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
        </div>

        {/* Footer metadata */}
        <footer className="mt-16 mb-24 pt-6 border-t border-foreground/5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-foreground/20 font-mono">
            <span>{entry.content?.split(/\s+/).filter(Boolean).length || 0} words</span>
            <span>{format(new Date(entry.created_at), 'h:mm a')}</span>
          </div>
        </footer>
      </div>

      {/* Mini orb companion */}
      <MiniOrb />

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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white/70 text-sm font-mono">
              {lightboxPhoto + 1} / {entry.photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalEntry;
