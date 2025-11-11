import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TEXT_LENGTH = 2000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT and validate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ category: 'inbox', confidence: 'low', error: 'Authentication required' }),
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
        JSON.stringify({ category: 'inbox', confidence: 'low', error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limit
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'categorize-task',
      _max_requests: 30,
      _window_minutes: 1
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ category: 'inbox', confidence: 'low', error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, userId } = await req.json();
    
    // Input validation
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ category: 'inbox', confidence: 'low', error: 'Invalid text input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ category: 'inbox', confidence: 'low', error: 'Text too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Locked to gpt-4-turbo for consistency
    const model = 'gpt-4-turbo';

    console.log('Categorizing task:', text);
    console.log('Using model:', model);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are Malunita, a helpful AI assistant that categorizes tasks. 
Analyze the task and provide the top 3 most likely categories from these options:
- inbox: Default category for uncategorizable tasks or when unclear
- home: Tasks related to personal life, hobbies, errands, home chores, relationships, family, etc.
- work: Tasks related to work, business, professional development, career, office tasks, etc.
- gym: Tasks related to fitness, exercise, workouts, sports, physical training, etc.
- projects: Tasks related to personal projects, side projects, creative work, building things, etc.

Return ONLY a JSON object with this structure:
{
  "predictions": [
    {"category": "home", "confidence": 0.85, "reason": "Involves grocery shopping"},
    {"category": "projects", "confidence": 0.10, "reason": "Could be a cooking project"},
    {"category": "inbox", "confidence": 0.05, "reason": "Default fallback"}
  ]
}

The predictions array must have exactly 3 items, ranked by confidence (highest first).
Confidence scores should sum to approximately 1.0.
Provide brief, clear reasons for each prediction.

Examples:
- "Buy groceries" → top prediction: home (0.85), projects (0.10), inbox (0.05)
- "Finish the presentation for Monday" → top prediction: work (0.90), projects (0.08), inbox (0.02)
- "Go for a run" → top prediction: gym (0.92), home (0.06), inbox (0.02)

Be decisive and rank confidently.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        console.error('BUILDER ALERT: OpenAI rate limit exceeded for categorize-task');
        return new Response(
          JSON.stringify({ 
            predictions: [
              { category: 'inbox', confidence: 0.90, reason: 'rate limit fallback' },
              { category: 'home', confidence: 0.05, reason: 'alternate option' },
              { category: 'work', confidence: 0.05, reason: 'alternate option' }
            ]
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.error('BUILDER ALERT: OpenAI API failure in categorize-task:', response.status);
    // Gracefully fallback to inbox for categorization failures
    return new Response(
      JSON.stringify({ 
        predictions: [
          { category: 'inbox', confidence: 0.90, reason: 'default fallback' },
          { category: 'home', confidence: 0.05, reason: 'alternate option' },
          { category: 'work', confidence: 0.05, reason: 'alternate option' }
        ]
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log('Top predictions:', result.predictions?.map((p: any) => `${p.category} (${p.confidence})`).join(', '));

    // Log API usage for admin tracking
    if (userId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.80.0');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const totalTokens = data.usage?.total_tokens || 0;
        const costPer1kTokens = 0.020; // gpt-4-turbo cost
        const estimatedCost = (totalTokens / 1000) * costPer1kTokens;

        await supabase.from('api_usage_logs').insert({
          user_id: userId,
          function_name: 'categorize-task',
          model_used: model,
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
    console.error('BUILDER ALERT: Task categorization error:', error);
    // Gracefully fallback to inbox for categorization errors
    return new Response(
      JSON.stringify({ 
        predictions: [
          { category: 'inbox', confidence: 0.90, reason: 'error fallback' },
          { category: 'home', confidence: 0.05, reason: 'alternate option' },
          { category: 'work', confidence: 0.05, reason: 'alternate option' }
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
