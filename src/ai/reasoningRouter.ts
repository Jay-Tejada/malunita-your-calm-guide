/**
 * Routes reasoning requests to either fast or deep mode based on input analysis
 */

const DEEP_MODE_KEYWORDS = [
  'why',
  'explain',
  'help me think',
  'help me understand',
  'planning',
  'plan',
  'decide',
  'decision',
  'conflict',
  'strategy',
  'strategic',
  'meaning',
  'clarity',
  'reasoning',
  'analyze',
  'analysis',
  'consider',
  'evaluate',
  'compare',
  'tradeoff',
  'should i',
  'what if',
  'how do i approach',
];

const FAST_MODE_INDICATORS = [
  'add task',
  'create task',
  'remind me',
  'schedule',
  'mark as',
  'complete',
  'done',
  'delete',
  'update',
  'change',
];

/**
 * Determines whether to use fast or deep reasoning based on input characteristics
 * 
 * @param input - The user's input text
 * @param metadata - Additional context (optional, reserved for future use)
 * @returns "fast" or "deep" reasoning mode
 */
export function routeReasoning(
  input: string,
  metadata: Record<string, any> = {}
): "fast" | "deep" {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for fast mode indicators first (high specificity)
  const hasFastIndicator = FAST_MODE_INDICATORS.some(indicator =>
    normalizedInput.includes(indicator)
  );
  
  if (hasFastIndicator && normalizedInput.length < 100) {
    return "fast";
  }
  
  // Check for deep mode triggers
  const hasDeepKeyword = DEEP_MODE_KEYWORDS.some(keyword =>
    normalizedInput.includes(keyword)
  );
  
  // Long inputs suggest complex reasoning needed
  const isLongInput = input.length > 200;
  
  // Check for question patterns that suggest deep reasoning
  const hasQuestionPattern = /\?/.test(input) && (
    /why|how|what if|should i|help me/i.test(input)
  );
  
  // Check for multiple sentences (suggests complex thought)
  const sentenceCount = input.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const hasMultipleSentences = sentenceCount > 2;
  
  // Determine mode
  if (hasDeepKeyword || isLongInput || hasQuestionPattern || hasMultipleSentences) {
    return "deep";
  }
  
  return "fast";
}
