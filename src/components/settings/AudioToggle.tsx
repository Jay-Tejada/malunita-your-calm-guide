import { useOrbAudio } from '@/hooks/useOrbAudio';
import { useToast } from '@/hooks/use-toast';
import { Volume2, VolumeX } from 'lucide-react';

export function AudioToggle() {
  const { enabled, toggle } = useOrbAudio();
  const { toast } = useToast();

  const handleToggle = () => {
    const newValue = !enabled;
    toggle(newValue);
    toast({
      title: newValue ? "Orb sounds enabled" : "Orb sounds disabled",
      description: newValue ? "You'll hear gentle chimes for actions" : "Audio feedback is now muted",
      duration: 2000,
    });
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {enabled ? (
          <Volume2 className="w-4 h-4 text-foreground transition-colors" />
        ) : (
          <VolumeX className="w-4 h-4 text-muted-foreground transition-colors" />
        )}
        <span className="text-sm text-muted-foreground">Orb sounds</span>
      </div>
      <button
        onClick={handleToggle}
        className={`w-10 h-6 rounded-full transition-all duration-300 ${
          enabled ? 'bg-foreground' : 'bg-muted'
        }`}
        aria-label={enabled ? 'Disable orb sounds' : 'Enable orb sounds'}
      >
        <div
          className={`w-4 h-4 bg-background rounded-full transition-transform duration-300 mx-1 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
