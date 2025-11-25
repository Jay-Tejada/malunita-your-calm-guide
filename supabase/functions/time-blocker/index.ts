import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimeBlock {
  start_time: string;
  end_time: string;
  label: string;
  tasks: { id: string; title: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, date } = await req.json();

    if (!user_id || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating time blocks for user: ${user_id}, date: ${date}`);

    // Fetch incomplete tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user_id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ blocks: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Score task priorities using existing score-task-priority
    const priorityResults = await Promise.all(
      tasks.slice(0, 20).map(async (task) => {
        const { data } = await supabase.functions.invoke('score-task-priority', {
          body: { task_id: task.id, user_id }
        });
        return { ...task, priority_score: data?.priority_score || 0 };
      })
    );

    // Step 2: Classify tiny tasks
    const tinyTaskResults = await Promise.all(
      tasks.slice(0, 20).map(async (task) => {
        const { data } = await supabase.functions.invoke('classify-tiny-task', {
          body: { task_title: task.title, user_id }
        });
        return { task_id: task.id, is_tiny: data?.is_tiny, estimated_minutes: data?.estimated_minutes };
      })
    );

    // Step 3: Get context for tasks
    const taskContexts = await Promise.all(
      tasks.slice(0, 20).map(async (task) => {
        const { data } = await supabase.functions.invoke('categorize-task', {
          body: { task_title: task.title, user_id }
        });
        return { task_id: task.id, context: data?.context, category: data?.category };
      })
    );

    // Organize tasks by priority and type
    const highPriorityTasks = priorityResults
      .filter(t => t.priority_score > 0.7)
      .sort((a, b) => b.priority_score - a.priority_score);
    
    const tinyTasks = tasks.filter(t => 
      tinyTaskResults.find(tr => tr.task_id === t.id && tr.is_tiny)
    );
    
    const workTasks = tasks.filter(t => 
      taskContexts.find(tc => tc.task_id === t.id && tc.context === 'work')
    );
    
    const personalTasks = tasks.filter(t => 
      taskContexts.find(tc => tc.task_id === t.id && tc.context === 'personal')
    );

    // Generate time blocks based on AI analysis
    const blocks: TimeBlock[] = [];
    let currentHour = 9;

    // Deep Work block for high-priority tasks (2 hours)
    if (highPriorityTasks.length > 0) {
      blocks.push({
        start_time: `${currentHour}:00`,
        end_time: `${currentHour + 2}:00`,
        label: 'Deep Work',
        tasks: highPriorityTasks.slice(0, 2).map(t => ({ id: t.id, title: t.title }))
      });
      currentHour += 2;
    }

    // Quick Wins block for tiny tasks (1 hour)
    if (tinyTasks.length > 0) {
      blocks.push({
        start_time: `${currentHour}:00`,
        end_time: `${currentHour + 1}:00`,
        label: 'Quick Wins',
        tasks: tinyTasks.slice(0, 5).map(t => ({ id: t.id, title: t.title }))
      });
      currentHour += 1;
    }

    // Break
    currentHour += 0.5;

    // Focus block for work tasks (1.5 hours)
    if (workTasks.length > 0) {
      blocks.push({
        start_time: `${Math.floor(currentHour)}:${currentHour % 1 === 0 ? '00' : '30'}`,
        end_time: `${Math.floor(currentHour + 1.5)}:${(currentHour + 1.5) % 1 === 0 ? '00' : '30'}`,
        label: 'Focus',
        tasks: workTasks.slice(0, 2).map(t => ({ id: t.id, title: t.title }))
      });
      currentHour += 1.5;
    }

    // Personal tasks block (1 hour)
    if (personalTasks.length > 0) {
      blocks.push({
        start_time: `${Math.floor(currentHour)}:${currentHour % 1 === 0 ? '00' : '30'}`,
        end_time: `${Math.floor(currentHour + 1)}:${(currentHour + 1) % 1 === 0 ? '00' : '30'}`,
        label: 'Personal',
        tasks: personalTasks.slice(0, 2).map(t => ({ id: t.id, title: t.title }))
      });
      currentHour += 1;
    }

    // Wrap-up block with remaining tiny tasks (30 min)
    if (tinyTasks.length > 5) {
      blocks.push({
        start_time: `${Math.floor(currentHour)}:${currentHour % 1 === 0 ? '00' : '30'}`,
        end_time: `${Math.floor(currentHour + 0.5)}:${(currentHour + 0.5) % 1 === 0 ? '00' : '30'}`,
        label: 'Wrap-up',
        tasks: tinyTasks.slice(5, 8).map(t => ({ id: t.id, title: t.title }))
      });
    }

    console.log(`Generated ${blocks.length} time blocks`);

    return new Response(
      JSON.stringify({ blocks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in time-blocker:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
