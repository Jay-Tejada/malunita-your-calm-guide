import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  category?: string;
  context?: string;
  is_tiny_task?: boolean;
  ai_metadata?: any;
}

interface Phase {
  title: string;
  description: string;
  tasks: Array<{
    id: string;
    title: string;
    tiny: boolean;
    priority: 'must' | 'should' | 'could';
    reason: string;
  }>;
}

interface Dependency {
  before_task_id: string;
  after_task_id: string;
  reason: string;
}

interface QuickWin {
  id: string;
  title: string;
}

interface Blocker {
  id: string;
  title: string;
  missing_info: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Building plan for user: ${user.id}`);

    // Fetch all incomplete tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw new Error('Failed to fetch tasks');
    }

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({
          plan: {
            phases: [],
            dependencies: [],
            quick_wins: [],
            blockers: [],
            summary: 'No tasks to plan'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${tasks.length} tasks for plan generation...`);

    // Step 1: Score priorities for all tasks
    const priorityResults = await Promise.all(
      tasks.slice(0, 30).map(async (task) => {
        const { data } = await supabase.functions.invoke('score-task-priority', {
          body: { task_id: task.id, user_id: user.id }
        });
        return {
          task_id: task.id,
          priority_score: data?.priority_score || 0,
          priority: data?.priority || 'could'
        };
      })
    );

    // Step 2: Detect tiny tasks
    const tinyResults = await Promise.all(
      tasks.slice(0, 30).map(async (task) => {
        const { data } = await supabase.functions.invoke('classify-tiny-task', {
          body: { task_title: task.title, user_id: user.id }
        });
        return {
          task_id: task.id,
          is_tiny: data?.is_tiny || false,
          estimated_minutes: data?.estimated_minutes || 0
        };
      })
    );

    // Step 3: Categorize tasks
    const categoryResults = await Promise.all(
      tasks.slice(0, 30).map(async (task) => {
        const { data } = await supabase.functions.invoke('categorize-task', {
          body: { task_title: task.title, user_id: user.id }
        });
        return {
          task_id: task.id,
          category: data?.category || 'uncategorized',
          context: data?.context || ''
        };
      })
    );

    // Build enriched task list
    const enrichedTasks = tasks.slice(0, 30).map(task => {
      const priority = priorityResults.find(p => p.task_id === task.id);
      const tiny = tinyResults.find(t => t.task_id === task.id);
      const category = categoryResults.find(c => c.task_id === task.id);
      
      return {
        ...task,
        priority: priority?.priority || 'could',
        priority_score: priority?.priority_score || 0,
        is_tiny: tiny?.is_tiny || false,
        estimated_minutes: tiny?.estimated_minutes || 0,
        category: category?.category || 'uncategorized',
        context: category?.context || ''
      };
    });

    // Organize into phases
    const phases: Phase[] = [];
    const quick_wins: QuickWin[] = [];
    const blockers: Blocker[] = [];
    const dependencies: Dependency[] = [];

    // Phase 1: Quick Wins (tiny + must/should)
    const quickWinTasks = enrichedTasks.filter(
      t => t.is_tiny && (t.priority === 'must' || t.priority === 'should')
    );
    if (quickWinTasks.length > 0) {
      phases.push({
        title: 'Quick Wins',
        description: 'Start with these small, high-impact tasks to build momentum',
        tasks: quickWinTasks.map(t => ({
          id: t.id,
          title: t.title,
          tiny: true,
          priority: t.priority as 'must' | 'should' | 'could',
          reason: `${t.estimated_minutes}min · High priority`
        }))
      });
      quickWinTasks.forEach(t => {
        quick_wins.push({ id: t.id, title: t.title });
      });
    }

    // Phase 2: Critical Tasks (must + not tiny)
    const criticalTasks = enrichedTasks.filter(
      t => t.priority === 'must' && !t.is_tiny
    );
    if (criticalTasks.length > 0) {
      phases.push({
        title: 'Critical Focus',
        description: 'High-priority tasks that need focused attention',
        tasks: criticalTasks.map(t => ({
          id: t.id,
          title: t.title,
          tiny: false,
          priority: 'must',
          reason: t.context || 'Critical priority'
        }))
      });
    }

    // Phase 3: Group by category (should priority)
    const categoryMap = new Map<string, typeof enrichedTasks>();
    enrichedTasks
      .filter(t => t.priority === 'should' && !t.is_tiny)
      .forEach(task => {
        const cat = task.category || 'uncategorized';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, []);
        }
        categoryMap.get(cat)?.push(task);
      });

    categoryMap.forEach((categoryTasks, category) => {
      if (categoryTasks.length > 0 && category !== 'uncategorized') {
        phases.push({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Tasks`,
          description: `Organized tasks related to ${category}`,
          tasks: categoryTasks.map(t => ({
            id: t.id,
            title: t.title,
            tiny: false,
            priority: 'should',
            reason: t.context || `Part of ${category} workflow`
          }))
        });
      }
    });

    // Phase 4: Nice to Have (could priority)
    const niceTohaveTasks = enrichedTasks.filter(
      t => t.priority === 'could' && !t.is_tiny
    ).slice(0, 5);
    if (niceTohaveTasks.length > 0) {
      phases.push({
        title: 'Nice to Have',
        description: 'Lower priority tasks to tackle when you have time',
        tasks: niceTohaveTasks.map(t => ({
          id: t.id,
          title: t.title,
          tiny: false,
          priority: 'could',
          reason: t.context || 'Lower priority'
        }))
      });
    }

    // Identify blockers (tasks with missing info in title)
    enrichedTasks.forEach(task => {
      if (
        task.title.includes('?') || 
        task.title.includes('TBD') || 
        task.title.includes('todo') ||
        task.title.length < 10
      ) {
        blockers.push({
          id: task.id,
          title: task.title,
          missing_info: 'Task needs clarification'
        });
      }
    });

    // Simple dependency detection (tasks with "after" or "before" in title)
    enrichedTasks.forEach((task, idx) => {
      if (task.title.toLowerCase().includes('after') && idx > 0) {
        dependencies.push({
          before_task_id: enrichedTasks[idx - 1].id,
          after_task_id: task.id,
          reason: 'Sequence indicated in task title'
        });
      }
    });

    const summary = `Generated ${phases.length} execution phases covering ${enrichedTasks.length} tasks. ${quick_wins.length} quick wins identified. ${blockers.length} tasks need clarification.`;

    console.log('Plan generation complete:', summary);

    return new Response(
      JSON.stringify({
        plan: {
          phases,
          dependencies,
          quick_wins,
          blockers,
          summary
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in task-to-plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to build plan';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
