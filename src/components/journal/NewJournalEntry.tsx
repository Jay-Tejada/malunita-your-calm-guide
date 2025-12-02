import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Image, Plus, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadJournalPhoto } from '@/utils/uploadJournalPhoto';
import { useQueryClient } from '@tanstack/react-query';

const TEMPLATES = {
  free: {
    name: 'Free Write',
    prompt: '',
    placeholder: 'Start writing...',
  },
  gratitude: {
    name: 'Gratitude',
    prompt: 'What are three things you\'re grateful for today?',
    placeholder: '1. \n2. \n3. ',
  },
  reflection: {
    name: 'Daily Reflection',
    prompt: 'How did today go? What worked, what didn\'t?',
    placeholder: 'Today was...',
  },
  goals: {
    name: 'Goals',
    prompt: 'What do you want to accomplish?',
    placeholder: 'I want to...',
  },
};

const DAILY_PROMPTS = [
  'What\'s on your mind right now?',
  'What made you smile today?',
  'What\'s something you learned recently?',
  'What are you looking forward to?',
  'What challenge did you overcome?',
  'What would make tomorrow great?',
  'What\'s something you\'re proud of?',
  'What do you need to let go of?',
  'What are you curious about?',
  'How are you taking care of yourself?',
];

const MOODS = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😔', label: 'Low' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
];

interface NewJournalEntryProps {
  onClose: () => void;
  prefillContent?: string;
}

const NewJournalEntry = ({ onClose, prefillContent }: NewJournalEntryProps) => {
  const [template, setTemplate] = useState<keyof typeof TEMPLATES>('free');
  const [content, setContent] = useState(prefillContent || '');
  const [mood, setMood] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Get daily prompt
  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    setDailyPrompt(DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length]);
  }, []);

  // Set prefill content when it changes
  useEffect(() => {
    if (prefillContent) {
      setContent(prefillContent);
    }
  }, [prefillContent]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploadingPhotos(false);
      return;
    }

    const uploadPromises = Array.from(files).map(file => 
      uploadJournalPhoto(file, user.id)
    );

    const uploadedUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedUrls.filter((url): url is string => url !== null);

    setPhotos(prev => [...prev, ...validUrls]);
    setUploadingPhotos(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim() && photos.length === 0) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const title = content.trim().split('\n')[0].slice(0, 100) || 'Untitled';

    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title,
        content: content.trim(),
        photos,
        entry_type: 'writer',
      });

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      onClose();
    }
    setSaving(false);
  };

  const currentTemplate = TEMPLATES[template];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <button onClick={onClose} className="p-2 -ml-2 text-foreground/40">
          <X className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-foreground/50 hover:text-foreground/70"
        >
          {currentTemplate.name}
          <ChevronDown className="w-3 h-3" />
        </button>
        
        <button
          onClick={handleSave}
          disabled={(!content.trim() && photos.length === 0) || saving}
          className="px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground disabled:opacity-30"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      {/* Template dropdown */}
      {showTemplates && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-background border border-foreground/10 rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
          {Object.entries(TEMPLATES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {
                setTemplate(key as keyof typeof TEMPLATES);
                setShowTemplates(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-foreground/5 ${
                template === key ? 'text-foreground/70' : 'text-foreground/50'
              }`}
            >
              {value.name}
            </button>
          ))}
        </div>
      )}

      {/* Photos preview */}
      {(photos.length > 0 || uploadingPhotos) && (
        <div className="px-4 py-3 border-b border-foreground/5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img 
                  src={photo} 
                  alt="" 
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            
            {uploadingPhotos && (
              <div className="w-20 h-20 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground/50 rounded-full animate-spin" />
              </div>
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border border-dashed border-foreground/20 flex items-center justify-center flex-shrink-0 hover:border-foreground/30 transition-colors"
            >
              <Plus className="w-5 h-5 text-foreground/30" />
            </button>
          </div>
        </div>
      )}

      {/* Prompt / inspiration */}
      {(currentTemplate.prompt || template === 'free') && (
        <div className="px-4 py-3 border-b border-foreground/5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500/50 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/50 italic">
              {currentTemplate.prompt || dailyPrompt}
            </p>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 px-4 py-4 overflow-auto">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={currentTemplate.placeholder}
          autoFocus
          className="w-full h-full bg-transparent font-mono text-foreground/70 placeholder:text-foreground/30 resize-none focus:outline-none leading-relaxed"
        />
      </div>

      {/* Bottom toolbar */}
      <div className="px-4 py-3 border-t border-foreground/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-foreground/40 hover:text-foreground/60 hover:bg-foreground/5 rounded-lg transition-colors"
            >
              <Image className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all ${
                    mood === m.value 
                      ? 'bg-foreground/10 scale-110' 
                      : 'hover:bg-foreground/5 opacity-40 hover:opacity-100'
                  }`}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {photos.length > 0 && (
              <span className="text-xs text-foreground/30">
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs text-foreground/30">
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoSelect}
        className="hidden"
      />
    </div>
  );
};

export default NewJournalEntry;
