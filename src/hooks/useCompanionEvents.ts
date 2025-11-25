import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMemoryEngine } from "@/state/memoryEngine";

// Companion reaction system for task completions
export function useCompanionEvents() {
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerCompanionPing = useCallback(() => {
    window.dispatchEvent(new CustomEvent("companion:ping"));
  }, []);

  const setTemporaryExpression = useCallback((expression: string, duration: number = 3500) => {
    // Clear any existing timeout
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
    }

    // Trigger custom event for companion to react
    const event = new CustomEvent('companion:reaction', {
      detail: { expression, duration }
    });
    window.dispatchEvent(event);

    // Auto-reset after duration
    reactionTimeoutRef.current = setTimeout(() => {
      const resetEvent = new CustomEvent('companion:reaction', {
        detail: { expression: 'neutral', duration: 0 }
      });
      window.dispatchEvent(resetEvent);
    }, duration);
  }, []);

  const updateEmotionalMemory = useCallback(async (joyDelta: number, affectionDelta: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current emotional memory
      const { data: profile } = await supabase
        .from('profiles')
        .select('emotional_memory')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const currentMemory = profile.emotional_memory as any || {
        joy: 50,
        stress: 50,
        fatigue: 50,
        affection: 50
      };

      // Update with deltas (capped at 0-100)
      const updatedMemory = {
        joy: Math.max(0, Math.min(100, currentMemory.joy + joyDelta)),
        stress: currentMemory.stress,
        fatigue: currentMemory.fatigue,
        affection: Math.max(0, Math.min(100, currentMemory.affection + affectionDelta))
      };

      // Save back to database (non-blocking)
      supabase
        .from('profiles')
        .update({ emotional_memory: updatedMemory })
        .eq('id', user.id)
        .then(() => {
          console.log('Emotional memory updated:', updatedMemory);
        });
    } catch (error) {
      console.error('Failed to update emotional memory:', error);
    }
  }, []);

  const onTaskCompleted = useCallback((count: number = 1) => {
    // Boost emotional memory
    const joyBoost = Math.min(count * 3, 10); // Cap joy boost
    const affectionBoost = Math.min(count * 2, 8);
    updateEmotionalMemory(joyBoost, affectionBoost);

    // Update memory engine
    const memoryEngine = useMemoryEngine.getState();
    
    // Add positive reinforcers when user completes tasks (happiness)
    if (count >= 2) {
      memoryEngine.addPositiveReinforcer('completing_tasks');
      memoryEngine.addPositiveReinforcer('productivity_burst');
    }
    
    // Update streak history
    memoryEngine.addToStreakHistory('task_completion', count);
    
    // Pass interaction data to memory engine
    memoryEngine.updateFromCompanionInteraction({
      emotion: count >= 3 ? 'overjoyed' : count === 2 ? 'excited' : 'happy',
      context: `completed_${count}_tasks`,
      outcome: 'positive'
    });

    // Show appropriate expression
    if (count >= 3) {
      // Multiple tasks completed quickly
      setTemporaryExpression('overjoyed', 4000);
    } else if (count === 2) {
      setTemporaryExpression('excited', 3500);
    } else {
      // Single task completion
      const expressions = ['happy', 'laughing'];
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      setTemporaryExpression(randomExpression, 3000);
    }
  }, [setTemporaryExpression, updateEmotionalMemory]);

  const onQuickWinCompleted = useCallback(() => {
    // Quick wins get special celebration
    updateEmotionalMemory(5, 3);
    
    // Update memory engine - quick wins are positive reinforcers
    const memoryEngine = useMemoryEngine.getState();
    memoryEngine.addPositiveReinforcer('quick_wins');
    memoryEngine.addToStreakHistory('quick_win', 1);
    memoryEngine.updateFromCompanionInteraction({
      emotion: 'happy',
      context: 'quick_win_completed',
      outcome: 'positive'
    });
    
    const quickWinExpressions = ['welcoming', 'winking', 'happy'];
    const randomExpression = quickWinExpressions[Math.floor(Math.random() * quickWinExpressions.length)];
    setTemporaryExpression(randomExpression, 3000);
  }, [setTemporaryExpression, updateEmotionalMemory]);

  const onTaskCreated = useCallback((taskInfo?: { priority?: number; isTiny?: boolean; bucket?: string }) => {
    const memoryEngine = useMemoryEngine.getState();
    
    // Tiny tasks trigger happiness
    if (taskInfo?.isTiny) {
      const tinyExpressions = ['happy', 'laughing'];
      const randomExpression = tinyExpressions[Math.floor(Math.random() * tinyExpressions.length)];
      setTemporaryExpression(randomExpression, 2500);
      updateEmotionalMemory(3, 2);
      
      // Memory: Tiny tasks are positive reinforcers
      memoryEngine.addPositiveReinforcer('tiny_tasks');
      memoryEngine.updateFromCompanionInteraction({
        emotion: 'happy',
        context: 'tiny_task_created',
        outcome: 'positive'
      });
      
      window.dispatchEvent(new CustomEvent("companion:emotion"));
      return;
    }

    // High priority tasks trigger concern/support - add emotional trigger
    if (taskInfo?.priority && taskInfo.priority >= 0.85) {
      const supportExpressions = ['concerned', 'supportive'];
      const randomExpression = supportExpressions[Math.floor(Math.random() * supportExpressions.length)];
      setTemporaryExpression(randomExpression, 3000);
      updateEmotionalMemory(1, 3);
      
      // Memory: High priority tasks can be stress triggers
      memoryEngine.addEmotionalTrigger('high_priority_stress');
      memoryEngine.addProcrastinationTrigger('urgent_tasks');
      memoryEngine.updateFromCompanionInteraction({
        emotion: 'concerned',
        context: 'high_priority_task',
        outcome: 'stressful'
      });
      
      window.dispatchEvent(new CustomEvent("companion:emotion"));
      return;
    }

    // Task routed to Today bucket triggers excitement
    if (taskInfo?.bucket === 'today') {
      setTemporaryExpression('excited', 3000);
      updateEmotionalMemory(4, 2);
      
      memoryEngine.addPositiveReinforcer('planning_ahead');
      memoryEngine.updateFromCompanionInteraction({
        emotion: 'excited',
        context: 'today_bucket_task',
        outcome: 'positive'
      });
      
      window.dispatchEvent(new CustomEvent("companion:emotion"));
      return;
    }

    // Default: neutral positive reaction
    setTemporaryExpression('welcoming', 2000);
    updateEmotionalMemory(2, 1);
    
    memoryEngine.updateFromCompanionInteraction({
      emotion: 'neutral',
      context: 'task_created',
      outcome: 'neutral'
    });
    
    window.dispatchEvent(new CustomEvent("companion:emotion"));
  }, [setTemporaryExpression, updateEmotionalMemory]);

  const onTaskPrioritized = useCallback((priority: number) => {
    if (priority >= 0.85) {
      // High priority - show concern and track as emotional trigger
      const expressions = ['concerned', 'supportive'];
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      setTemporaryExpression(randomExpression, 3000);
      updateEmotionalMemory(0, 2);
      
      // Memory: Track priority patterns and stress
      const memoryEngine = useMemoryEngine.getState();
      memoryEngine.addEmotionalTrigger('frequent_high_priority');
      memoryEngine.updateFromCompanionInteraction({
        emotion: 'concerned',
        context: 'task_prioritized_high',
        outcome: 'stressful'
      });
      
      window.dispatchEvent(new CustomEvent("companion:emotion"));
    }
  }, [setTemporaryExpression, updateEmotionalMemory]);

  const onTaskRouted = useCallback((bucket: string) => {
    if (bucket === 'today') {
      // Routed to today - show excitement and track as positive
      setTemporaryExpression('excited', 3000);
      updateEmotionalMemory(4, 2);
      
      // Memory: Today routing is a positive reinforcer
      const memoryEngine = useMemoryEngine.getState();
      memoryEngine.addPositiveReinforcer('organizing_today');
      memoryEngine.updateFromCompanionInteraction({
        emotion: 'excited',
        context: 'task_routed_today',
        outcome: 'positive'
      });
      
      window.dispatchEvent(new CustomEvent("companion:emotion"));
    }
  }, [setTemporaryExpression, updateEmotionalMemory]);

  return {
    onTaskCompleted,
    onQuickWinCompleted,
    onTaskCreated,
    onTaskPrioritized,
    onTaskRouted,
    triggerCompanionPing,
  };
}
