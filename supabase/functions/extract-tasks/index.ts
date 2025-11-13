import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TEXT_LENGTH = 5000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract JWT and validate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limit
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'extract-tasks',
      _max_requests: 20,
      _window_minutes: 1
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, userProfile, userId } = await req.json();
    
    // Input validation
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid text input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Text too long. Maximum 5000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user's preferred model - locked to gpt-4-turbo for all users
    const preferredModel = 'gpt-4-turbo';
    
    // Fetch learning data if userId provided
    let learningInsights = '';
    if (userId) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.80.0');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get recent corrections to learn from
      const { data: feedback } = await supabase
        .from('task_learning_feedback')
        .select('*')
        .eq('user_id', userId)
        .eq('was_corrected', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (feedback && feedback.length > 0) {
        // Aggregate patterns
        const categoryPatterns: Record<string, string[]> = {};
        const timeframePatterns: Record<string, string[]> = {};
        
        feedback.forEach(item => {
          // Build category patterns
          const key = item.task_title.toLowerCase();
          if (!categoryPatterns[item.actual_category]) {
            categoryPatterns[item.actual_category] = [];
          }
          categoryPatterns[item.actual_category].push(key);
          
          // Build timeframe patterns
          if (!timeframePatterns[item.actual_timeframe]) {
            timeframePatterns[item.actual_timeframe] = [];
          }
          timeframePatterns[item.actual_timeframe].push(key);
        });
        
        learningInsights = `\n\nLearning from user's past corrections:
- Category preferences: ${Object.entries(categoryPatterns).map(([cat, tasks]) => 
  `${cat} for tasks like: ${tasks.slice(0, 3).join(', ')}`).join('; ')}
- Timeframe preferences: ${Object.entries(timeframePatterns).map(([time, tasks]) => 
  `${time} for tasks like: ${tasks.slice(0, 3).join(', ')}`).join('; ')}`;
      }
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const systemPrompt = `You are Malunita, a goal-aware productivity coach for solo creators. Your job is to extract actionable tasks from natural, unfiltered voice input and evaluate their alignment with the user's stated goal.

${userProfile?.current_goal ? `🎯 USER'S CURRENT GOAL: "${userProfile.current_goal}" (${userProfile.goal_timeframe || 'this_week'})` : ''}

Guidelines:
- Extract 1-3 clear, actionable tasks maximum
- Clean up rambling or vague language into clear task titles
- Suggest appropriate categories: inbox, work, home, projects, gym
- Suggest timeframes: today, this_week, later
- Extract reminder times if mentioned (e.g., "remind me at 10 AM", "set reminder for 3 PM tomorrow")
- Return reminder_time as ISO 8601 timestamp if time-based reminder is mentioned, otherwise null
- Create friendly confirmation prompts for each task

${userProfile?.current_goal ? `Goal Alignment Evaluation:
- Analyze if this task directly supports the stated goal
- goal_aligned = true: Task directly contributes to achieving the goal
- goal_aligned = false: Task is unrelated to the goal (general/background work)
- goal_aligned = null: Unclear or could be tangentially related
- Provide a brief alignment_reason when applicable` : ''}

${userProfile?.peak_activity_time ? `User's peak activity time: ${userProfile.peak_activity_time}` : ''}
${userProfile?.common_prefixes?.length > 0 ? `User often uses these prefixes: ${userProfile.common_prefixes.join(', ')}` : ''}${learningInsights}

Return valid JSON in this exact format:
{
  "tasks": [
    {
      "title": "Clear task title",
      "suggested_category": "work",
      "suggested_timeframe": "today",
      "confidence": 0.85,
      "reminder_time": "2024-01-15T10:00:00Z or null",
      "confirmation_prompt": "Should I add this to Work for today?"${userProfile?.current_goal ? `,
      "goal_aligned": true,
      "alignment_reason": "This directly supports your goal by..."` : ''}
    }
  ],
  "conversation_reply": "Optional friendly reply if no tasks were found"
}`;

    console.log('Extracting tasks from:', text);
    console.log('Using model:', preferredModel);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: preferredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Task extraction service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log('Extracted tasks:', result);

    // Log API usage for admin tracking
    if (userId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.80.0');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const totalTokens = data.usage?.total_tokens || 0;
        const modelCosts: Record<string, number> = {
          'gpt-3.5-turbo': 0.001,
          'gpt-4': 0.045,
          'gpt-4-turbo': 0.020,
          'gpt-4o': 0.010,
        };
        const costPer1kTokens = modelCosts[preferredModel] || 0.020;
        const estimatedCost = (totalTokens / 1000) * costPer1kTokens;

        await supabase.from('api_usage_logs').insert({
          user_id: userId,
          function_name: 'extract-tasks',
          model_used: preferredModel,
          tokens_used: totalTokens,
          estimated_cost: estimatedCost,
        });
      } catch (logError) {
        console.error('Failed to log usage:', logError);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract tasks';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
