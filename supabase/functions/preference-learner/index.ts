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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract user ID from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Learning preferences for user:', user.id);

    // Load memory events
    const { data: memoryEvents, error: eventsError } = await supabase
      .from('memory_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (eventsError) {
      console.error('Error fetching memory events:', eventsError);
      throw eventsError;
    }

    // Load pattern insights
    const { data: patternInsights, error: patternsError } = await supabase
      .from('pattern_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (patternsError) {
      console.error('Error fetching pattern insights:', patternsError);
      throw patternsError;
    }

    // Load tasks for additional context
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('title, category, completed, created_at, completed_at, is_time_based, context')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    console.log(`Loaded ${memoryEvents?.length || 0} events, ${patternInsights?.length || 0} patterns, ${tasks?.length || 0} tasks`);

    // Prepare data for analysis
    const dataForAnalysis = {
      memory_events: memoryEvents?.map(e => ({
        event_type: e.event_type,
        payload: e.payload,
        created_at: e.created_at,
      })),
      patterns: patternInsights?.map(p => ({
        insight_type: p.insight_type,
        insight: p.insight,
      })),
      tasks: tasks?.map(t => ({
        title: t.title,
        category: t.category,
        completed: t.completed,
        created_at: t.created_at,
        completed_at: t.completed_at,
        is_time_based: t.is_time_based,
      })),
    };

    // Call OpenAI
    const systemPrompt = `You are Malunita's preference learning system. Analyze user behavior to determine their work style preferences.

Based on the user's tasks, memory events, and identified patterns, determine:

1. **preferred_task_length**: Do they prefer "short" (quick wins), "medium" (balanced), or "long" (deep work)?
2. **preferred_daily_load**: How many tasks per day do they typically handle well? (number)
3. **preferred_times**: What times of day do they work best? (array of strings like ["09:00", "14:00"])
4. **task_style**: How do they prefer to work? "detailed", "short-and-direct", "creative", or "audio-heavy"?
5. **energy_curve**: When is their peak energy? "morning", "afternoon", or "evening"?
6. **notification_style**: What reminder style suits them? "gentle", "strong", or "minimal"?

Return ONLY valid JSON with this exact structure:
{
  "preferred_task_length": "short | medium | long",
  "preferred_daily_load": number,
  "preferred_times": ["time1", "time2"],
  "task_style": "detailed | short-and-direct | creative | audio-heavy",
  "energy_curve": "morning | afternoon | evening",
  "notification_style": "gentle | strong | minimal"
}

Base your analysis on actual data patterns, not assumptions.`;

    console.log('Calling OpenAI for preference learning...');

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
          { role: 'user', content: `Analyze this user's behavior and learn their preferences:\n\n${JSON.stringify(dataForAnalysis, null, 2)}` }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const preferences = JSON.parse(aiResponse.choices[0].message.content);

    console.log('Preferences learned:', preferences);

    // Upsert into user_preferences table
    const { data: savedPreferences, error: saveError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferences: preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving preferences:', saveError);
      throw saveError;
    }

    console.log('Preferences saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        preferences,
        updated_at: savedPreferences.updated_at
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in preference-learner function:', error);
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
