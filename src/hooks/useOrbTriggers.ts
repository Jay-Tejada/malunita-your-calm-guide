import { useOrbStore } from '@/state/orbState';
import { useOrbAudio } from '@/hooks/useOrbAudio';

export function useOrbTriggers() {
  const { triggerCelebration, triggerThinking, enterFocusMode, exitFocusMode, reset } = useOrbStore();
  const { play, init } = useOrbAudio();
  
  return {
    onTaskComplete: () => {
      init(); // Ensure audio is initialized
      triggerCelebration();
      play('task_completed');
    },
    onTaskAdded: () => {
      init();
      play('task_added');
    },
    onAIStart: () => triggerThinking(),
    onAIEnd: () => reset(),
    onFocusStart: () => enterFocusMode(),
    onFocusEnd: () => exitFocusMode(),
  };
}
