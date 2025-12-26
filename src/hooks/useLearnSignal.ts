import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SignalType = 
  | 'destination_correction'
  | 'summary_edit'
  | 'decomposition_rejection'
  | 'suggestion_ignored'
  | 'expansion_pattern'
  | 'task_completed'
  | 'task_deleted';

export interface LearnSignal {
  type: SignalType;
  from?: string;
  to?: string;
  original?: string;
  edited?: string;
  action?: 'delete' | 'merge';
  suggested?: string;
  chosen?: string;
  expanded?: boolean;
  task_type?: string;
  category?: string;
}

/**
 * Hook for capturing implicit learning signals from user behavior.
 * Signals are captured async to avoid slowing down UI.
 */
export function useLearnSignal() {
  const captureSignal = useCallback(async (
    signal: LearnSignal,
    taskId?: string
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fire and forget - don't await in UI context
      supabase
        .from('user_learning_signals' as any)
        .insert([{
          user_id: user.id,
          signal_type: signal.type,
          signal_data: signal,
          task_id: taskId || null,
        }])
        .then(({ error }) => {
          if (error) {
            console.error('[LearnSignal] Failed to capture:', error.message);
          } else {
            console.log('[LearnSignal] Captured:', signal.type);
          }
        });
    } catch (err) {
      // Silently fail - learning is non-critical
      console.error('[LearnSignal] Error:', err);
    }
  }, []);

  /**
   * Capture destination correction when user moves task to different space
   */
  const captureDestinationCorrection = useCallback((
    taskId: string,
    fromSpace: string,
    toSpace: string
  ) => {
    if (fromSpace === toSpace) return;
    captureSignal({
      type: 'destination_correction',
      from: fromSpace,
      to: toSpace,
    }, taskId);
  }, [captureSignal]);

  /**
   * Capture when user edits AI-generated summary or title
   */
  const captureSummaryEdit = useCallback((
    taskId: string,
    originalText: string,
    editedText: string
  ) => {
    if (originalText === editedText) return;
    // Don't store full text - just patterns
    captureSignal({
      type: 'summary_edit',
      original: originalText.substring(0, 50), // Truncate for privacy
      edited: editedText.substring(0, 50),
    }, taskId);
  }, [captureSignal]);

  /**
   * Capture when user rejects decomposition (deletes subtask)
   */
  const captureDecompositionRejection = useCallback((
    taskId: string,
    action: 'delete' | 'merge'
  ) => {
    captureSignal({
      type: 'decomposition_rejection',
      action,
    }, taskId);
  }, [captureSignal]);

  /**
   * Capture when user ignores AI suggestion and picks different option
   */
  const captureSuggestionIgnored = useCallback((
    taskId: string,
    suggested: string,
    chosen: string
  ) => {
    if (suggested === chosen) return;
    captureSignal({
      type: 'suggestion_ignored',
      suggested,
      chosen,
    }, taskId);
  }, [captureSignal]);

  /**
   * Capture expansion patterns (user always expands certain task types)
   */
  const captureExpansionPattern = useCallback((
    taskId: string,
    expanded: boolean,
    taskType?: string,
    category?: string
  ) => {
    captureSignal({
      type: 'expansion_pattern',
      expanded,
      task_type: taskType,
      category,
    }, taskId);
  }, [captureSignal]);

  /**
   * Capture task completion with category for pattern analysis
   */
  const captureTaskCompleted = useCallback((
    taskId: string,
    category?: string
  ) => {
    captureSignal({
      type: 'task_completed',
      category,
    }, taskId);
  }, [captureSignal]);

  return {
    captureSignal,
    captureDestinationCorrection,
    captureSummaryEdit,
    captureDecompositionRejection,
    captureSuggestionIgnored,
    captureExpansionPattern,
    captureTaskCompleted,
  };
}

/**
 * Standalone function for capturing signals outside of React context
 */
export async function captureLearnSignal(
  signal: LearnSignal,
  taskId?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_learning_signals' as any)
      .insert([{
        user_id: user.id,
        signal_type: signal.type,
        signal_data: signal,
        task_id: taskId || null,
      }]);

    if (error) {
      console.error('[LearnSignal] Failed to capture:', error.message);
    }
  } catch (err) {
    console.error('[LearnSignal] Error:', err);
  }
}
