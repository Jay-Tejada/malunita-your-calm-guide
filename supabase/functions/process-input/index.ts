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

// Helper function to call semantic-compress
async function semanticCompress(text: string): Promise<{ ai_summary: string; confidence_score: number }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not set, using raw text as summary');
    return { ai_summary: text, confidence_score: 0.5 };
  }

  try {
    const systemPrompt = `You are a semantic compression engine. Transform raw human input into a single, clear, actionable sentence.
Rules:
- Remove filler words but preserve meaning
- Do NOT invent intent
- Do NOT split into multiple tasks
- Output a single sentence that captures the core intent
Return JSON: { "ai_summary": "...", "confidence_score": 0.0-1.0 }`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Semantic compress failed:', response.status);
      return { ai_summary: text, confidence_score: 0.5 };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ai_summary: parsed.ai_summary || text,
        confidence_score: parsed.confidence_score || 0.7
      };
    }
    
    return { ai_summary: content.trim() || text, confidence_score: 0.7 };
  } catch (error) {
    console.error('Semantic compress error:', error);
    return { ai_summary: text, confidence_score: 0.5 };
  }
}

// Helper function to call context-index
async function contextIndex(aiSummary: string, destination?: string, project?: string): Promise<{ memory_tags: string[]; related_spaces: string[]; context_weight: number }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not set, skipping context indexing');
    return { memory_tags: [], related_spaces: [], context_weight: 0.5 };
  }

  try {
    const systemPrompt = `You are a context indexing engine. Extract semantic signals for memory retrieval.
Given a task summary, identify:
- memory_tags: 2-5 abstract, reusable themes (not task-specific words)
- related_spaces: 1-3 life domains (work, home, health, finance, social, creative, learning)
- context_weight: 0.0-1.0 importance for long-term memory

Return JSON only: { "memory_tags": [...], "related_spaces": [...], "context_weight": 0.0-1.0 }`;

    const userPrompt = `Summary: "${aiSummary}"${destination ? `\nDestination: ${destination}` : ''}${project ? `\nProject: ${project}` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Context index failed:', response.status);
      return { memory_tags: [], related_spaces: [], context_weight: 0.5 };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        memory_tags: (parsed.memory_tags || []).slice(0, 5),
        related_spaces: (parsed.related_spaces || []).slice(0, 3),
        context_weight: Math.min(1, Math.max(0, parsed.context_weight || 0.5))
      };
    }
    
    return { memory_tags: [], related_spaces: [], context_weight: 0.5 };
  } catch (error) {
    console.error('Context index error:', error);
    return { memory_tags: [], related_spaces: [], context_weight: 0.5 };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, user_id, persist = true, category, scheduled_bucket, project_id } = await req.json();

    if (!text || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing text or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing input for user:', user_id?.substring(0, 8) + '...', 'textLength:', text?.length, 'persist:', persist);

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

    // STEP 0: Semantic Compression (NEW - now connected!)
    console.log('Step 0: Running semantic compression...');
    const { ai_summary, confidence_score } = await semanticCompress(text);
    console.log('Semantic compression result:', { ai_summary: ai_summary.substring(0, 50), confidence_score });

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

    // STEP 6: Context Indexing (NEW - now connected!)
    console.log('Step 6: Running context indexing...');
    const contextIndex_result = await contextIndex(ai_summary, category, undefined);
    console.log('Context indexing result:', contextIndex_result);

    // STEP 7: Route tasks to buckets
    console.log('Step 7: Routing tasks...');
    const routing = await routeTasks(enrichedWithFlags, userContext);

    // STEP 8: Generate contextual AI response
    console.log('Step 8: Generating response...');
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

    // STEP 9: Persist tasks to database (NEW!)
    let createdTasks: any[] = [];
    if (persist) {
      console.log('Step 9: Persisting tasks to database...');
      
      const tasksToInsert = enrichedWithFlags.map(task => ({
        user_id,
        title: task.cleaned || task.raw,
        raw_content: text, // Preserve original input
        ai_summary: ai_summary,
        ai_confidence: confidence_score,
        category: category || task.category || 'inbox',
        scheduled_bucket: scheduled_bucket || null,
        project_id: project_id || null,
        is_tiny_task: task.tiny_task || task.isTiny || false,
        ai_metadata: {
          task_type: task.task_type,
          heavy_task: task.heavy_task,
          emotional_weight: task.emotional_weight,
          memory_tags: contextIndex_result.memory_tags,
          related_spaces: contextIndex_result.related_spaces,
          context_weight: contextIndex_result.context_weight,
          priority: task.priority,
          people: task.people,
          context_markers: task.contextMarkers,
        },
        reminder_time: task.reminder_time || null,
        has_reminder: !!task.reminder_time,
      }));

      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (insertError) {
        console.error('Failed to insert tasks:', insertError);
        throw new Error(`Failed to persist tasks: ${insertError.message}`);
      }

      createdTasks = insertedTasks || [];
      console.log(`Successfully created ${createdTasks.length} task(s)`);
    }

    // Prepare final output
    const output = {
      tasks: enrichedWithFlags.map((task, index) => ({
        id: createdTasks[index]?.id || null,
        raw: task.raw,
        cleaned: task.cleaned,
        ai_summary,
        raw_content: text,
        confidence_score,
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
        emotional_weight: task.emotional_weight,
        // Memory indexing
        memory_tags: contextIndex_result.memory_tags,
        related_spaces: contextIndex_result.related_spaces,
        context_weight: contextIndex_result.context_weight,
      })),
      createdTaskIds: createdTasks.map(t => t.id),
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

    console.log('Processing complete. Tasks:', output.tasks?.length, 'Persisted:', createdTasks.length);

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
