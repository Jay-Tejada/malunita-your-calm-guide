// =============================================================================
// DEPRECATED: This function serves deprecated tables (Phase 3A)
// Tables: ai_corrections, model_confusion_matrix, user_bias_patterns, 
//         learning_trends, memory_events, training_queue
// Date flagged: 2024-12-04
// Status: No longer being called - safe to delete in Phase 3B
// =============================================================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, correction, taskId } = await req.json();

    if (!userId || !correction) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, correction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧠 Thought Engine Trainer: Processing correction for user:', userId);

    // Extract correction data
    const { aiOutput, userCorrection, taskTitle, originalText } = correction;

    // 1. Store correction in ai_corrections table
    const { data: correctionRecord, error: insertError } = await supabase
      .from('ai_corrections')
      .insert({
        user_id: userId,
        task_id: taskId || null,
        task_title: taskTitle || 'Unknown task',
        original_text: originalText || '',
        ai_guess: aiOutput || {},
        corrected_output: userCorrection || {},
        context_snapshot: {
          timestamp: new Date().toISOString(),
          userAgent: req.headers.get('user-agent'),
        },
        is_not_task: userCorrection?.isNotTask || false,
        correction_type: determineCorrectionType(aiOutput, userCorrection),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting correction:', insertError);
      throw insertError;
    }

    console.log('✅ Correction stored:', correctionRecord.id);

    // 2. Update confusion matrix (track AI mistakes)
    await updateConfusionMatrix(supabase, aiOutput, userCorrection);

    // 3. Update user bias patterns (learn user preferences)
    await updateUserBiasPatterns(supabase, userId, aiOutput, userCorrection);

    // 4. Update learning_trends table (global patterns)
    await updateLearningTrends(supabase, correctionRecord);

    // 5. Check if we should queue a training job
    const shouldTrain = await checkTrainingThreshold(supabase);
    if (shouldTrain) {
      await queueTrainingJob(supabase);
    }

    // 6. Generate improved metadata and update task
    if (taskId) {
      const improvedMetadata = await generateImprovedMetadata(
        supabase,
        userId,
        userCorrection
      );

      await supabase
        .from('tasks')
        .update({ ai_metadata: improvedMetadata })
        .eq('id', taskId);

      console.log('✅ Task metadata updated with improvements');
    }

    // 7. Emit internal event (stored for analytics)
    await supabase.from('memory_events').insert({
      user_id: userId,
      event_type: 'ai.correction.received',
      payload: {
        correction_id: correctionRecord.id,
        task_id: taskId,
        correction_type: correctionRecord.correction_type,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Event emitted: ai.correction.received');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Correction processed successfully',
        correctionId: correctionRecord.id,
        improvements: {
          confusionMatrixUpdated: true,
          userPatternsUpdated: true,
          trainingQueued: shouldTrain,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in thought-engine-trainer:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Determines the type of correction made
 */
function determineCorrectionType(aiOutput: any, userCorrection: any): string {
  const changes: string[] = [];

  if (aiOutput?.category !== userCorrection?.category) changes.push('category');
  if (aiOutput?.priority !== userCorrection?.priority) changes.push('priority');
  if (aiOutput?.project !== userCorrection?.project) changes.push('project');
  if (aiOutput?.deadline !== userCorrection?.deadline) changes.push('deadline');
  if (JSON.stringify(aiOutput?.subtasks) !== JSON.stringify(userCorrection?.subtasks)) {
    changes.push('subtasks');
  }

  if (changes.length === 0) return 'none';
  if (changes.length > 2) return 'full';
  return changes.join('_');
}

/**
 * Updates the confusion matrix to track common AI mistakes
 */
async function updateConfusionMatrix(supabase: any, aiOutput: any, userCorrection: any) {
  const predictedCategory = aiOutput?.category || 'unknown';
  const predictedPriority = aiOutput?.priority || 'unknown';
  const actualCategory = userCorrection?.category || 'unknown';
  const actualPriority = userCorrection?.priority || 'unknown';

  // Only track if there was actually a mistake
  if (predictedCategory === actualCategory && predictedPriority === actualPriority) {
    return;
  }

  // Check if entry exists
  const { data: existing } = await supabase
    .from('model_confusion_matrix')
    .select('*')
    .eq('predicted_category', predictedCategory)
    .eq('predicted_priority', predictedPriority)
    .eq('actual_category', actualCategory)
    .eq('actual_priority', actualPriority)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('model_confusion_matrix')
      .update({
        occurrence_count: existing.occurrence_count + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('model_confusion_matrix').insert({
      predicted_category: predictedCategory,
      predicted_priority: predictedPriority,
      actual_category: actualCategory,
      actual_priority: actualPriority,
      occurrence_count: 1,
    });
  }

  console.log('✅ Confusion matrix updated');
}

/**
 * Updates user-specific bias patterns
 */
async function updateUserBiasPatterns(
  supabase: any,
  userId: string,
  aiOutput: any,
  userCorrection: any
) {
  const patterns = [];

  // Category preference pattern
  if (aiOutput?.category !== userCorrection?.category) {
    patterns.push({
      user_id: userId,
      pattern_type: 'category_preference',
      pattern_key: `prefers_${userCorrection?.category}_over_${aiOutput?.category}`,
      pattern_data: {
        from: aiOutput?.category,
        to: userCorrection?.category,
        lastSeen: new Date().toISOString(),
      },
    });
  }

  // Priority tendency pattern
  if (aiOutput?.priority !== userCorrection?.priority) {
    const tendencyKey = getPriorityTendency(aiOutput?.priority, userCorrection?.priority);
    patterns.push({
      user_id: userId,
      pattern_type: 'priority_tendency',
      pattern_key: tendencyKey,
      pattern_data: {
        from: aiOutput?.priority,
        to: userCorrection?.priority,
        lastSeen: new Date().toISOString(),
      },
    });
  }

  // Insert or update patterns
  for (const pattern of patterns) {
    const { data: existing } = await supabase
      .from('user_bias_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('pattern_type', pattern.pattern_type)
      .eq('pattern_key', pattern.pattern_key)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('user_bias_patterns')
        .update({
          pattern_data: pattern.pattern_data,
          sample_size: existing.sample_size + 1,
          confidence: Math.min(0.99, existing.confidence + 0.05),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('user_bias_patterns').insert(pattern);
    }
  }

  console.log(`✅ Updated ${patterns.length} user bias patterns`);
}

/**
 * Determines priority tendency (over/under estimation)
 */
function getPriorityTendency(aiPriority: string, userPriority: string): string {
  const priorityOrder: Record<string, number> = { COULD: 0, SHOULD: 1, MUST: 2 };
  const aiLevel = priorityOrder[aiPriority] ?? 1;
  const userLevel = priorityOrder[userPriority] ?? 1;

  if (aiLevel > userLevel) return 'overestimates_priority';
  if (aiLevel < userLevel) return 'underestimates_priority';
  return 'accurate_priority';
}

/**
 * Updates the global learning trends table
 */
async function updateLearningTrends(supabase: any, correctionRecord: any) {
  // Get recent trends
  const { data: latestTrend } = await supabase
    .from('learning_trends')
    .select('*')
    .order('analysis_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const today = new Date().toISOString().split('T')[0];
  const isToday = latestTrend?.analysis_date?.split('T')[0] === today;

  if (isToday && latestTrend) {
    // Update today's trend
    const updatedPatterns = latestTrend.common_patterns || [];
    updatedPatterns.push({
      correction_type: correctionRecord.correction_type,
      timestamp: new Date().toISOString(),
    });

    await supabase
      .from('learning_trends')
      .update({
        total_corrections_analyzed: latestTrend.total_corrections_analyzed + 1,
        common_patterns: updatedPatterns.slice(-100), // Keep last 100
      })
      .eq('id', latestTrend.id);
  } else {
    // Create new trend for today
    await supabase.from('learning_trends').insert({
      total_corrections_analyzed: 1,
      common_patterns: [{
        correction_type: correctionRecord.correction_type,
        timestamp: new Date().toISOString(),
      }],
    });
  }

  console.log('✅ Learning trends updated');
}

/**
 * Checks if we've hit the threshold for training
 */
async function checkTrainingThreshold(supabase: any): Promise<boolean> {
  const TRAINING_THRESHOLD = 50; // Train after 50 corrections

  const { count } = await supabase
    .from('ai_corrections')
    .select('*', { count: 'exact', head: true })
    .is('processed_at', null);

  return (count || 0) >= TRAINING_THRESHOLD;
}

/**
 * Queues a new training job
 */
async function queueTrainingJob(supabase: any) {
  const { data: existingQueue } = await supabase
    .from('training_queue')
    .select('*')
    .eq('status', 'pending')
    .maybeSingle();

  if (!existingQueue) {
    await supabase.from('training_queue').insert({
      training_type: 'threshold',
      status: 'pending',
      scheduled_for: new Date().toISOString(),
    });

    console.log('✅ Training job queued');
  } else {
    console.log('⏳ Training job already queued');
  }
}

/**
 * Generates improved metadata based on user corrections and patterns
 */
async function generateImprovedMetadata(
  supabase: any,
  userId: string,
  userCorrection: any
) {
  // Fetch user patterns to apply learned preferences
  const { data: patterns } = await supabase
    .from('user_bias_patterns')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence', 0.7);

  const improvedMetadata = {
    category: userCorrection?.category,
    priority: userCorrection?.priority,
    project: userCorrection?.project,
    deadline: userCorrection?.deadline,
    subtasks: userCorrection?.subtasks || [],
    appliedPatterns: patterns?.map((p: any) => p.pattern_key) || [],
    confidence: 0.85, // Higher confidence after correction
    lastUpdated: new Date().toISOString(),
  };

  return improvedMetadata;
}
