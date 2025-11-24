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
    console.log('🌙 tomorrow-planner function called');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get all users to generate plans for
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      throw profilesError;
    }

    console.log(`📊 Generating plans for ${profiles?.length || 0} users`);

    const results = [];

    for (const profile of profiles || []) {
      try {
        const userId = profile.id;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        console.log(`👤 Processing user ${userId} for ${tomorrowDate}`);

        // 1. Get tomorrow's storm prediction
        const { data: stormData } = await supabase
          .from('priority_storms')
          .select('*')
          .eq('user_id', userId)
          .eq('date', tomorrowDate)
          .single();

        // 2. Get unfinished ONE thing
        const { data: currentOneThing } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('is_focus', true)
          .eq('completed', false)
          .single();

        // 3. Get high unlocks_count tasks
        const { data: highUnlocksTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', false)
          .gte('future_priority_score', 0.7)
          .order('future_priority_score', { ascending: false })
          .limit(10);

        // 4. Get tiny tasks for momentum
        const { data: tinyTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', false)
          .or('category.eq.tiny-task,category.eq.quick-win')
          .limit(5);

        // 5. Get user's focus persona
        const { data: profileData } = await supabase
          .from('profiles')
          .select('focus_persona, burnout_risk, companion_personality_type')
          .eq('id', userId)
          .single();

        // Prepare context for AI
        const context = {
          tomorrowDate,
          stormScore: stormData?.expected_load_score || 0,
          recommendedStormTask: stormData?.recommended_focus_task,
          currentOneThing: currentOneThing ? {
            id: currentOneThing.id,
            title: currentOneThing.title,
            category: currentOneThing.category,
            future_priority_score: currentOneThing.future_priority_score
          } : null,
          highPriorityTasks: highUnlocksTasks?.slice(0, 5).map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            future_priority_score: t.future_priority_score,
            alignment_reason: t.alignment_reason
          })) || [],
          tinyTasks: tinyTasks?.map(t => ({
            id: t.id,
            title: t.title,
            category: t.category
          })) || [],
          focusPersona: profileData?.focus_persona || {},
          burnoutRisk: profileData?.burnout_risk || 0,
          personalityType: profileData?.companion_personality_type || 'zen'
        };

        console.log('📋 Context prepared:', JSON.stringify(context, null, 2));

        // Call Lovable AI to generate plan
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        const aiResponse = await fetch('https://api.lovable.app/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a Tomorrow Planner AI. Based on the user's data, generate a strategic plan for tomorrow.

Your response MUST be valid JSON with this exact structure:
{
  "recommendedOneThing": "task title",
  "recommendedOneThingId": "uuid or null",
  "supportingTasks": [
    { "title": "task 1", "id": "uuid or null" },
    { "title": "task 2", "id": "uuid or null" }
  ],
  "tinyTask": "quick momentum task",
  "tinyTaskId": "uuid or null",
  "reasoning": "one sentence explaining the strategy"
}

Guidelines:
- If storm score is high (60+), prioritize the storm's recommended task
- If burnout risk is high (>70), choose a restorative task
- If there's an unfinished ONE thing, consider continuing it
- Use high future_priority_score tasks (>0.7) for the ONE thing
- Select 1-2 supporting tasks that complement the ONE thing
- Choose a tiny task for quick momentum
- Keep reasoning to ONE sentence`
              },
              {
                role: 'user',
                content: JSON.stringify(context)
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          throw new Error(`Failed to generate plan: ${errorText}`);
        }

        const aiData = await aiResponse.json();
        const planText = aiData.choices[0].message.content;
        
        // Parse JSON response
        const plan = JSON.parse(planText);

        console.log('🤖 AI generated plan:', plan);

        // Store in database (upsert)
        const { data: savedPlan, error: insertError } = await supabase
          .from('tomorrow_plan')
          .upsert({
            user_id: userId,
            plan_date: tomorrowDate,
            recommended_one_thing: plan.recommendedOneThing,
            recommended_one_thing_id: plan.recommendedOneThingId,
            supporting_tasks: plan.supportingTasks,
            tiny_task: plan.tinyTask,
            tiny_task_id: plan.tinyTaskId,
            reasoning: plan.reasoning,
            storm_score: stormData?.expected_load_score || 0
          }, {
            onConflict: 'user_id,plan_date'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error saving plan:', insertError);
          throw insertError;
        }

        console.log(`✅ Plan saved for user ${userId}`);
        results.push({ userId, success: true, plan: savedPlan });

      } catch (userError) {
        console.error(`❌ Error processing user ${profile.id}:`, userError);
        const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';
        results.push({ userId: profile.id, success: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in tomorrow-planner:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
