import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🤖 Auto-focus check triggered');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    console.log(`📅 Checking auto-focus for user ${userId} at hour ${currentHour}`);

    // Check if user has auto-focus enabled
    const { data: profile } = await supabase
      .from('profiles')
      .select('auto_focus_enabled, focus_persona')
      .eq('id', userId)
      .single();

    if (!profile?.auto_focus_enabled) {
      return new Response(
        JSON.stringify({ message: 'Auto-focus not enabled for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a ONE thing for today
    const { data: existingFocus } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_focus', true)
      .eq('focus_date', today)
      .maybeSingle();

    if (existingFocus) {
      console.log('✅ User already has a ONE thing for today');
      return new Response(
        JSON.stringify({ message: 'User already has focus task' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all incomplete tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (!tasks || tasks.length === 0) {
      console.log('❌ No tasks available for auto-focus');
      return new Response(
        JSON.stringify({ message: 'No tasks available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Analyzing ${tasks.length} tasks for auto-focus selection`);

    // Score tasks using multiple factors
    const scoredTasks = await Promise.all(
      tasks.map(async (task) => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Priority score (0-30 points)
        if (task.is_time_based) {
          score += 20;
          reasons.push('Time-sensitive');
        }
        if (task.reminder_time) {
          const reminderDate = new Date(task.reminder_time);
          if (reminderDate.toISOString().split('T')[0] === today) {
            score += 25;
            reasons.push('Due today');
          }
        }
        if (task.category === 'urgent' || task.category === 'primary_focus') {
          score += 15;
          reasons.push('High priority category');
        }

        // 2. Focus persona alignment (0-30 points)
        const focusPersona = profile?.focus_persona as any;
        if (focusPersona) {
          // Preference domain boost
          if (task.category && focusPersona.preference_domains?.[task.category]) {
            const boost = focusPersona.preference_domains[task.category] * 25;
            score += boost;
            reasons.push(`Matches preference (${task.category})`);
          }

          // Avoidance penalty
          if (task.category && focusPersona.avoidance_profile?.[task.category]) {
            const penalty = focusPersona.avoidance_profile[task.category] * 20;
            score -= penalty;
            if (penalty > 5) {
              reasons.push('Avoidance pattern detected');
            }
          }

          // Ambition-based complexity matching
          const taskComplexity = (task.title?.length || 0) / 200;
          const ambitionMatch = 1 - Math.abs((focusPersona.ambition || 0.5) - taskComplexity);
          const ambitionBoost = ambitionMatch * 15;
          score += ambitionBoost;
          if (ambitionMatch > 0.7) {
            reasons.push('Matches ambition level');
          }

          // Momentum bonus
          if (focusPersona.momentum > 0.6) {
            score += focusPersona.momentum * 10;
            reasons.push('Momentum boost');
          }
        }

        // 3. Cognitive load check (0-20 points)
        const wordCount = task.title.split(/\s+/).length;
        const isManageable = wordCount <= 10;
        if (isManageable) {
          score += 15;
          reasons.push('Manageable complexity');
        } else {
          score += 5;
        }

        // 4. Unlocks count (domino effect) - fetch from embeddings if available
        const { data: embedding } = await supabase
          .from('focus_embeddings')
          .select('unlocks_count')
          .eq('task_id', task.id)
          .maybeSingle();

        const unlocksCount = embedding?.unlocks_count || 0;
        if (unlocksCount > 0) {
          score += Math.min(unlocksCount * 3, 25);
          reasons.push(`Unlocks ${unlocksCount} tasks`);
        }

        // 5. Recency penalty (prefer newer tasks slightly)
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreation > 7) {
          score += 5;
          reasons.push('Older task');
        }

        return {
          task,
          score,
          reasons,
        };
      })
    );

    // Sort by score and pick the top task
    scoredTasks.sort((a, b) => b.score - a.score);
    const topTask = scoredTasks[0];

    if (!topTask || topTask.score < 20) {
      console.log('❌ No suitable task found for auto-focus (score too low)');
      return new Response(
        JSON.stringify({ message: 'No suitable task found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✨ Auto-selecting task: "${topTask.task.title}" (score: ${topTask.score})`);
    console.log('📋 Reasons:', topTask.reasons);

    // Update the task to be the ONE thing
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        is_focus: true,
        focus_date: today,
        focus_source: 'auto',
      })
      .eq('id', topTask.task.id);

    if (updateError) {
      console.error('❌ Error setting auto-focus:', updateError);
      throw updateError;
    }

    // Store focus embedding
    try {
      await supabase.functions.invoke('focus-memory-store', {
        body: {
          taskText: topTask.task.title,
          clusterId: topTask.task.category || null,
          unlocksCount: 0,
          taskId: topTask.task.id,
          outcome: null,
        },
      });
      console.log('✅ Focus memory embedding created for auto-selected task');
    } catch (error) {
      console.error('Failed to store focus memory:', error);
    }

    console.log('✅ Auto-focus successfully set');

    return new Response(
      JSON.stringify({
        message: 'Auto-focus set successfully',
        task: {
          id: topTask.task.id,
          title: topTask.task.title,
          score: topTask.score,
          reasons: topTask.reasons,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in auto-focus-check:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
