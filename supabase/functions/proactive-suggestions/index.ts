import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating proactive suggestions for user:', user.id);

    // 1. Load daily plan (tomorrow's plan or today's session)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const { data: tomorrowPlan } = await supabase
      .from('tomorrow_plan')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', tomorrow)
      .single();

    const { data: todaySession } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    // 2. Load pattern insights (latest 3)
    const { data: patterns } = await supabase
      .from('pattern_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);

    // 3. Load user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 4. Get behavior prediction by calling the behavior-predictor function
    let behaviorPrediction = null;
    try {
      const predictionResponse = await fetch(
        `${supabaseUrl}/functions/v1/behavior-predictor`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (predictionResponse.ok) {
        const predictionData = await predictionResponse.json();
        behaviorPrediction = predictionData.prediction;
        console.log('Behavior prediction loaded:', behaviorPrediction);
      }
    } catch (error) {
      console.warn('Could not fetch behavior prediction:', error);
    }

    // 5. Load incomplete tasks for context
    const { data: incompleteTasks } = await supabase
      .from('tasks')
      .select('title, category, created_at, is_focus, reminder_time')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(20);

    // Prepare comprehensive data for AI
    const comprehensiveData = {
      daily_plan: {
        tomorrow: tomorrowPlan,
        today_session: todaySession,
      },
      patterns: patterns?.map(p => p.insight) || [],
      preferences: preferences?.preferences || {},
      behavior_prediction: behaviorPrediction,
      incomplete_tasks_count: incompleteTasks?.length || 0,
      has_focus_task: incompleteTasks?.some(t => t.is_focus) || false,
      has_upcoming_reminders: incompleteTasks?.some(t => t.reminder_time) || false,
    };

    console.log('Comprehensive data prepared');

    const systemPrompt = `You are Malunita's proactive suggestion engine. Synthesize all available intelligence to provide actionable, personalized guidance.

You have access to:
- Daily planning data
- Behavioral pattern insights
- Learned user preferences
- Real-time behavior predictions
- Current task context

Generate ONLY valid JSON:
{
  "headline": "A compelling, personalized headline (max 80 chars)",
  "suggestions": ["3-5 specific, actionable suggestions"],
  "warnings": ["0-2 things to watch out for"],
  "opportunities": ["2-3 opportunities for wins or growth"],
  "energy_timing": "Best time to tackle important work today",
  "micro_habits": ["2-3 tiny habits to build momentum"]
}

Make it:
- Personal and specific to their data
- Action-oriented, not generic advice
- Encouraging but honest about challenges
- Focused on near-term (today/tomorrow)`;

    console.log('Calling OpenAI for proactive suggestions...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate proactive suggestions based on this comprehensive user data:\n\n${JSON.stringify(comprehensiveData, null, 2)}` }
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const suggestions = JSON.parse(aiResponse.choices[0].message.content);

    console.log('Proactive suggestions generated:', suggestions);

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestions,
        generated_at: new Date().toISOString(),
        data_sources: {
          has_daily_plan: !!tomorrowPlan,
          has_patterns: (patterns?.length || 0) > 0,
          has_preferences: !!preferences,
          has_behavior_prediction: !!behaviorPrediction,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in proactive-suggestions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
