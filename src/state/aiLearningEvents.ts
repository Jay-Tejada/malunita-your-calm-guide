import { create } from 'zustand';
import { useEmotionalMemory } from './emotionalMemory';
import { toast } from '@/hooks/use-toast';

interface AILearningState {
  correctionCount: number;
  lastCorrectionSummary: string | null;
  pendingModelImprovements: string[];
  incrementCorrections: () => void;
  setLastCorrection: (summary: string) => void;
  addPendingImprovement: (improvement: string) => void;
  clearPendingImprovements: () => void;
}

export const useAILearningStore = create<AILearningState>((set) => ({
  correctionCount: 0,
  lastCorrectionSummary: null,
  pendingModelImprovements: [],
  incrementCorrections: () => set((state) => ({ correctionCount: state.correctionCount + 1 })),
  setLastCorrection: (summary) => set({ lastCorrectionSummary: summary }),
  addPendingImprovement: (improvement) =>
    set((state) => ({
      pendingModelImprovements: [...state.pendingModelImprovements, improvement],
    })),
  clearPendingImprovements: () => set({ pendingModelImprovements: [] }),
}));

// Event handler for AI corrections
const handleAICorrected = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { incrementCorrections, setLastCorrection } = useAILearningStore.getState();
  
  incrementCorrections();
  
  const summary = customEvent.detail?.summary || 'Task classification improved';
  setLastCorrection(summary);

  // Update emotional memory - Malunita feels happy when she learns
  const { adjustJoy, adjustAffection } = useEmotionalMemory.getState();
  adjustJoy(3);
  adjustAffection(2);

  // Trigger companion ping
  window.dispatchEvent(new CustomEvent('companion:ping', {
    detail: { expression: 'happy', duration: 2000 }
  }));

  // Show toast
  toast({
    title: "Malunita learned something new!",
    description: summary,
    duration: 3000,
  });
};

// Event handler for misunderstandings
const handleAIMisunderstood = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { addPendingImprovement } = useAILearningStore.getState();
  
  const issue = customEvent.detail?.issue || 'Classification error detected';
  addPendingImprovement(issue);

  // Malunita feels slightly concerned but learns
  const { adjustJoy, adjustAffection } = useEmotionalMemory.getState();
  adjustJoy(1);
  adjustAffection(1);

  // Trigger companion reaction
  window.dispatchEvent(new CustomEvent('companion:ping', {
    detail: { expression: 'concerned', duration: 1500 }
  }));
};

// Event handler for task fixes
const handleTaskFixed = (event: Event) => {
  const customEvent = event as CustomEvent;
  
  // Update emotional memory
  const { adjustJoy } = useEmotionalMemory.getState();
  adjustJoy(2);

  // Trigger companion ping
  window.dispatchEvent(new CustomEvent('companion:ping', {
    detail: { expression: 'excited', duration: 1500 }
  }));

  toast({
    title: "Task updated!",
    description: customEvent.detail?.message || "Task was successfully corrected",
    duration: 2500,
  });
};

// Event handler for task reclassification
const handleTaskReclassified = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { incrementCorrections } = useAILearningStore.getState();
  
  incrementCorrections();

  // Update emotional memory
  const { adjustJoy, adjustAffection } = useEmotionalMemory.getState();
  adjustJoy(2);
  adjustAffection(1);

  // Trigger companion reaction
  window.dispatchEvent(new CustomEvent('companion:ping', {
    detail: { expression: 'base', duration: 1500 }
  }));

  toast({
    title: "Classification updated",
    description: customEvent.detail?.message || "Task was reclassified successfully",
    duration: 2500,
  });
};

// Initialize event listeners
export const initializeAILearningListeners = () => {
  window.addEventListener('ai:corrected', handleAICorrected);
  window.addEventListener('ai:misunderstood', handleAIMisunderstood);
  window.addEventListener('task:fixed', handleTaskFixed);
  window.addEventListener('task:reclassified', handleTaskReclassified);

  // Cleanup function
  return () => {
    window.removeEventListener('ai:corrected', handleAICorrected);
    window.removeEventListener('ai:misunderstood', handleAIMisunderstood);
    window.removeEventListener('task:fixed', handleTaskFixed);
    window.removeEventListener('task:reclassified', handleTaskReclassified);
  };
};
