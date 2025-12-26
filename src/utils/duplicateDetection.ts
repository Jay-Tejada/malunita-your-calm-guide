/**
 * Duplicate Detection Utility
 * Detects exact and fuzzy duplicate tasks
 */

// Normalize text for comparison
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .replace(/[.,!?;:'"]/g, '')  // Remove punctuation
    .replace(/^(the|a|an)\s+/i, ''); // Remove leading articles
};

// Calculate similarity between two strings (Levenshtein-based)
export const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Quick check: if one contains the other, high similarity
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = Math.min(s1.length, s2.length);
    const longer = Math.max(s1.length, s2.length);
    return shorter / longer;
  }
  
  // Levenshtein distance for fuzzy matching
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
};

// Similarity threshold for fuzzy matching
const FUZZY_THRESHOLD = 0.85;

export interface DuplicateInfo {
  isDuplicate: boolean;
  duplicateOf?: string; // Task ID of the original
  duplicateText?: string; // Title of the duplicate
  similarity: number;
  matchType: 'exact' | 'fuzzy' | 'none';
  location?: string; // Where the duplicate exists ("today", "inbox", "work", etc.)
}

interface TaskLike {
  id: string;
  title: string;
  ai_summary?: string;
  scheduled_bucket?: string | null;
  category?: string | null;
}

// Check if a task is a duplicate of any in the given list
export const findDuplicate = (
  task: TaskLike,
  existingTasks: TaskLike[],
  excludeIds: string[] = []
): DuplicateInfo => {
  const taskText = task.ai_summary || task.title;
  const normalizedTask = normalizeText(taskText);
  
  for (const existing of existingTasks) {
    // Skip self and excluded IDs
    if (existing.id === task.id || excludeIds.includes(existing.id)) continue;
    
    const existingText = existing.ai_summary || existing.title;
    const normalizedExisting = normalizeText(existingText);
    
    // Exact match
    if (normalizedTask === normalizedExisting) {
      return {
        isDuplicate: true,
        duplicateOf: existing.id,
        duplicateText: existingText,
        similarity: 1.0,
        matchType: 'exact',
        location: getTaskLocation(existing),
      };
    }
    
    // Fuzzy match
    const similarity = calculateSimilarity(taskText, existingText);
    if (similarity >= FUZZY_THRESHOLD) {
      return {
        isDuplicate: true,
        duplicateOf: existing.id,
        duplicateText: existingText,
        similarity,
        matchType: 'fuzzy',
        location: getTaskLocation(existing),
      };
    }
  }
  
  return {
    isDuplicate: false,
    similarity: 0,
    matchType: 'none',
  };
};

// Get human-readable location for a task
const getTaskLocation = (task: TaskLike): string => {
  if (task.scheduled_bucket === 'today') return 'Today';
  if (task.scheduled_bucket === 'upcoming') return 'Upcoming';
  if (task.scheduled_bucket === 'someday') return 'Someday';
  if (task.category === 'work') return 'Work';
  if (task.category === 'home') return 'Home';
  if (task.category === 'inbox' || !task.scheduled_bucket) return 'Inbox';
  return task.category || 'Inbox';
};

// Filter out duplicates from a task list, keeping the "better" version
export const deduplicateTasks = <T extends TaskLike>(
  tasks: T[],
  preferenceOrder: ('today' | 'work' | 'inbox' | 'home' | 'someday')[] = ['today', 'work', 'home', 'inbox', 'someday']
): T[] => {
  const seen = new Map<string, T>();
  const result: T[] = [];
  
  // Sort tasks by preference (preferred locations first)
  const sortedTasks = [...tasks].sort((a, b) => {
    const aLocation = (a.scheduled_bucket || a.category || 'inbox') as string;
    const bLocation = (b.scheduled_bucket || b.category || 'inbox') as string;
    const aIndex = preferenceOrder.findIndex(p => aLocation.includes(p));
    const bIndex = preferenceOrder.findIndex(p => bLocation.includes(p));
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
  
  for (const task of sortedTasks) {
    const taskText = task.ai_summary || task.title;
    const normalizedTask = normalizeText(taskText);
    
    // Check for exact match
    if (seen.has(normalizedTask)) {
      continue; // Skip duplicate
    }
    
    // Check for fuzzy match against all seen tasks
    let isDuplicate = false;
    for (const [seenNormalized, seenTask] of seen.entries()) {
      const seenText = seenTask.ai_summary || seenTask.title;
      const similarity = calculateSimilarity(taskText, seenText);
      if (similarity >= FUZZY_THRESHOLD) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.set(normalizedTask, task);
      result.push(task);
    }
  }
  
  return result;
};

// Check for duplicates at capture time
export const checkCaptureForDuplicate = (
  newText: string,
  existingTasks: TaskLike[]
): DuplicateInfo => {
  const fakeTask: TaskLike = {
    id: 'new',
    title: newText,
  };
  return findDuplicate(fakeTask, existingTasks);
};
