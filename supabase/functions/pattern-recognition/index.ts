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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('AI service not configured');
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

    console.log('Fetching data for user:', user.id);

    // Load all tasks for the user (limit to recent 100 for performance)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    // Load memory_events from last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: memoryEvents, error: eventsError } = await supabase
      .from('memory_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) {
      console.error('Error fetching memory events:', eventsError);
      throw eventsError;
    }

    console.log(`Loaded ${tasks?.length || 0} tasks and ${memoryEvents?.length || 0} memory events`);

    // Prepare data for AI (limit data sent to reduce token usage)
    const dataForAnalysis = {
      tasks: tasks?.slice(0, 50).map(t => ({
        title: t.title,
        category: t.category,
        completed: t.completed,
        completed_at: t.completed_at,
        created_at: t.created_at,
        context: t.context,
        is_time_based: t.is_time_based,
      })),
      memory_events: memoryEvents?.slice(0, 20).map(e => ({
        event_type: e.event_type,
        payload: e.payload,
        created_at: e.created_at,
      })),
    };

    // Call Lovable AI Gateway
    const systemPrompt = `You are Malunita, an AI companion that detects life patterns and behavioral insights. 

Analyze the user's tasks and memory events to identify:
- Positive habits they've formed
- Negative patterns or anti-habits
- When they have peak energy/productivity
- Tasks or contexts they tend to avoid
- Common contexts where they thrive
- What triggers stress or overwhelm
- Opportunity zones for improvement

Return ONLY valid JSON with this exact structure:
{
  "habits": ["habit1", "habit2"],
  "anti_habits": ["anti_habit1", "anti_habit2"],
  "peak_energy_times": ["time_pattern1", "time_pattern2"],
  "avoidance_patterns": ["avoidance1", "avoidance2"],
  "common_contexts": ["context1", "context2"],
  "stress_triggers": ["trigger1", "trigger2"],
  "opportunity_zones": ["opportunity1", "opportunity2"]
}

Be specific and actionable in your insights. Each insight should be a clear, concise sentence.`;

    console.log('Calling Lovable AI Gateway for pattern analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this data and identify behavioral patterns:\n\n${JSON.stringify(dataForAnalysis, null, 2)}` }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices[0].message.content;
    
    // Clean markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const insights = JSON.parse(content);

    console.log('Patterns identified:', insights);

    // Save to pattern_insights table
    const { data: savedInsight, error: saveError } = await supabase
      .from('pattern_insights')
      .insert({
        user_id: user.id,
        insight_type: 'behavioral_patterns',
        insight: insights,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving insights:', saveError);
      throw saveError;
    }

    console.log('Insights saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights,
        saved_id: savedInsight.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in pattern-recognition function:', error);
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
