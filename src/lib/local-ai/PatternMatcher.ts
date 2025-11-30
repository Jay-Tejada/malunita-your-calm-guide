interface CategoryPattern {
  keywords: RegExp;
  category: 'work' | 'home' | 'gym' | 'projects' | 'inbox';
  confidence: number;
}

const CATEGORY_PATTERNS: CategoryPattern[] = [
  // Work patterns
  {
    keywords: /\b(meeting|client|email|presentation|deadline|report|call|zoom|slack|project|boss|colleague|conference|review|proposal|budget|invoice|contract)\b/i,
    category: 'work',
    confidence: 0.8
  },
  // Home patterns
  {
    keywords: /\b(grocery|groceries|laundry|clean|cook|dinner|lunch|dishes|vacuum|trash|shopping|errands|bills|rent|utilities|repair|maintenance)\b/i,
    category: 'home',
    confidence: 0.8
  },
  // Gym patterns
  {
    keywords: /\b(workout|gym|exercise|run|running|yoga|fitness|stretch|cardio|weights|training|bike|swim|swimming|hike|hiking|sports)\b/i,
    category: 'gym',
    confidence: 0.8
  },
  // Projects patterns
  {
    keywords: /\b(build|create|design|develop|plan|launch|prototype|mvp|feature|app|website|startup|product|code|coding|programming)\b/i,
    category: 'projects',
    confidence: 0.7
  }
];

interface LocalCategorizationResult {
  category: string;
  confidence: number;
  shouldUseAI: boolean;
}

export class LocalPatternMatcher {
  /**
   * Categorize text locally using pattern matching
   * Returns category with confidence and whether AI should be used
   */
  categorizeLocally(text: string): LocalCategorizationResult {
    let bestMatch: CategoryPattern | null = null;
    
    for (const pattern of CATEGORY_PATTERNS) {
      if (pattern.keywords.test(text)) {
        if (!bestMatch || pattern.confidence > bestMatch.confidence) {
          bestMatch = pattern;
        }
      }
    }
    
    if (bestMatch && bestMatch.confidence >= 0.75) {
      // Confident local match - don't need AI
      return {
        category: bestMatch.category,
        confidence: bestMatch.confidence,
        shouldUseAI: false
      };
    }
    
    // Ambiguous - use AI
    return {
      category: 'inbox',
      confidence: 0,
      shouldUseAI: true
    };
  }
  
  /**
   * Quick check if task is tiny without AI
   * Looks for indicators like short length, time estimates, quick action words
   */
  isTinyTask(text: string): boolean {
    // Quick checks without AI
    const tinyIndicators = /\b(quick|email|call|text|reply|schedule|message|dm|ping|check|confirm|send|forward)\b/i;
    const shortLength = text.length < 50;
    const hasShortTime = /\d+\s*(min|mins|minutes?)\b/i.test(text) && !/[3-9]\d+\s*min/i.test(text); // Less than 30 mins
    
    return tinyIndicators.test(text) || (shortLength && hasShortTime);
  }
  
  /**
   * Extract deadline from natural language
   * Returns null if too complex for local parsing
   */
  extractDeadline(text: string): Date | null {
    const patterns = [
      { 
        regex: /\b(today|tonight)\b/i, 
        getDate: () => {
          const date = new Date();
          date.setHours(23, 59, 59, 999);
          return date;
        }
      },
      { 
        regex: /\btomorrow\b/i, 
        getDate: () => {
          const date = new Date();
          date.setDate(date.getDate() + 1);
          date.setHours(23, 59, 59, 999);
          return date;
        }
      },
      { 
        regex: /\bin\s+(\d+)\s+days?\b/i, 
        getDate: (match: RegExpMatchArray) => {
          const days = parseInt(match[1]);
          const date = new Date();
          date.setDate(date.getDate() + days);
          date.setHours(23, 59, 59, 999);
          return date;
        }
      },
      { 
        regex: /\bnext\s+week\b/i, 
        getDate: () => {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          date.setHours(23, 59, 59, 999);
          return date;
        }
      },
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        try {
          return pattern.getDate(match);
        } catch {
          return null;
        }
      }
    }
    
    // Check for specific day names - too complex, let AI handle
    if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text)) {
      return null;
    }
    
    return null;
  }
  
  /**
   * Get priority from text
   * Returns null if ambiguous and AI should decide
   */
  getPriority(text: string): 'must' | 'should' | 'could' | null {
    const urgentWords = /\b(urgent|asap|immediately|now|critical|important|deadline|emergency|priority)\b/i;
    const lowPriorityWords = /\b(someday|maybe|eventually|when\s+i\s+can|if\s+i\s+have\s+time|optional|nice\s+to\s+have)\b/i;
    
    if (urgentWords.test(text)) return 'must';
    if (lowPriorityWords.test(text)) return 'could';
    
    return null; // Let AI decide
  }
  
  /**
   * Learn from user corrections
   * Store patterns that user frequently corrects
   */
  learnFromCorrection(originalText: string, correctCategory: string) {
    try {
      const corrections = JSON.parse(localStorage.getItem('pattern_corrections') || '{}');
      
      // Extract meaningful words (ignore common words)
      const words = originalText.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have', 'will'].includes(w));
      
      // Store correction
      words.forEach(word => {
        if (!corrections[word]) {
          corrections[word] = {};
        }
        corrections[word][correctCategory] = (corrections[word][correctCategory] || 0) + 1;
      });
      
      localStorage.setItem('pattern_corrections', JSON.stringify(corrections));
    } catch (error) {
      console.warn('Failed to store pattern correction:', error);
    }
  }
  
  /**
   * Get learned patterns from user corrections
   */
  getLearnedCategory(text: string): string | null {
    try {
      const corrections = JSON.parse(localStorage.getItem('pattern_corrections') || '{}');
      const words = text.toLowerCase().split(/\s+/);
      
      const categoryScores: Record<string, number> = {};
      
      words.forEach(word => {
        if (corrections[word]) {
          Object.entries(corrections[word]).forEach(([category, count]) => {
            categoryScores[category] = (categoryScores[category] || 0) + (count as number);
          });
        }
      });
      
      // Find category with highest score
      let bestCategory = null;
      let bestScore = 0;
      
      Object.entries(categoryScores).forEach(([category, score]) => {
        if (score > bestScore && score >= 3) { // Need at least 3 corrections to trust
          bestCategory = category;
          bestScore = score;
        }
      });
      
      return bestCategory;
    } catch {
      return null;
    }
  }
  
  /**
   * Complete local analysis without AI
   * Returns full task metadata if confident, otherwise indicates AI is needed
   */
  analyzeLocally(text: string): {
    confident: boolean;
    category?: string;
    isTiny?: boolean;
    deadline?: Date | null;
    priority?: 'must' | 'should' | 'could';
  } {
    // Check learned patterns first
    const learnedCategory = this.getLearnedCategory(text);
    if (learnedCategory) {
      return {
        confident: true,
        category: learnedCategory,
        isTiny: this.isTinyTask(text),
        deadline: this.extractDeadline(text),
        priority: this.getPriority(text) || 'should'
      };
    }
    
    // Try pattern matching
    const categorization = this.categorizeLocally(text);
    
    if (!categorization.shouldUseAI) {
      return {
        confident: true,
        category: categorization.category,
        isTiny: this.isTinyTask(text),
        deadline: this.extractDeadline(text),
        priority: this.getPriority(text) || 'should'
      };
    }
    
    return { confident: false };
  }
}

// Singleton instance
export const localMatcher = new LocalPatternMatcher();
