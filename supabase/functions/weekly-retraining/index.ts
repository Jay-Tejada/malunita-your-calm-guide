import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting weekly retraining job...');

    // Get date range for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch all corrections from the past week
    const { data: corrections, error: correctionsError } = await supabase
      .from('ai_corrections')
      .select('*')
      .gte('created_at', oneWeekAgo.toISOString());

    if (correctionsError) {
      throw correctionsError;
    }

    console.log(`Processing ${corrections?.length || 0} corrections from the past week`);

    // Group corrections by user
    const userCorrections = new Map<string, any[]>();
    corrections?.forEach((correction) => {
      const userId = correction.user_id;
      if (!userCorrections.has(userId)) {
        userCorrections.set(userId, []);
      }
      userCorrections.get(userId)!.push(correction);
    });

    // Process each user's corrections
    const updates = [];
    for (const [userId, userCorr] of userCorrections) {
      const learningProfile = computeLearningProfile(userCorr);
      updates.push(
        supabase
          .from('profiles')
          .update({
            learning_profile: learningProfile
          })
          .eq('id', userId)
      );
    }

    // Execute all updates
    await Promise.all(updates);

    // Update training queue status
    const { error: queueError } = await supabase
      .from('training_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        improvements: {
          users_retrained: userCorrections.size,
          corrections_processed: corrections?.length || 0,
          timestamp: new Date().toISOString()
        }
      })
      .eq('status', 'pending')
      .eq('training_type', 'weekly');

    if (queueError) {
      console.error('Error updating training queue:', queueError);
    }

    console.log(`Weekly retraining completed for ${userCorrections.size} users`);

    return new Response(
      JSON.stringify({
        success: true,
        users_retrained: userCorrections.size,
        corrections_processed: corrections?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Weekly retraining error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function computeLearningProfile(corrections: any[]): any {
  const categoryConfidence: Record<string, { correct: number; total: number }> = {};
  const priorityConfidence: Record<string, { correct: number; total: number }> = {};
  const projectInference: Record<string, number> = {};
  const clarificationPatterns: string[] = [];

  corrections.forEach((correction) => {
    const aiGuess = correction.ai_guess || {};
    const corrected = correction.corrected_output || {};

    // Category confidence
    if (aiGuess.category && corrected.category) {
      const cat = corrected.category;
      if (!categoryConfidence[cat]) {
        categoryConfidence[cat] = { correct: 0, total: 0 };
      }
      categoryConfidence[cat].total++;
      if (aiGuess.category === corrected.category) {
        categoryConfidence[cat].correct++;
      }
    }

    // Priority confidence
    if (aiGuess.priority && corrected.priority) {
      const pri = corrected.priority;
      if (!priorityConfidence[pri]) {
        priorityConfidence[pri] = { correct: 0, total: 0 };
      }
      priorityConfidence[pri].total++;
      if (aiGuess.priority === corrected.priority) {
        priorityConfidence[pri].correct++;
      }
    }

    // Project inference (track which projects are commonly corrected)
    if (corrected.project) {
      projectInference[corrected.project] = (projectInference[corrected.project] || 0) + 1;
    }

    // Clarification patterns (track correction types)
    if (correction.correction_type) {
      if (!clarificationPatterns.includes(correction.correction_type)) {
        clarificationPatterns.push(correction.correction_type);
      }
    }
  });

  // Compute confidence scores (0-1)
  const categoryConfidenceScores: Record<string, number> = {};
  Object.keys(categoryConfidence).forEach((cat) => {
    const { correct, total } = categoryConfidence[cat];
    categoryConfidenceScores[cat] = total > 0 ? correct / total : 0.5;
  });

  const priorityConfidenceScores: Record<string, number> = {};
  Object.keys(priorityConfidence).forEach((pri) => {
    const { correct, total } = priorityConfidence[pri];
    priorityConfidenceScores[pri] = total > 0 ? correct / total : 0.5;
  });

  return {
    category_confidence: categoryConfidenceScores,
    priority_confidence: priorityConfidenceScores,
    project_inference: projectInference,
    clarification_patterns: clarificationPatterns,
    last_retrain: new Date().toISOString(),
    correction_count_since_retrain: 0
  };
}