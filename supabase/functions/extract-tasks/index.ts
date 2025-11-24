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

    const { text, userProfile, userId, currentDate } = await req.json();
    
    // Get current date for time calculations
    const now = currentDate ? new Date(currentDate) : new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().split(' ')[0];
    
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
      
      // Get user's custom categories
      const { data: customCategories } = await supabase
        .from('custom_categories')
        .select('id, name')
        .eq('user_id', userId);
      
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

      // Add custom categories to learning insights
      if (customCategories && customCategories.length > 0) {
        learningInsights += `\n\nUser's custom categories:\n`;
        customCategories.forEach(cat => {
          learningInsights += `- "${cat.name}" (ID: ${cat.id}): Use when user mentions this category by name or related keywords\n`;
        });
        learningInsights += `When the user says "tag this to [name]", use that custom category if it exists.`;
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
- Suggest appropriate categories: inbox, work, home, projects, gym, someday, or user's custom categories
- Suggest timeframes: today, this_week, later
- Extract reminder dates AND times if mentioned:
  * Current date context: ${currentDateStr} at ${currentTimeStr}
  * Relative dates: "tomorrow at 10 AM", "next Monday at 3 PM", "in 3 days at noon"
  * Absolute dates: "November 10th at 10 AM", "Dec 25 at 9:00", "on the 15th at 2 PM"
  * Time only: "remind me at 10 AM" or "due at 3 PM" (assumes today: ${currentDateStr})
  * Date only: "remind me tomorrow" or "due tomorrow" (assumes 9 AM)
  * "today" references should use: ${currentDateStr}
- Return reminder_time as complete ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ) including date and time
- If no reminder mentioned, return null for reminder_time
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
      "custom_category_id": "<id if custom category>",
      "suggested_timeframe": "today",
      "confidence": 0.85,
      "reminder_time": "2024-11-10T10:00:00Z (complete ISO 8601 with date + time, or null if no reminder)",
      "confirmation_prompt": "Should I add this to Work for today?"${userProfile?.current_goal ? `,
      "goal_aligned": true,
      "alignment_reason": "This directly supports your goal by..."` : ''}
    }
  ],
  "conversation_reply": "Optional friendly reply if no tasks were found"
}

Examples for reminder_time (using current date ${currentDateStr}):
- "due at 10 AM" or "at 10 AM today" → "${currentDateStr}T10:00:00Z"
- "remind me tomorrow at 3 PM" → calculate tomorrow from ${currentDateStr}
- "remind me November 10th at 10 AM" → "2024-11-10T10:00:00Z"
- "remind me next Monday at 9 AM" → calculate next Monday from ${currentDateStr}
- "today at 5 PM" → "${currentDateStr}T17:00:00Z"
- No reminder mentioned → null`;

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
