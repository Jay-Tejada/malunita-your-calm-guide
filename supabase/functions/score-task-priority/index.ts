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
    console.log('🎯 score-task-priority function called');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    const { taskText, taskId } = await req.json();

    if (!taskText) {
      throw new Error('taskText is required');
    }

    console.log('📝 Generating embedding for task:', taskText);

    // Generate embedding for task text using OpenAI
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: taskText,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI API error:', embeddingResponse.status, errorText);
      throw new Error(`Failed to generate embedding: ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('🔎 Searching for similar past focus tasks');

    // Query similar past focus tasks
    const { data: similarTasks, error: queryError } = await supabase.rpc(
      'match_focus_embeddings',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 20,
        target_user_id: userId,
      }
    );

    if (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    console.log(`✅ Found ${similarTasks?.length || 0} similar past focus tasks`);

    // Calculate priority score based on similarity to past ONE things
    let priorityScore = 0;

    if (similarTasks && similarTasks.length > 0) {
      let totalWeightedScore = 0;
      let totalWeight = 0;

      similarTasks.forEach((task: any) => {
        // Similarity score (0.5-1.0 range based on match_threshold)
        const similarity = task.similarity;
        
        // Outcome bonus: successful outcomes increase score
        let outcomeMultiplier = 1.0;
        if (task.outcome === 'achieved' || task.outcome === 'completed') {
          outcomeMultiplier = 1.5;
        } else if (task.outcome === 'partial') {
          outcomeMultiplier = 1.2;
        } else if (task.outcome === 'abandoned' || task.outcome === 'failed') {
          outcomeMultiplier = 0.7;
        }

        // Unlocks bonus: higher unlocks = more important
        const unlocksMultiplier = 1 + (task.unlocks_count || 0) * 0.1;

        // Calculate weighted score
        const weight = similarity * outcomeMultiplier * unlocksMultiplier;
        totalWeightedScore += weight;
        totalWeight += 1;
      });

      // Normalize to 0-1 range
      if (totalWeight > 0) {
        priorityScore = Math.min(1.0, totalWeightedScore / totalWeight);
      }
    }

    console.log(`📊 Calculated priority score: ${priorityScore.toFixed(3)}`);

    // Update task if taskId provided
    if (taskId) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ future_priority_score: priorityScore })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating task:', updateError);
      } else {
        console.log('✅ Task priority score updated');
      }
    }

    return new Response(
      JSON.stringify({
        taskText,
        priorityScore,
        similarTasksCount: similarTasks?.length || 0,
        updated: !!taskId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in score-task-priority:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
