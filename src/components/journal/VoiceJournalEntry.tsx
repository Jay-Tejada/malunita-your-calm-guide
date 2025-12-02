import { useState, useEffect } from 'react';
import { X, Mic, MicOff, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { startVoiceInput, stopVoiceInput, isVoiceInputSupported } from '@/utils/voiceInput';

interface VoiceJournalEntryProps {
  onClose: () => void;
}

const VoiceJournalEntry = ({ onClose }: VoiceJournalEntryProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsSupported(isVoiceInputSupported());
  }, []);

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopVoiceInput();
      setIsRecording(false);
    } else {
      startVoiceInput({
        onTranscript: (text) => {
          setTranscript(prev => prev + (prev ? ' ' : '') + text);
        },
        onListeningChange: (listening) => {
          setIsRecording(listening);
        },
        silenceTimeout: 3000,
      });
      setIsRecording(true);
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get first line as title
    const title = transcript.split('\n')[0].slice(0, 100) || "Voice Note";

    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title,
        content: transcript.trim(),
        entry_type: 'voice',
      });

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      onClose();
    }
    setSaving(false);
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
          <button onClick={onClose} className="p-2 -ml-2 text-foreground/40">
            <X className="w-5 h-5" />
          </button>
          <span className="text-xs text-foreground/40 uppercase tracking-widest">
            Voice Note
          </span>
          <div className="w-9" />
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <MicOff className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-foreground/50">Voice input not supported in this browser</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <button onClick={onClose} className="p-2 -ml-2 text-foreground/40">
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs text-foreground/40 uppercase tracking-widest">
          Voice Note
        </span>
        <button
          onClick={handleSave}
          disabled={!transcript.trim() || saving}
          className="p-2 -mr-2 text-foreground/70 disabled:opacity-30"
        >
          <Check className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Recording button */}
        <button
          onClick={handleVoiceToggle}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-red-500/20 animate-pulse' 
              : 'bg-foreground/5 hover:bg-foreground/10'
          }`}
        >
          {isRecording ? (
            <MicOff className="w-10 h-10 text-red-500" />
          ) : (
            <Mic className="w-10 h-10 text-foreground/40" />
          )}
        </button>

        <p className="text-sm text-foreground/40">
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>

        {/* Transcript */}
        {transcript && (
          <div className="w-full max-w-md mt-4">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500/50 mt-1 flex-shrink-0" />
              <span className="text-xs text-foreground/40">Transcribed</span>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full bg-foreground/5 rounded-lg p-4 font-mono text-sm text-foreground/70 placeholder:text-foreground/30 resize-none focus:outline-none min-h-[120px]"
              rows={4}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceJournalEntry;
