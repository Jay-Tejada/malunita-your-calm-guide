import { Task } from '@/hooks/useTasks';

const COLLAPSE_CHAR_THRESHOLD = 100;
const LOW_CONFIDENCE_THRESHOLD = 0.6;

export type ProcessingStatus = 'pending' | 'processing' | 'transcribed' | 'summarized' | 'indexed' | 'failed' | 'completed' | null;

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
  isFailed: boolean;
  isCompleted: boolean;
  processingStatus: ProcessingStatus;
  memoryTags: string[];
  pendingAudioPath: string | null;
}

/**
 * Hook to compute dual-layer display logic for tasks.
 * Returns display text, raw content, and expansion state info.
 */
export function useDualLayerDisplay(task: Task): DualLayerState {
  return getDualLayerDisplay(task);
}

/**
 * Pure function version for use in non-hook contexts
 */
export function getDualLayerDisplay(task: Task): DualLayerState {
  const hasAiSummary = !!(task as any).ai_summary;
  const confidence = (task as any).ai_confidence ?? 1.0;
  const lowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD;
  const rawContent = (task as any).raw_content || task.title || '';
  
  // Check processing status
  const processingStatus: ProcessingStatus = (task as any).processing_status || null;
  const isPending = ['pending', 'processing', 'transcribed', 'summarized'].includes(processingStatus || '');
  const isFailed = processingStatus === 'failed';
  const isCompleted = processingStatus === 'indexed' || processingStatus === 'completed' || processingStatus === null;
  
  // Extract memory tags from ai_metadata
  const aiMetadata = (task as any).ai_metadata || {};
  const memoryTags: string[] = aiMetadata.memory_tags || [];
  
  // Pending audio path for failed items
  const pendingAudioPath: string | null = (task as any).pending_audio_path || null;
  
  // Display text logic with progressive status
  let displayText: string;
  if (isFailed) {
    displayText = 'Voice note (processing failed)';
  } else if (processingStatus === 'pending') {
    displayText = 'Voice note added…';
  } else if (processingStatus === 'processing') {
    displayText = 'Transcribing…';
  } else if (processingStatus === 'transcribed') {
    // Show first line of transcript, truncated
    const firstLine = rawContent.split('\n')[0] || 'Processing…';
    displayText = firstLine.length > 80 ? firstLine.slice(0, 77) + '…' : firstLine;
  } else if (processingStatus === 'summarized' || processingStatus === 'indexed') {
    // AI summary available
    displayText = hasAiSummary && !lowConfidence ? (task as any).ai_summary : rawContent;
  } else if (hasAiSummary && !lowConfidence) {
    displayText = (task as any).ai_summary;
  } else {
    displayText = rawContent;
  }
  
  const hasDualLayer = hasAiSummary && rawContent !== (task as any).ai_summary;
  const isLongEntry = displayText.length > COLLAPSE_CHAR_THRESHOLD || 
    (hasDualLayer && rawContent.length > COLLAPSE_CHAR_THRESHOLD);
  
  // Show expand indicator if:
  // - Has dual layer (summary + original)
  // - Is long entry
  // - Has failed (to show retry/audio)
  // But NOT for pending items still processing
  const showExpandIndicator = !isPending && (hasDualLayer || isLongEntry || isFailed);
  
  const isEmpty = !displayText && !rawContent && !pendingAudioPath;
  
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
    isFailed,
    isCompleted,
    processingStatus,
    memoryTags,
    pendingAudioPath,
  };
}
