import { supabase } from '@/integrations/supabase/client';
import { loadClusterAnalysis } from './knowledgeClusters';

export interface DominoEffect {
  unlocks_count: number;
  unlocked_tasks: Array<{
    id: string;
    title: string;
    relationship: 'blocker' | 'prerequisite' | 'related' | 'cluster';
  }>;
  reasoning: string[];
}

interface Task {
  id: string;
  title: string;
  category?: string;
  keywords?: string[];
  context?: string;
  created_at: string;
}

/**
 * Analyze keyword overlap between two tasks
 */
function calculateKeywordOverlap(task1Keywords: string[], task2Keywords: string[]): number {
  if (!task1Keywords.length || !task2Keywords.length) return 0;
  
  const set1 = new Set(task1Keywords.map(k => k.toLowerCase()));
  const set2 = new Set(task2Keywords.map(k => k.toLowerCase()));
  
  const intersection = new Set([...set1].filter(k => set2.has(k)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

/**
 * Extract action verbs and nouns from task title
 */
function extractTaskComponents(title: string): { verbs: string[], nouns: string[] } {
  const lowerTitle = title.toLowerCase();
  
  // Common action verbs that indicate blocking relationships
  const blockingVerbs = [
    'create', 'build', 'design', 'develop', 'write', 'draft', 'prepare',
    'setup', 'configure', 'install', 'research', 'analyze', 'plan'
  ];
  
  // Extract verbs
  const verbs = blockingVerbs.filter(verb => lowerTitle.includes(verb));
  
  // Extract nouns (simplified - words that are likely subjects)
  const words = title.split(/\s+/);
  const nouns = words.filter(word => 
    word.length > 3 && 
    !blockingVerbs.includes(word.toLowerCase()) &&
    !/^(the|and|or|but|for|with|from|to|in|on|at|by)$/i.test(word)
  );
  
  return { verbs, nouns };
}

/**
 * Detect if task1 might block task2
 */
function detectBlockingRelationship(task1: Task, task2: Task): {
  isBlocker: boolean;
  relationship: 'blocker' | 'prerequisite' | 'related' | 'cluster' | null;
  confidence: number;
} {
  const components1 = extractTaskComponents(task1.title);
  const components2 = extractTaskComponents(task2.title);
  
  // Check for explicit blocking language
  const task2Lower = task2.title.toLowerCase();
  const hasBlockingLanguage = 
    task2Lower.includes('after') ||
    task2Lower.includes('once') ||
    task2Lower.includes('when') ||
    task2Lower.includes('following') ||
    task2Lower.includes('depends on');
  
  if (hasBlockingLanguage) {
    // Check if task1 is mentioned or implied in task2
    const task1Keywords = task1.title.toLowerCase().split(/\s+/);
    const mentionsTask1 = task1Keywords.some(word => 
      word.length > 3 && task2Lower.includes(word)
    );
    
    if (mentionsTask1) {
      return { isBlocker: true, relationship: 'blocker', confidence: 0.9 };
    }
  }
  
  // Check for prerequisite patterns (setup → use, create → edit, etc.)
  const prerequisitePatterns: Record<string, string[]> = {
    'setup': ['configure', 'use', 'run', 'test'],
    'create': ['edit', 'update', 'modify', 'review', 'share'],
    'design': ['implement', 'build', 'develop'],
    'research': ['decide', 'plan', 'choose'],
    'write': ['review', 'edit', 'publish', 'send'],
    'plan': ['execute', 'implement', 'start'],
  };
  
  for (const [prereqVerb, followupVerbs] of Object.entries(prerequisitePatterns)) {
    const hasPrereqVerb = components1.verbs.includes(prereqVerb);
    const hasFollowupVerb = components2.verbs.some(v => followupVerbs.includes(v));
    
    if (hasPrereqVerb && hasFollowupVerb) {
      // Check if they share nouns (same subject)
      const sharedNouns = components1.nouns.filter(n1 =>
        components2.nouns.some(n2 => 
          n2.toLowerCase().includes(n1.toLowerCase()) ||
          n1.toLowerCase().includes(n2.toLowerCase())
        )
      );
      
      if (sharedNouns.length > 0) {
        return { isBlocker: true, relationship: 'prerequisite', confidence: 0.8 };
      }
    }
  }
  
  // Check keyword overlap
  if (task1.keywords && task2.keywords) {
    const overlap = calculateKeywordOverlap(task1.keywords, task2.keywords);
    if (overlap > 0.4) {
      return { isBlocker: false, relationship: 'related', confidence: overlap };
    }
  }
  
  // Check category match
  if (task1.category && task2.category && task1.category === task2.category) {
    return { isBlocker: false, relationship: 'related', confidence: 0.5 };
  }
  
  return { isBlocker: false, relationship: null, confidence: 0 };
}

/**
 * Analyze domino effect of completing a primary focus task
 */
export async function analyzeDominoEffect(primaryFocusTask: Task): Promise<DominoEffect> {
  const reasoning: string[] = [];
  const unlockedTasks: DominoEffect['unlocked_tasks'] = [];
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found for domino effect analysis');
      return { unlocks_count: 0, unlocked_tasks: [], reasoning: [] };
    }

    // Fetch all open tasks except the primary focus
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .neq('id', primaryFocusTask.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!allTasks || allTasks.length === 0) {
      return { unlocks_count: 0, unlocked_tasks: [], reasoning: ['No other open tasks'] };
    }

    console.log(`Analyzing domino effect for "${primaryFocusTask.title}" against ${allTasks.length} tasks`);

    // Check cluster relationships
    const clusterAnalysis = loadClusterAnalysis();
    let primaryFocusCluster: string | null = null;
    
    if (clusterAnalysis) {
      const cluster = clusterAnalysis.clusters.find(c => 
        c.tasks.includes(primaryFocusTask.id)
      );
      primaryFocusCluster = cluster?.name || null;
      
      if (primaryFocusCluster) {
        reasoning.push(`Part of "${primaryFocusCluster}" cluster`);
      }
    }

    // Analyze each task for blocking relationships
    for (const task of allTasks) {
      const blockingAnalysis = detectBlockingRelationship(primaryFocusTask, task);
      
      if (blockingAnalysis.isBlocker && blockingAnalysis.relationship) {
        unlockedTasks.push({
          id: task.id,
          title: task.title,
          relationship: blockingAnalysis.relationship,
        });
        
        if (blockingAnalysis.relationship === 'blocker') {
          reasoning.push(`Directly blocks "${task.title}"`);
        } else if (blockingAnalysis.relationship === 'prerequisite') {
          reasoning.push(`Prerequisite for "${task.title}"`);
        }
      } else if (blockingAnalysis.relationship === 'related' && blockingAnalysis.confidence > 0.5) {
        unlockedTasks.push({
          id: task.id,
          title: task.title,
          relationship: 'related',
        });
      } else if (primaryFocusCluster && clusterAnalysis) {
        // Check if task is in the same cluster
        const taskCluster = clusterAnalysis.clusters.find(c => 
          c.tasks.includes(task.id)
        );
        
        if (taskCluster?.name === primaryFocusCluster) {
          unlockedTasks.push({
            id: task.id,
            title: task.title,
            relationship: 'cluster',
          });
        }
      }
    }

    // Deduplicate unlocked tasks
    const uniqueUnlockedTasks = Array.from(
      new Map(unlockedTasks.map(t => [t.id, t])).values()
    );

    // Sort by relationship priority
    const sortedUnlockedTasks = uniqueUnlockedTasks.sort((a, b) => {
      const priority = { blocker: 0, prerequisite: 1, related: 2, cluster: 3 };
      return priority[a.relationship] - priority[b.relationship];
    });

    const unlocks_count = sortedUnlockedTasks.length;

    if (unlocks_count > 0) {
      console.log(`Domino effect: "${primaryFocusTask.title}" unlocks ${unlocks_count} tasks`);
    } else {
      reasoning.push('Standalone task with no direct dependencies');
    }

    return {
      unlocks_count,
      unlocked_tasks: sortedUnlockedTasks,
      reasoning,
    };
  } catch (error) {
    console.error('Error analyzing domino effect:', error);
    return {
      unlocks_count: 0,
      unlocked_tasks: [],
      reasoning: ['Error analyzing dependencies'],
    };
  }
}

/**
 * Get a summary string for display
 */
export function getDominoEffectSummary(dominoEffect: DominoEffect): string {
  if (dominoEffect.unlocks_count === 0) {
    return '';
  }
  
  if (dominoEffect.unlocks_count === 1) {
    return 'Completing this will unlock 1 related task.';
  }
  
  return `Completing this will unlock ${dominoEffect.unlocks_count} related tasks.`;
}

/**
 * Cache domino effect analysis for a task (24 hour TTL)
 */
const dominoCache = new Map<string, { effect: DominoEffect; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedDominoEffect(primaryFocusTask: Task): Promise<DominoEffect> {
  const cacheKey = `${primaryFocusTask.id}-${new Date().toISOString().split('T')[0]}`;
  const cached = dominoCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('Using cached domino effect analysis');
    return cached.effect;
  }
  
  const effect = await analyzeDominoEffect(primaryFocusTask);
  dominoCache.set(cacheKey, { effect, timestamp: Date.now() });
  
  return effect;
}
