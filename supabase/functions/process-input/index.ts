import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { extractFromInput } from "./extract.ts";
import { classifyTasks } from "./classify.ts";
import { inferContext } from "./context.ts";
import { routeTasks } from "./route.ts";
import { scorePriority } from "./score.ts";
import { generateResponse } from "./respond.ts";
import type { Task, UserContext } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, user_id } = await req.json();

    if (!text || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing text or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing input for user:', user_id);
    console.log('Input text:', text);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_goal, focus_preferences, common_prefixes')
      .eq('id', user_id)
      .single();

    // Fetch user's custom categories
    const { data: customCategories } = await supabase
      .from('custom_categories')
      .select('name')
      .eq('user_id', user_id);

    const userContext = {
      goal: profile?.current_goal || null,
      preferences: profile?.focus_preferences || {},
      prefixes: profile?.common_prefixes || [],
      customCategories: customCategories?.map(c => c.name) || [],
    };

    // STEP 1: Extract tasks, ideas, decisions, emotion
    console.log('Step 1: Extracting content...');
    const extracted = await extractFromInput(text, userContext);

    // STEP 2: Classify tasks (tiny, complex, etc.)
    console.log('Step 2: Classifying tasks...');
    const classified = await classifyTasks(extracted.tasks);

    // STEP 3: Score priority
    console.log('Step 3: Scoring priorities...');
    const scored = await scorePriority(classified, userContext);

    // STEP 4: Infer context (people, deadlines, locations, categories)
    console.log('Step 4: Inferring context...');
    const contextualized = await inferContext(scored, text);

    // STEP 5: Compute virtual flags
    console.log('Step 5: Computing virtual task flags...');
    const { computeVirtualFlags } = await import('../_shared/taskTypeClassifier.ts');
    
    const enrichedWithFlags = contextualized.map(task => {
      const virtualFlags = computeVirtualFlags(task.cleaned);
      return {
        ...task,
        task_type: virtualFlags.task_type,
        tiny_task: virtualFlags.tiny_task,
        heavy_task: virtualFlags.heavy_task,
        emotional_weight: virtualFlags.emotional_weight
      };
    });

    // STEP 6: Route tasks to buckets
    console.log('Step 6: Routing tasks...');
    const routing = await routeTasks(enrichedWithFlags, userContext);

    // STEP 7: Generate contextual AI response
    console.log('Step 7: Generating response...');
    const aiResponse = generateResponse({
      emotion: extracted.emotion || 'ok',
      taskCount: enrichedWithFlags.length,
      hasLargeTasks: enrichedWithFlags.some(t => t.heavy_task || t.cleaned.length > 50),
      tasks: enrichedWithFlags.map(t => ({
        title: t.raw,
        cleaned: t.cleaned,
        isTiny: t.tiny_task || t.isTiny
      })),
      originalText: text
    });

    // Prepare final output
    const output = {
      tasks: enrichedWithFlags.map(task => ({
        raw: task.raw,
        cleaned: task.cleaned,
        priority: task.priority,
        isTiny: task.isTiny,
        category: task.category,
        due: task.due,
        reminder_time: task.reminder_time,
        project: task.project,
        people: task.people,
        contextMarkers: task.contextMarkers,
        subtasks: task.subtasks || [],
        // Virtual flags
        task_type: task.task_type,
        tiny_task: task.tiny_task,
        heavy_task: task.heavy_task,
        emotional_weight: task.emotional_weight
      })),
      ideas: extracted.ideas,
      decisions: extracted.decisions,
      contextSummary: {
        totalTasks: enrichedWithFlags.length,
        tinyTasks: enrichedWithFlags.filter(t => t.tiny_task).length,
        heavyTasks: enrichedWithFlags.filter(t => t.heavy_task).length,
        highPriority: enrichedWithFlags.filter(t => t.priority === 'must').length,
        hasDueDates: enrichedWithFlags.filter(t => t.due).length,
        highEmotionalWeight: enrichedWithFlags.filter(t => (t.emotional_weight || 0) > 5).length,
      },
      emotion: extracted.emotion,
      clarifyingQuestions: extracted.clarifyingQuestions,
      aiResponse,
      routing,
    };

    console.log('Processing complete. Output:', JSON.stringify(output, null, 2));

    return new Response(
      JSON.stringify(output),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-input:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
