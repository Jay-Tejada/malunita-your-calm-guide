import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, userProfile, userId } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
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

    const systemPrompt = `You are Malunita, a smart voice productivity assistant for solo creators. Your job is to extract actionable tasks from natural, unfiltered voice input.

Guidelines:
- Extract 1-3 clear, actionable tasks maximum
- Clean up rambling or vague language into clear task titles
- Suggest appropriate categories: inbox, work, home, projects, gym
- Suggest timeframes: today, this_week, later
- Create friendly confirmation prompts for each task
- If the input is just a question or comment (not a task), return empty tasks array

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
      "confirmation_prompt": "Should I add this to Work for today?"
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
      
      throw new Error(`OpenAI API error: ${response.status}`);
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
