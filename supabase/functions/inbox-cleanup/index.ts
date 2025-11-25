import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log(`Fetching inbox tasks for user: ${user.id}`);

    // Fetch inbox tasks
    const { data: inboxTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .or('category.eq.inbox,category.is.null')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw new Error('Failed to fetch inbox tasks');
    }

    if (!inboxTasks || inboxTasks.length === 0) {
      return new Response(
        JSON.stringify({
          grouped_tasks: [],
          quick_wins: [],
          archive_suggestions: [],
          questions: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${inboxTasks.length} inbox tasks...`);

    // Step 1: Call idea-analyzer to understand themes and context
    const { data: ideaAnalysis, error: ideaError } = await supabase.functions.invoke(
      'idea-analyzer',
      {
        body: {
          text: inboxTasks.map(t => t.title).join('\n'),
          user_id: user.id
        }
      }
    );

    if (ideaError) {
      console.error('idea-analyzer error:', ideaError);
    }

    // Step 2: Call categorize-task to help with grouping
    const taskContexts = await Promise.all(
      inboxTasks.slice(0, 20).map(async (task) => {
        const { data } = await supabase.functions.invoke('categorize-task', {
          body: { task_title: task.title, user_id: user.id }
        });
        return { task_id: task.id, category: data?.category, context: data?.context };
      })
    );

    // Step 3: Detect tiny tasks
    const tinyTaskResults = await Promise.all(
      inboxTasks.slice(0, 20).map(async (task) => {
        const { data } = await supabase.functions.invoke('classify-tiny-task', {
          body: { task_title: task.title, user_id: user.id }
        });
        return { task_id: task.id, is_tiny: data?.is_tiny, estimated_minutes: data?.estimated_minutes };
      })
    );

    // Build analysis using existing AI outputs
    const grouped_tasks: Array<{
      group_title: string;
      reason: string;
      task_ids: string[];
    }> = [];
    
    const quick_wins: Array<{
      task_id: string;
      reason: string;
    }> = [];
    
    const archive_suggestions: Array<{
      task_id: string;
      reason: string;
    }> = [];
    
    const questions: Array<{
      task_id: string;
      question: string;
    }> = [];

    // Group by category from categorize-task
    const categoryGroups = new Map<string, string[]>();
    taskContexts.forEach(tc => {
      const cat = tc.category || 'uncategorized';
      if (!categoryGroups.has(cat)) {
        categoryGroups.set(cat, []);
      }
      categoryGroups.get(cat)?.push(tc.task_id);
    });

    categoryGroups.forEach((task_ids, category) => {
      if (task_ids.length > 1 && category !== 'uncategorized') {
        grouped_tasks.push({
          group_title: `${category.charAt(0).toUpperCase() + category.slice(1)} Tasks`,
          reason: `All related to ${category}`,
          task_ids
        });
      }
    });

    // Identify quick wins from tiny task detection
    tinyTaskResults.forEach(ttr => {
      if (ttr.is_tiny && ttr.estimated_minutes && ttr.estimated_minutes < 5) {
        quick_wins.push({
          task_id: ttr.task_id,
          reason: `Estimated ${ttr.estimated_minutes} minutes`
        });
      }
    });

    // Suggest archiving old tasks (>30 days old)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    inboxTasks.forEach(task => {
      const createdDate = new Date(task.created_at);
      if (createdDate < thirtyDaysAgo) {
        archive_suggestions.push({
          task_id: task.id,
          reason: 'Created over 30 days ago and still in inbox'
        });
      }
    });

    // Add questions for ambiguous tasks
    const uncategorizedTasks = taskContexts.filter(tc => 
      tc.category === 'uncategorized' || !tc.category
    ).slice(0, 3);

    uncategorizedTasks.forEach(ut => {
      const task = inboxTasks.find(t => t.id === ut.task_id);
      if (task) {
        questions.push({
          task_id: ut.task_id,
          question: `Is "${task.title}" still relevant? What category does it belong to?`
        });
      }
    });

    console.log('Inbox cleanup analysis complete');

    return new Response(
      JSON.stringify({
        grouped_tasks,
        quick_wins,
        archive_suggestions,
        questions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in inbox-cleanup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze inbox';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
