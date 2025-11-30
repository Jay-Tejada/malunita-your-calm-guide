// Web Worker for heavy AI processing
// Runs in separate thread to keep UI responsive

interface Task {
  id: string;
  title: string;
  category?: string;
  created_at: string;
  completed: boolean;
  is_tiny_task?: boolean;
  reminder_time?: string;
  [key: string]: any;
}

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  mood?: string;
}

interface AnalyzePatterns {
  categoryDistribution: Record<string, number>;
  peakHours: number[];
  recurringTasks: string[];
}

interface GenerateInsights {
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  themes: string[];
  totalEntries: number;
}

// Web Worker message handler
self.addEventListener('message', async (e: MessageEvent) => {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'ANALYZE_PATTERNS':
        const patterns = await analyzePatterns(data.tasks);
        self.postMessage({ type: 'PATTERNS_READY', patterns });
        break;
        
      case 'GENERATE_INSIGHTS':
        const insights = await generateInsights(data.entries);
        self.postMessage({ type: 'INSIGHTS_READY', insights });
        break;
        
      case 'CATEGORIZE_BATCH':
        const categorized = await categorizeBatch(data.tasks);
        self.postMessage({ type: 'BATCH_CATEGORIZED', categorized });
        break;
        
      case 'COMPUTE_PRIORITIES':
        const priorities = await computePriorities(data.tasks);
        self.postMessage({ type: 'PRIORITIES_READY', priorities });
        break;
        
      case 'DETECT_BURNOUT':
        const burnout = await detectBurnout(data.tasks, data.journal);
        self.postMessage({ type: 'BURNOUT_DETECTED', burnout });
        break;
        
      default:
        self.postMessage({ type: 'ERROR', error: 'Unknown task type' });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Analyze patterns in tasks
 * Finds category distribution, peak activity hours, and recurring tasks
 */
async function analyzePatterns(tasks: Task[]): Promise<AnalyzePatterns> {
  // Group by category
  const byCategory = tasks.reduce((acc, task) => {
    const category = task.category || 'inbox';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Find time patterns
  const byHour = tasks.reduce((acc, task) => {
    const hour = new Date(task.created_at).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  // Get top 3 peak hours
  const peakHours = Object.entries(byHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
  
  // Detect recurring tasks (tasks with similar titles)
  const taskTitles = tasks.map(t => t.title.toLowerCase().trim());
  const recurring = taskTitles.filter((title, i) => {
    // Find if this title appears elsewhere
    const firstIndex = taskTitles.indexOf(title);
    return firstIndex !== i && title.length > 5; // Only count if >5 chars
  });
  
  return {
    categoryDistribution: byCategory,
    peakHours,
    recurringTasks: [...new Set(recurring)],
  };
}

/**
 * Generate insights from journal entries
 * Performs sentiment analysis and theme detection
 */
async function generateInsights(entries: JournalEntry[]): Promise<GenerateInsights> {
  // Sentiment analysis (keyword-based)
  const positiveWords = /\b(happy|great|awesome|done|finished|completed|success|achieved|proud|excited|grateful|amazing|wonderful|excellent|fantastic|joy|love|win|wins|progress|breakthrough)\b/gi;
  const negativeWords = /\b(stuck|confused|overwhelmed|tired|stressed|frustrated|difficult|hard|struggle|struggling|anxious|worried|concern|concerned|problem|problems|issue|issues|fail|failed|behind)\b/gi;
  
  const sentiment = {
    positive: 0,
    negative: 0,
    neutral: 0
  };
  
  entries.forEach(entry => {
    const content = entry.content.toLowerCase();
    const positiveMatches = content.match(positiveWords)?.length || 0;
    const negativeMatches = content.match(negativeWords)?.length || 0;
    
    if (positiveMatches > negativeMatches) {
      sentiment.positive++;
    } else if (negativeMatches > positiveMatches) {
      sentiment.negative++;
    } else {
      sentiment.neutral++;
    }
  });
  
  // Detect themes (most common meaningful words)
  const words = entries
    .map(e => e.content.toLowerCase().split(/\s+/))
    .flat()
    .filter(w => {
      // Filter out short words, common words, and numbers
      return w.length > 4 && 
        !/^\d+$/.test(w) &&
        !['about', 'after', 'before', 'could', 'would', 'should', 'there', 'their', 'these', 'those', 'which', 'where', 'while'].includes(w);
    });
    
  const wordFreq = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const themes = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  return {
    sentiment,
    themes,
    totalEntries: entries.length,
  };
}

/**
 * Categorize tasks in batch using pattern matching
 */
async function categorizeBatch(tasks: Task[]): Promise<Task[]> {
  const categoryPatterns = {
    work: /\b(meeting|client|email|presentation|deadline|report|call|zoom|slack|project|boss|colleague|conference|review|proposal|budget|invoice|contract)\b/i,
    home: /\b(grocery|groceries|laundry|clean|cook|dinner|lunch|dishes|vacuum|trash|shopping|errands|bills|rent|utilities|repair|maintenance)\b/i,
    gym: /\b(workout|gym|exercise|run|running|yoga|fitness|stretch|cardio|weights|training|bike|swim|swimming|hike|hiking|sports)\b/i,
    projects: /\b(build|create|design|develop|plan|launch|prototype|mvp|feature|app|website|startup|product|code|coding|programming)\b/i,
  };
  
  return tasks.map(task => {
    // Skip if already categorized
    if (task.category && task.category !== 'inbox') {
      return task;
    }
    
    const text = task.title.toLowerCase();
    
    // Find matching category
    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(text)) {
        return {
          ...task,
          category,
        };
      }
    }
    
    // No match - leave as inbox
    return task;
  });
}

/**
 * Compute priority scores for tasks
 */
async function computePriorities(tasks: Task[]): Promise<Task[]> {
  const now = new Date();
  
  const scored = tasks.map(task => {
    let score = 0;
    
    // Has reminder time = +10
    if (task.reminder_time) score += 10;
    
    // Reminder is soon (within 24 hours) = +15
    if (task.reminder_time) {
      const reminderDate = new Date(task.reminder_time);
      const hoursTillReminder = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursTillReminder > 0 && hoursTillReminder < 24) {
        score += 15;
      }
      // Overdue reminder = +25
      if (hoursTillReminder < 0) {
        score += 25;
      }
    }
    
    // Long in inbox = +5
    const daysSinceCreated = (now.getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated > 3) score += Math.min(5 + Math.floor(daysSinceCreated - 3), 15);
    
    // Is tiny task = -5 (can be done quickly, lower urgency)
    if (task.is_tiny_task) score -= 5;
    
    // Already completed = -100 (push to bottom)
    if (task.completed) score -= 100;
    
    // Has person name = +3 (social obligation)
    if (task.has_person_name) score += 3;
    
    // Work category during work hours = +5
    const hour = now.getHours();
    if (task.category === 'work' && hour >= 9 && hour < 18) {
      score += 5;
    }
    
    // Determine priority level
    let priority: 'must' | 'should' | 'could';
    if (score >= 20) {
      priority = 'must';
    } else if (score >= 5) {
      priority = 'should';
    } else {
      priority = 'could';
    }
    
    return {
      ...task,
      priority_score: score,
      priority,
    };
  });
  
  // Sort by priority score (highest first)
  return scored.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
}

/**
 * Detect burnout risk from task and journal patterns
 */
async function detectBurnout(tasks: Task[], journal: JournalEntry[]): Promise<{
  risk: 'low' | 'medium' | 'high';
  factors: string[];
  score: number;
}> {
  let score = 0;
  const factors: string[] = [];
  
  // Check task completion rate (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const recentTasks = tasks.filter(t => new Date(t.created_at) >= weekAgo);
  const completedRecent = recentTasks.filter(t => t.completed).length;
  const completionRate = recentTasks.length > 0 ? completedRecent / recentTasks.length : 0;
  
  if (completionRate < 0.3) {
    score += 20;
    factors.push('Low task completion rate');
  }
  
  // Check for overdue tasks
  const overdueTasks = tasks.filter(t => {
    if (!t.reminder_time || t.completed) return false;
    return new Date(t.reminder_time) < new Date();
  });
  
  if (overdueTasks.length > 5) {
    score += 15;
    factors.push('Multiple overdue tasks');
  }
  
  // Check for inbox pile-up
  const inboxTasks = tasks.filter(t => 
    (t.category === 'inbox' || !t.category) && !t.completed
  );
  
  if (inboxTasks.length > 20) {
    score += 10;
    factors.push('Large inbox backlog');
  }
  
  // Check journal sentiment (last 7 days)
  const recentJournal = journal.filter(j => new Date(j.created_at) >= weekAgo);
  const negativeWords = /\b(stuck|confused|overwhelmed|tired|stressed|frustrated|difficult|anxious|worried)\b/gi;
  
  const negativeEntries = recentJournal.filter(j => 
    negativeWords.test(j.content)
  ).length;
  
  const negativeRate = recentJournal.length > 0 ? negativeEntries / recentJournal.length : 0;
  
  if (negativeRate > 0.5) {
    score += 25;
    factors.push('Frequent negative sentiment in journal');
  }
  
  // Check for lack of breaks (many tasks, no journal entries)
  if (recentTasks.length > 30 && recentJournal.length < 3) {
    score += 15;
    factors.push('High workload with minimal reflection');
  }
  
  // Determine risk level
  let risk: 'low' | 'medium' | 'high';
  if (score >= 50) {
    risk = 'high';
  } else if (score >= 25) {
    risk = 'medium';
  } else {
    risk = 'low';
  }
  
  return {
    risk,
    factors,
    score,
  };
}

// Export for TypeScript (this won't be executed but helps with types)
export {};
