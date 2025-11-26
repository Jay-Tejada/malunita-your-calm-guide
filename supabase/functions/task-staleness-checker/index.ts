import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting task staleness check...');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    // Get all incomplete tasks
    const { data: tasks, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('id, created_at, user_id')
      .eq('completed', false);

    if (fetchError) {
      console.error('Error fetching tasks:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tasks?.length || 0} incomplete tasks`);

    // Categorize tasks by staleness
    const updates = {
      expiring: [] as string[],
      decision_required: [] as string[],
      stale: [] as string[],
    };

    tasks?.forEach(task => {
      const taskDate = new Date(task.created_at);
      
      if (taskDate <= twentyOneDaysAgo) {
        updates.expiring.push(task.id);
      } else if (taskDate <= fourteenDaysAgo) {
        updates.decision_required.push(task.id);
      } else if (taskDate <= sevenDaysAgo) {
        updates.stale.push(task.id);
      }
    });

    console.log('Task staleness breakdown:', {
      expiring: updates.expiring.length,
      decision_required: updates.decision_required.length,
      stale: updates.stale.length,
    });

    // Update tasks in batches
    const updatePromises = [];

    if (updates.expiring.length > 0) {
      updatePromises.push(
        supabaseClient
          .from('tasks')
          .update({ staleness_status: 'expiring' })
          .in('id', updates.expiring)
      );
    }

    if (updates.decision_required.length > 0) {
      updatePromises.push(
        supabaseClient
          .from('tasks')
          .update({ staleness_status: 'decision_required' })
          .in('id', updates.decision_required)
      );
    }

    if (updates.stale.length > 0) {
      updatePromises.push(
        supabaseClient
          .from('tasks')
          .update({ staleness_status: 'stale' })
          .in('id', updates.stale)
      );
    }

    const results = await Promise.all(updatePromises);
    
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Some updates failed:', errors);
    }

    console.log('Task staleness check completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        updated: {
          expiring: updates.expiring.length,
          decision_required: updates.decision_required.length,
          stale: updates.stale.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in task-staleness-checker:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});