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

    console.log('Predicting behavior for user:', user.id);

    // Load pattern insights (latest)
    const { data: patterns } = await supabase
      .from('pattern_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Load user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Load recent tasks (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('title, category, completed, created_at, completed_at, is_time_based')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Load recent memory events (last 7 days)
    const { data: recentEvents } = await supabase
      .from('memory_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Calculate recent productivity metrics
    const completedTasks = recentTasks?.filter(t => t.completed) || [];
    const incompleteTasks = recentTasks?.filter(t => !t.completed) || [];
    const completionRate = recentTasks && recentTasks.length > 0 
      ? (completedTasks.length / recentTasks.length) * 100 
      : 0;

    // Calculate average completion time
    const completionTimes = completedTasks
      .filter(t => t.completed_at)
      .map(t => {
        const created = new Date(t.created_at).getTime();
        const completed = new Date(t.completed_at!).getTime();
        return (completed - created) / (1000 * 60 * 60); // hours
      });
    
    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    const productivityMetrics = {
      completion_rate: completionRate,
      tasks_created_last_7d: recentTasks?.length || 0,
      tasks_completed_last_7d: completedTasks.length,
      tasks_pending: incompleteTasks.length,
      avg_completion_time_hours: avgCompletionTime,
    };

    console.log('Productivity metrics:', productivityMetrics);

    // Prepare data for AI
    const dataForAnalysis = {
      patterns: patterns?.map(p => p.insight),
      preferences: preferences?.preferences || {},
      recent_tasks: recentTasks?.slice(0, 20).map(t => ({
        title: t.title,
        category: t.category,
        completed: t.completed,
        created_at: t.created_at,
      })),
      recent_events: recentEvents?.slice(0, 10).map(e => ({
        event_type: e.event_type,
        created_at: e.created_at,
      })),
      productivity: productivityMetrics,
    };

    const systemPrompt = `You are Malunita's behavioral prediction system. Predict the user's near-future state and provide proactive recommendations.

Analyze:
- Behavioral patterns identified
- Learned user preferences
- Recent task activity (last 7 days)
- Recent memory events
- Productivity metrics

Predict and return ONLY valid JSON:
{
  "likely_state": "focused | distracted | fatigued | rushed",
  "risk_of_overwhelm": number (0-100),
  "recommended_focus_window": "HH:MM-HH:MM format",
  "recommended_workload": number (tasks per day),
  "motivational_suggestion": "A personalized, actionable suggestion"
}

Base predictions on actual data patterns. Be specific and helpful.`;

    console.log('Calling Lovable AI Gateway for behavior prediction...');

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
          { role: 'user', content: `Predict this user's behavioral state:\n\n${JSON.stringify(dataForAnalysis, null, 2)}` }
        ],
        temperature: 0.4,
        max_tokens: 600,
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
    
    const prediction = JSON.parse(content);

    console.log('Prediction generated:', prediction);

    return new Response(
      JSON.stringify({ 
        success: true, 
        prediction,
        productivity_context: productivityMetrics,
        predicted_at: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in behavior-predictor function:', error);
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
