import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MIN_SIGNALS_FOR_LEARNING = 3;
const SIGNAL_DECAY_DAYS = 30; // Half-life for signal relevance

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, force = false } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[AggregateLearning] Processing signals for user: ${user_id.substring(0, 8)}...`);

    // Fetch recent signals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: signals, error: signalsError } = await supabase
      .from('user_learning_signals')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (signalsError) {
      console.error('[AggregateLearning] Error fetching signals:', signalsError);
      throw signalsError;
    }

    console.log(`[AggregateLearning] Found ${signals?.length || 0} signals in last 30 days`);

    // Skip if not enough signals (unless forced)
    if (!force && (!signals || signals.length < MIN_SIGNALS_FOR_LEARNING)) {
      return new Response(
        JSON.stringify({ 
          message: 'Not enough signals to learn from',
          signals_count: signals?.length || 0,
          min_required: MIN_SIGNALS_FOR_LEARNING
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate signals by type
    const aggregated = {
      destination_corrections: [] as any[],
      summary_edits: [] as any[],
      decomposition_rejections: [] as any[],
      suggestion_ignores: [] as any[],
      expansion_patterns: [] as any[],
      completions: [] as any[],
    };

    for (const signal of signals || []) {
      const age = daysSince(new Date(signal.created_at));
      const weight = calculateDecayWeight(age, SIGNAL_DECAY_DAYS);
      
      const enrichedSignal = { ...signal.signal_data, weight, created_at: signal.created_at };

      switch (signal.signal_type) {
        case 'destination_correction':
          aggregated.destination_corrections.push(enrichedSignal);
          break;
        case 'summary_edit':
          aggregated.summary_edits.push(enrichedSignal);
          break;
        case 'decomposition_rejection':
          aggregated.decomposition_rejections.push(enrichedSignal);
          break;
        case 'suggestion_ignored':
          aggregated.suggestion_ignores.push(enrichedSignal);
          break;
        case 'expansion_pattern':
          aggregated.expansion_patterns.push(enrichedSignal);
          break;
        case 'task_completed':
          aggregated.completions.push(enrichedSignal);
          break;
      }
    }

    // Calculate preferences
    const preferences = calculatePreferences(aggregated);
    
    console.log('[AggregateLearning] Calculated preferences:', preferences);

    // Upsert preferences
    const { error: upsertError } = await supabase
      .from('user_learning_preferences')
      .upsert({
        user_id,
        ...preferences,
        signals_processed: signals?.length || 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('[AggregateLearning] Error upserting preferences:', upsertError);
      throw upsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        signals_processed: signals?.length || 0,
        preferences,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AggregateLearning] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function calculateDecayWeight(ageInDays: number, halfLife: number): number {
  // Exponential decay: weight = 0.5^(age/halfLife)
  return Math.pow(0.5, ageInDays / halfLife);
}

function calculatePreferences(aggregated: any) {
  // 1. Preferred destinations from corrections
  const preferredDestinations: Record<string, Record<string, number>> = {};
  
  for (const correction of aggregated.destination_corrections) {
    const from = correction.from || 'unknown';
    const to = correction.to || 'unknown';
    const weight = correction.weight || 1;
    
    if (!preferredDestinations[from]) {
      preferredDestinations[from] = {};
    }
    preferredDestinations[from][to] = (preferredDestinations[from][to] || 0) + weight;
  }

  // 2. Task granularity from decomposition rejections
  const rejectionCount = aggregated.decomposition_rejections.length;
  const editCount = aggregated.summary_edits.length;
  
  let taskGranularity: 'coarse' | 'balanced' | 'detailed' = 'balanced';
  if (rejectionCount >= 5) {
    taskGranularity = 'coarse'; // User prefers fewer subtasks
  } else if (editCount >= 10 && aggregated.summary_edits.some((e: any) => 
    (e.edited?.length || 0) > (e.original?.length || 0))) {
    taskGranularity = 'detailed'; // User expands summaries
  }

  // 3. Decomposition threshold adjustment
  // If user rejects >50% of decompositions, raise threshold
  const decompositionThreshold = rejectionCount >= 3 
    ? Math.min(0.9, 0.7 + (rejectionCount * 0.03))
    : 0.7;

  // 4. Confidence bias from edit frequency
  // More edits = lower confidence in AI outputs
  const editFrequency = editCount / Math.max(1, aggregated.completions.length);
  const confidenceBias = editFrequency > 0.5 ? -0.1 : (editFrequency < 0.1 ? 0.1 : 0);

  return {
    preferred_destinations: preferredDestinations,
    task_granularity: taskGranularity,
    decomposition_threshold: decompositionThreshold,
    confidence_bias: confidenceBias,
    edit_frequency: editFrequency,
  };
}
