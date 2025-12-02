import { useState, useRef } from 'react';
import { X, Camera, Sparkles, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface AddMomentProps {
  onClose: () => void;
}

const AddMoment = ({ onClose }: AddMomentProps) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
      generateCaption();
    };
    reader.readAsDataURL(file);
  };

  const generateCaption = () => {
    setGenerating(true);
    // Simple auto-caption based on time of day
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    const captions = [
      `A ${timeOfDay} moment worth remembering.`,
      `${date} — captured.`,
      `This ${timeOfDay}, this feeling.`,
      `A slice of today.`,
    ];
    
    setTimeout(() => {
      setCaption(captions[Math.floor(Math.random() * captions.length)]);
      setGenerating(false);
    }, 800);
  };

  const handleSave = async () => {
    if (!caption.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get first line as title
    const title = caption.split('\n')[0].slice(0, 100) || "Moment";

    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title,
        content: caption,
        entry_type: 'moment',
      });

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <button onClick={onClose} className="p-2 -ml-2 text-foreground/40">
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs text-foreground/40 uppercase tracking-widest">
          Add Moment
        </span>
        <button
          onClick={handleSave}
          disabled={!caption.trim() || saving}
          className="p-2 -mr-2 text-foreground/70 disabled:opacity-30"
        >
          <Check className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Photo area */}
        {!photo ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm aspect-square rounded-2xl border-2 border-dashed border-foreground/10 flex flex-col items-center justify-center gap-3 hover:border-foreground/20 transition-colors"
          >
            <Camera className="w-10 h-10 text-foreground/20" />
            <span className="text-sm text-foreground/40">Tap to add photo</span>
          </button>
        ) : (
          <div className="w-full max-w-sm">
            <img 
              src={photo} 
              alt="Moment" 
              className="w-full aspect-square object-cover rounded-2xl mb-4"
            />
            
            {/* AI caption */}
            {generating ? (
              <div className="flex items-center gap-2 text-foreground/40">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Generating caption...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500/50 mt-1 flex-shrink-0" />
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    className="flex-1 bg-transparent font-mono text-sm text-foreground/70 placeholder:text-foreground/30 resize-none focus:outline-none"
                    rows={2}
                  />
                </div>
                <p className="text-[10px] text-foreground/30 pl-6">
                  AI suggested • edit if you'd like
                </p>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />
      </div>

      {/* Change photo button */}
      {photo && (
        <div className="px-4 py-4 border-t border-foreground/5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 text-sm text-foreground/40 hover:text-foreground/60"
          >
            Change photo
          </button>
        </div>
      )}
    </div>
  );
};

export default AddMoment;
