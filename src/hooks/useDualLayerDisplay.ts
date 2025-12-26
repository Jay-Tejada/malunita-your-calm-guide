import { Task } from '@/hooks/useTasks';

const COLLAPSE_CHAR_THRESHOLD = 100;
const LOW_CONFIDENCE_THRESHOLD = 0.6;

export interface DualLayerState {
  displayText: string;
  rawContent: string;
  hasAiSummary: boolean;
  hasDualLayer: boolean;
  isLongEntry: boolean;
  lowConfidence: boolean;
  confidence: number;
  showExpandIndicator: boolean;
  isEmpty: boolean;
}

/**
 * Hook to compute dual-layer display logic for tasks.
 * Returns display text, raw content, and expansion state info.
 */
export function useDualLayerDisplay(task: Task): DualLayerState {
  // Extract AI summary and confidence from task
  const hasAiSummary = !!(task as any).ai_summary;
  const confidence = (task as any).ai_confidence ?? 1.0;
  const lowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD;
  
  // Raw content: original unmodified input
  const rawContent = (task as any).raw_content || task.title || '';
  
  // Display text logic:
  // - Use ai_summary if available and confidence >= 0.6
  // - Otherwise fallback to raw_content or title
  const displayText = hasAiSummary && !lowConfidence 
    ? (task as any).ai_summary 
    : rawContent;
  
  // Has dual layer if ai_summary exists AND differs from raw_content
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  
  // Long entry: either display text or raw content exceeds threshold
  const isLongEntry = displayText.length > COLLAPSE_CHAR_THRESHOLD || 
    (hasDualLayer && rawContent.length > COLLAPSE_CHAR_THRESHOLD);
  
  // Show expand indicator if has dual layer OR is long entry
  const showExpandIndicator = hasDualLayer || isLongEntry;
  
  // Both empty check
  const isEmpty = !displayText && !rawContent;
  
  return {
    displayText: isEmpty ? 'Empty capture' : displayText,
    rawContent,
    hasAiSummary,
    hasDualLayer,
    isLongEntry,
    lowConfidence,
    confidence,
    showExpandIndicator,
    isEmpty,
  };
}

/**
 * Pure function version for use in non-hook contexts
 */
export function getDualLayerDisplay(task: Task): DualLayerState {
  const hasAiSummary = !!(task as any).ai_summary;
  const confidence = (task as any).ai_confidence ?? 1.0;
  const lowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD;
  const rawContent = (task as any).raw_content || task.title || '';
  
  const displayText = hasAiSummary && !lowConfidence 
    ? (task as any).ai_summary 
    : rawContent;
  
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  const isLongEntry = displayText.length > COLLAPSE_CHAR_THRESHOLD || 
    (hasDualLayer && rawContent.length > COLLAPSE_CHAR_THRESHOLD);
  const showExpandIndicator = hasDualLayer || isLongEntry;
  const isEmpty = !displayText && !rawContent;
  
  return {
    displayText: isEmpty ? 'Empty capture' : displayText,
    rawContent,
    hasAiSummary,
    hasDualLayer,
    isLongEntry,
    lowConfidence,
    confidence,
    showExpandIndicator,
    isEmpty,
  };
}
