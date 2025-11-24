import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  category?: string;
  keywords?: string[];
  context?: string;
  created_at: string;
}

interface DominoEffect {
  unlocks_count: number;
  unlocked_tasks: Array<{
    id: string;
    title: string;
    relationship: 'blocker' | 'prerequisite' | 'related' | 'cluster';
  }>;
  reasoning: string[];
}

function calculateKeywordOverlap(task1Keywords: string[], task2Keywords: string[]): number {
  if (!task1Keywords.length || !task2Keywords.length) return 0;
  
  const set1 = new Set(task1Keywords.map((k: string) => k.toLowerCase()));
  const set2 = new Set(task2Keywords.map((k: string) => k.toLowerCase()));
  
  const intersection = new Set([...set1].filter(k => set2.has(k)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function extractTaskComponents(title: string): { verbs: string[], nouns: string[] } {
  const lowerTitle = title.toLowerCase();
  
  const blockingVerbs = [
    'create', 'build', 'design', 'develop', 'write', 'draft', 'prepare',
    'setup', 'configure', 'install', 'research', 'analyze', 'plan'
  ];
  
  const verbs = blockingVerbs.filter(verb => lowerTitle.includes(verb));
  
  const words = title.split(/\s+/);
  const nouns = words.filter(word => 
    word.length > 3 && 
    !blockingVerbs.includes(word.toLowerCase()) &&
    !/^(the|and|or|but|for|with|from|to|in|on|at|by)$/i.test(word)
  );
  
  return { verbs, nouns };
}

function detectBlockingRelationship(task1: Task, task2: Task): {
  isBlocker: boolean;
  relationship: 'blocker' | 'prerequisite' | 'related' | null;
  confidence: number;
} {
  const components1 = extractTaskComponents(task1.title);
  const components2 = extractTaskComponents(task2.title);
  
  const task2Lower = task2.title.toLowerCase();
  const hasBlockingLanguage = 
    task2Lower.includes('after') ||
    task2Lower.includes('once') ||
    task2Lower.includes('when') ||
    task2Lower.includes('following') ||
    task2Lower.includes('depends on');
  
  if (hasBlockingLanguage) {
    const task1Keywords = task1.title.toLowerCase().split(/\s+/);
    const mentionsTask1 = task1Keywords.some(word => 
      word.length > 3 && task2Lower.includes(word)
    );
    
    if (mentionsTask1) {
      return { isBlocker: true, relationship: 'blocker', confidence: 0.9 };
    }
  }
  
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
  
  if (task1.keywords && task2.keywords) {
    const overlap = calculateKeywordOverlap(task1.keywords, task2.keywords);
    if (overlap > 0.4) {
      return { isBlocker: false, relationship: 'related', confidence: overlap };
    }
  }
  
  if (task1.category && task2.category && task1.category === task2.category) {
    return { isBlocker: false, relationship: 'related', confidence: 0.5 };
  }
  
  return { isBlocker: false, relationship: null, confidence: 0 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { task } = await req.json();
    
    if (!task || !task.id || !task.title) {
      return new Response(
        JSON.stringify({ error: 'Invalid task data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const primaryFocusTask: Task = task;
    const reasoning: string[] = [];
    const unlockedTasks: DominoEffect['unlocked_tasks'] = [];

    // Fetch all open tasks except the primary focus
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .neq('id', primaryFocusTask.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
      throw new Error('Failed to fetch tasks');
    }

    if (!allTasks || allTasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          unlocks_count: 0, 
          unlocked_tasks: [], 
          reasoning: ['No other open tasks'] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing domino effect for "${primaryFocusTask.title}" against ${allTasks.length} tasks`);

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

    return new Response(
      JSON.stringify({
        unlocks_count,
        unlocked_tasks: sortedUnlockedTasks,
        reasoning,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Domino effect analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
