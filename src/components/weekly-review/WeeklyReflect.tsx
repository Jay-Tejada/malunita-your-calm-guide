import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, ChevronRight, Loader2 } from 'lucide-react';
import { startVoiceInput, stopVoiceInput, isVoiceInputSupported } from '@/utils/voiceInput';

interface WeeklyReflectProps {
  onComplete: (reflections: { wentWell: string; feltOff: string }) => void;
  onSkip: () => void;
  isSaving?: boolean;
}

const WeeklyReflect = ({ onComplete, onSkip, isSaving = false }: WeeklyReflectProps) => {
  const [wentWell, setWentWell] = useState('');
  const [feltOff, setFeltOff] = useState('');
  const [activeVoice, setActiveVoice] = useState<'wentWell' | 'feltOff' | null>(null);
  const voiceSupported = isVoiceInputSupported();

  const handleVoiceToggle = (field: 'wentWell' | 'feltOff') => {
    if (activeVoice === field) {
      stopVoiceInput();
      setActiveVoice(null);
    } else {
      if (activeVoice) {
        stopVoiceInput();
      }
      setActiveVoice(field);
      startVoiceInput({
        onTranscript: (text) => {
          if (field === 'wentWell') {
            setWentWell((prev) => (prev ? prev + ' ' : '') + text);
          } else {
            setFeltOff((prev) => (prev ? prev + ' ' : '') + text);
          }
        },
        onListeningChange: (listening) => {
          if (!listening) {
            setActiveVoice(null);
          }
        },
        silenceTimeout: 8000,
      });
    }
  };

  const handleSubmit = () => {
    onComplete({ wentWell: wentWell.trim(), feltOff: feltOff.trim() });
  };

  const hasAnyInput = wentWell.trim() || feltOff.trim();

  return (
    <div className="space-y-4">
      <p className="text-xs text-foreground/50 text-center">
        Quick reflections help course-correct. Skip if preferred.
      </p>

      {/* Went Well */}
      <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
        <label className="block text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
          What went well last week?
        </label>
        <div className="relative">
          <Textarea
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            placeholder="One-liner or bullets..."
            className="min-h-[60px] resize-none bg-transparent border-foreground/10 focus:border-foreground/20 pr-10"
            disabled={isSaving}
          />
          {voiceSupported && (
            <button
              onClick={() => handleVoiceToggle('wentWell')}
              className={`absolute right-2 top-2 p-1.5 rounded-full transition-colors ${
                activeVoice === 'wentWell'
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-foreground/5 text-foreground/40 hover:text-foreground/60'
              }`}
              disabled={isSaving}
            >
              {activeVoice === 'wentWell' ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </Card>

      {/* Felt Off */}
      <Card className="p-4 bg-foreground/[0.02] border-foreground/5">
        <label className="block text-[10px] uppercase tracking-widest text-foreground/40 mb-2">
          What felt off or harder than expected?
        </label>
        <div className="relative">
          <Textarea
            value={feltOff}
            onChange={(e) => setFeltOff(e.target.value)}
            placeholder="One-liner or bullets..."
            className="min-h-[60px] resize-none bg-transparent border-foreground/10 focus:border-foreground/20 pr-10"
            disabled={isSaving}
          />
          {voiceSupported && (
            <button
              onClick={() => handleVoiceToggle('feltOff')}
              className={`absolute right-2 top-2 p-1.5 rounded-full transition-colors ${
                activeVoice === 'feltOff'
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-foreground/5 text-foreground/40 hover:text-foreground/60'
              }`}
              disabled={isSaving}
            >
              {activeVoice === 'feltOff' ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-foreground/40 hover:text-foreground/60"
          disabled={isSaving}
        >
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {hasAnyInput ? 'Save & Continue' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default WeeklyReflect;
