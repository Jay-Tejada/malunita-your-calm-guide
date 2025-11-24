import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Companion reaction system for task completions
export function useCompanionEvents() {
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    
    const quickWinExpressions = ['welcoming', 'winking', 'happy'];
    const randomExpression = quickWinExpressions[Math.floor(Math.random() * quickWinExpressions.length)];
    setTemporaryExpression(randomExpression, 3000);
  }, [setTemporaryExpression, updateEmotionalMemory]);

  return {
    onTaskCompleted,
    onQuickWinCompleted,
  };
}
