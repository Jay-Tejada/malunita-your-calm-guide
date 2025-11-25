import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  category: string | null;
  context: string | null;
  is_tiny_task: boolean | null;
  ai_metadata: any;
}

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

    const { user_id, date, available_hours = 8 } = await req.json();

    if (!user_id || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch incomplete tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, category, context, is_tiny_task, ai_metadata')
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

    // Categorize tasks
    const tinyTasks = tasks?.filter(t => t.is_tiny_task) || [];
    const focusTasks = tasks?.filter(t => !t.is_tiny_task && t.category === 'work') || [];
    const personalTasks = tasks?.filter(t => !t.is_tiny_task && t.category === 'personal') || [];
    const otherTasks = tasks?.filter(t => !t.is_tiny_task && t.category !== 'work' && t.category !== 'personal') || [];

    // Generate time blocks
    const blocks: TimeBlock[] = [];
    let currentHour = 9; // Start at 9 AM

    // Deep work block (2 hours)
    if (focusTasks.length > 0) {
      blocks.push({
        start_time: `${currentHour}:00`,
        end_time: `${currentHour + 2}:00`,
        label: 'Deep Work',
        tasks: focusTasks.slice(0, 2).map(t => ({ id: t.id, title: t.title }))
      });
      currentHour += 2;
    }

    // Admin/tiny tasks block (1 hour)
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

    // Focus block (1.5 hours)
    if (otherTasks.length > 0) {
      blocks.push({
        start_time: `${Math.floor(currentHour)}:${currentHour % 1 === 0 ? '00' : '30'}`,
        end_time: `${Math.floor(currentHour + 1.5)}:${(currentHour + 1.5) % 1 === 0 ? '00' : '30'}`,
        label: 'Focus',
        tasks: otherTasks.slice(0, 2).map(t => ({ id: t.id, title: t.title }))
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

    // Wrap-up block (30 min)
    blocks.push({
      start_time: `${Math.floor(currentHour)}:${currentHour % 1 === 0 ? '00' : '30'}`,
      end_time: `${Math.floor(currentHour + 0.5)}:${(currentHour + 0.5) % 1 === 0 ? '00' : '30'}`,
      label: 'Wrap-up',
      tasks: tinyTasks.slice(5, 8).map(t => ({ id: t.id, title: t.title }))
    });

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
