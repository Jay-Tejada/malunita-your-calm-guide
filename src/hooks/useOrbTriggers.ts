import { useOrbStore } from '@/state/orbState';

export function useOrbTriggers() {
  const { triggerCelebration, triggerThinking, enterFocusMode, exitFocusMode, reset } = useOrbStore();
  
  return {
    onTaskComplete: () => triggerCelebration(),
    onAIStart: () => triggerThinking(),
    onAIEnd: () => reset(),
    onFocusStart: () => enterFocusMode(),
    onFocusEnd: () => exitFocusMode(),
  };
}
