import { useState, useCallback } from 'react';
import { orbAudio } from '@/lib/orbAudio';

type SoundType = 'task_added' | 'task_completed' | 'ritual_start' | 'ritual_end' | 'celebrate';

export function useOrbAudio() {
  const [initialized, setInitialized] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const init = useCallback(async () => {
    if (initialized) return;
    await orbAudio.init();
    setInitialized(true);
  }, [initialized]);

  const play = useCallback((sound: SoundType) => {
    orbAudio.play(sound);
  }, []);

  const toggle = useCallback((value: boolean) => {
    setEnabled(value);
    orbAudio.setEnabled(value);
  }, []);

  return { init, play, toggle, enabled, initialized };
}
