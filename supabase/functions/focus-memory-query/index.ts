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
    console.log('🔍 focus-memory-query function called');

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

    const { queryText, limit = 10, includePatterns = true } = await req.json();

    if (!queryText) {
      throw new Error('queryText is required');
    }

    console.log('📝 Generating query embedding for:', queryText);

    // Generate embedding for query text using OpenAI
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
        input: queryText,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI API error:', embeddingResponse.status, errorText);
      throw new Error(`Failed to generate embedding: ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('🔎 Searching for similar tasks');

    // Query similar tasks using vector similarity
    // Use RPC to call a custom function for vector similarity search
    const { data: similarTasks, error: queryError } = await supabase.rpc(
      'match_focus_embeddings',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        target_user_id: userId,
      }
    );

    if (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    console.log(`✅ Found ${similarTasks?.length || 0} similar tasks`);

    let patterns = null;
    if (includePatterns && similarTasks && similarTasks.length > 0) {
      // Analyze patterns in similar tasks
      const clusterCounts: Record<string, number> = {};
      let totalUnlocks = 0;
      let successfulTasks = 0;

      similarTasks.forEach((task: any) => {
        if (task.cluster_label) {
          clusterCounts[task.cluster_label] = (clusterCounts[task.cluster_label] || 0) + 1;
        }
        totalUnlocks += task.unlocks_count || 0;
        if (task.outcome === 'achieved' || task.outcome === 'completed') {
          successfulTasks++;
        }
      });

      const topClusters = Object.entries(clusterCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cluster, count]) => ({ cluster, count }));

      patterns = {
        topClusters,
        averageUnlocks: totalUnlocks / similarTasks.length,
        successRate: (successfulTasks / similarTasks.length) * 100,
        totalSimilarTasks: similarTasks.length,
      };

      console.log('📊 Patterns detected:', patterns);
    }

    return new Response(
      JSON.stringify({
        similarTasks: similarTasks?.map((task: any) => ({
          taskText: task.task_text,
          similarity: task.similarity,
          clusterLabel: task.cluster_label,
          unlocksCount: task.unlocks_count,
          outcome: task.outcome,
          createdAt: task.created_at,
        })) || [],
        patterns,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in focus-memory-query:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});