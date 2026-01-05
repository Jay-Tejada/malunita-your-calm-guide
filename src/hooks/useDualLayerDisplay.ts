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
  isPending: boolean; // Voice note still processing
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed' | null;
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
  
  // Check if this is a pending voice note
  const processingStatus = (task as any).processing_status || null;
  const isPending = processingStatus === 'pending' || processingStatus === 'processing';
  
  // Raw content: original unmodified input
  const rawContent = (task as any).raw_content || task.title || '';
  
  // Display text logic:
  // - For pending voice notes, show a special message
  // - Use ai_summary if available and confidence >= 0.6
  // - Otherwise fallback to raw_content or title
  let displayText: string;
  if (isPending) {
    displayText = processingStatus === 'processing' ? 'Transcribing voice note…' : 'Voice note processing…';
  } else if (hasAiSummary && !lowConfidence) {
    displayText = (task as any).ai_summary;
  } else {
    displayText = rawContent;
  }
  
  // Has dual layer if ai_summary exists AND differs from raw_content
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  
  // Long entry: either display text or raw content exceeds threshold
  const isLongEntry = displayText.length > COLLAPSE_CHAR_THRESHOLD || 
    (hasDualLayer && rawContent.length > COLLAPSE_CHAR_THRESHOLD);
  
  // Show expand indicator if has dual layer OR is long entry (but not for pending items)
  const showExpandIndicator = !isPending && (hasDualLayer || isLongEntry);
  
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
    isPending,
    processingStatus,
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
  
  // Check if this is a pending voice note
  const processingStatus = (task as any).processing_status || null;
  const isPending = processingStatus === 'pending' || processingStatus === 'processing';
  
  // Display text logic
  let displayText: string;
  if (isPending) {
    displayText = processingStatus === 'processing' ? 'Transcribing voice note…' : 'Voice note processing…';
  } else if (hasAiSummary && !lowConfidence) {
    displayText = (task as any).ai_summary;
  } else {
    displayText = rawContent;
  }
  
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  const isLongEntry = displayText.length > COLLAPSE_CHAR_THRESHOLD || 
    (hasDualLayer && rawContent.length > COLLAPSE_CHAR_THRESHOLD);
  const showExpandIndicator = !isPending && (hasDualLayer || isLongEntry);
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
    isPending,
    processingStatus,
  };
}
