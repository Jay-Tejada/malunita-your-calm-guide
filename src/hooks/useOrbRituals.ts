import { useOrbStore } from '@/state/orbState';

export function useOrbRituals() {
  const { setMood, setEnergy, triggerCelebration } = useOrbStore();

  const onStartMyDay = () => {
    setMood('morning');
    setEnergy(4);
    // Warm activation for 3 seconds, then idle
    setTimeout(() => setMood('idle'), 3000);
  };

  const onEndMyDay = () => {
    setMood('evening');
    setEnergy(2);
  };

  const onTinyTaskFiestaStart = () => {
    setEnergy(5);
  };

  const onTinyTaskFiestaComplete = (tasksCleared: number) => {
    if (tasksCleared >= 3) {
      triggerCelebration();
    }
  };

  const onFocusSessionStart = () => {
    setMood('focused');
    setEnergy(4);
  };

  const onFocusSessionEnd = () => {
    setMood('idle');
    triggerCelebration();
  };

  return {
    onStartMyDay,
    onEndMyDay,
    onTinyTaskFiestaStart,
    onTinyTaskFiestaComplete,
    onFocusSessionStart,
    onFocusSessionEnd,
  };
}
