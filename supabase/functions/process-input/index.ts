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
    const { text, user_id, persist = true, category, scheduled_bucket, project_id } = await req.json();

    if (!text || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing text or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧠 Processing input for user:', user_id?.substring(0, 8) + '...', 'textLength:', text?.length, 'persist:', persist);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Preserve raw input FIRST - this NEVER gets lost
    const raw_content = text;
    console.log('📝 Raw content preserved:', raw_content.substring(0, 50) + '...');

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

    // ============================================================
    // STEP 0: SEMANTIC COMPRESSION - Call the dedicated edge function
    // ============================================================
    console.log('🔄 Step 0: Calling semantic-compress edge function...');
    let ai_summary = raw_content; // Fallback: use raw if compression fails
    let confidence_score = 0.5;
    
    try {
      const compressionResponse = await fetch(`${supabaseUrl}/functions/v1/semantic-compress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: raw_content }),
      });

      if (compressionResponse.ok) {
        const compressionData = await compressionResponse.json();
        ai_summary = compressionData.ai_summary || raw_content;
        confidence_score = compressionData.confidence_score || 0.7;
        console.log('✅ Semantic compression result:', { 
          ai_summary: ai_summary.substring(0, 60), 
          confidence_score 
        });
      } else {
        console.warn('⚠️ Semantic compression failed, using raw input as summary');
      }
    } catch (compressError) {
      console.error('❌ Semantic compression error:', compressError);
      // Continue with raw_content as fallback
    }

    // ============================================================
    // STEP 1: Extract tasks, ideas, decisions, emotion
    // ============================================================
    console.log('🔄 Step 1: Extracting content...');
    const extracted = await extractFromInput(text, userContext);

    // ============================================================
    // STEP 2: Classify tasks (tiny, complex, etc.)
    // ============================================================
    console.log('🔄 Step 2: Classifying tasks...');
    const classified = await classifyTasks(extracted.tasks);

    // ============================================================
    // STEP 3: Score priority
    // ============================================================
    console.log('🔄 Step 3: Scoring priorities...');
    const scored = await scorePriority(classified, userContext);

    // ============================================================
    // STEP 4: Infer context (people, deadlines, locations, categories)
    // ============================================================
    console.log('🔄 Step 4: Inferring context...');
    const contextualized = await inferContext(scored, text);

    // ============================================================
    // STEP 5: Compute virtual flags
    // ============================================================
    console.log('🔄 Step 5: Computing virtual task flags...');
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

    // ============================================================
    // STEP 6: CONTEXT INDEXING - Call the dedicated edge function
    // ============================================================
    console.log('🔄 Step 6: Calling context-index edge function...');
    let memory_tags: string[] = [];
    let related_spaces: string[] = [];
    let context_weight = 0.5;
    let project_association: string | null = null;

    try {
      const indexResponse = await fetch(`${supabaseUrl}/functions/v1/context-index`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ai_summary,
          destination: category || 'inbox',
          related_project: project_id,
        }),
      });

      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        memory_tags = indexData.memory_tags || [];
        related_spaces = indexData.related_spaces || [];
        context_weight = indexData.context_weight || 0.5;
        project_association = indexData.project_association || null;
        console.log('✅ Context indexing result:', { 
          memory_tags, 
          related_spaces, 
          context_weight 
        });
      } else {
        console.warn('⚠️ Context indexing failed, continuing without memory tags');
      }
    } catch (indexError) {
      console.error('❌ Context indexing error:', indexError);
      // Continue without memory tags
    }

    // ============================================================
    // STEP 7: Route tasks to buckets
    // ============================================================
    console.log('🔄 Step 7: Routing tasks...');
    const routing = await routeTasks(enrichedWithFlags, userContext);

    // ============================================================
    // STEP 8: Generate contextual AI response
    // ============================================================
    console.log('🔄 Step 8: Generating response...');
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

    // ============================================================
    // STEP 9: PERSIST TASKS TO DATABASE
    // ============================================================
    let createdTasks: any[] = [];
    if (persist) {
      console.log('🔄 Step 9: Persisting tasks to database...');
      
      const tasksToInsert = enrichedWithFlags.map(task => {
        // Determine title: prefer ai_summary if confident, else use cleaned/raw
        let title = task.cleaned || task.raw;
        if (confidence_score >= 0.6 && ai_summary && ai_summary !== raw_content) {
          title = ai_summary;
        }
        
        return {
          user_id,
          title,
          raw_content, // ALWAYS preserve original input
          ai_summary, // Compressed version
          ai_confidence: confidence_score,
          category: category || task.category || 'inbox',
          scheduled_bucket: scheduled_bucket || null,
          project_id: project_id || null,
          is_tiny_task: task.tiny_task || task.isTiny || false,
          ai_metadata: {
            task_type: task.task_type,
            heavy_task: task.heavy_task,
            emotional_weight: task.emotional_weight,
            memory_tags,
            related_spaces,
            context_weight,
            project_association,
            priority: task.priority,
            people: task.people,
            context_markers: task.contextMarkers,
            confidence_score,
          },
          reminder_time: task.reminder_time || null,
          has_reminder: !!task.reminder_time,
        };
      });

      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (insertError) {
        console.error('❌ Failed to insert tasks:', insertError);
        throw new Error(`Failed to persist tasks: ${insertError.message}`);
      }

      createdTasks = insertedTasks || [];
      console.log(`✅ Successfully created ${createdTasks.length} task(s) with AI enrichment`);
      
      // Log what was saved for debugging
      createdTasks.forEach((task, i) => {
        console.log(`  📋 Task ${i + 1}:`, {
          id: task.id,
          title: task.title?.substring(0, 40),
          has_raw_content: !!task.raw_content,
          has_ai_summary: !!task.ai_summary,
          confidence: task.ai_confidence
        });
      });
    }

    // ============================================================
    // Prepare final output
    // ============================================================
    const output = {
      tasks: enrichedWithFlags.map((task, index) => ({
        id: createdTasks[index]?.id || null,
        raw: task.raw,
        cleaned: task.cleaned,
        ai_summary,
        raw_content,
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
        memory_tags,
        related_spaces,
        context_weight,
        project_association,
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

    console.log('🎉 Processing complete. Tasks:', output.tasks?.length, 'Persisted:', createdTasks.length);

    return new Response(
      JSON.stringify(output),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in process-input:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
