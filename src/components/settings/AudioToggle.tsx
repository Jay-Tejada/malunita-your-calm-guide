import { useOrbAudio } from '@/hooks/useOrbAudio';

export function AudioToggle() {
  const { enabled, toggle } = useOrbAudio();

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">Orb sounds</span>
      <button
        onClick={() => toggle(!enabled)}
        className={`w-10 h-6 rounded-full transition-colors ${
          enabled ? 'bg-foreground' : 'bg-muted'
        }`}
        aria-label={enabled ? 'Disable orb sounds' : 'Enable orb sounds'}
      >
        <div
          className={`w-4 h-4 bg-background rounded-full transition-transform mx-1 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
