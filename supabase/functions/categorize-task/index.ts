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

    // Fetch user's custom categories
    const { data: customCategories } = await supabase
      .from('custom_categories')
      .select('id, name')
      .eq('user_id', user.id);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Updated to gpt-4.1 for improved performance
    const model = 'gpt-4.1-2025-04-14';
    console.log("OPENAI_CALL", model, Date.now());

    console.log('Categorizing task:', text);
    console.log('Using model:', model);
    console.log('User has custom categories:', customCategories?.map(c => c.name).join(', '));

    // Build system prompt with custom categories
    let systemPrompt = `You are Malunita, a helpful AI assistant that categorizes tasks. 
Analyze the task and categorize it into one of these domains:
- inbox: Default category for uncategorizable tasks or when unclear
- home: Tasks related to personal life, hobbies, errands, home chores, relationships, family, etc.
- work: Tasks related to work, business, professional development, career, office tasks, etc.
- gym: Tasks related to fitness, exercise, workouts, sports, physical training, etc.
- projects: Tasks related to personal projects, side projects, creative work, building things, etc.
- someday: Tasks for the future, not urgent, ideas to revisit later, bucket list items, etc.`;

    if (customCategories && customCategories.length > 0) {
      systemPrompt += `\n\nThe user has also created these custom categories that you should prefer when they match:\n`;
      customCategories.forEach(cat => {
        systemPrompt += `- ${cat.name}: Use this when the user mentions "${cat.name}" or related keywords\n`;
      });
      systemPrompt += `\nWhen the user says to "tag this to [name]" or mentions a custom category name, use that custom category.`;
    }

    systemPrompt += `\n\nReturn ONLY a JSON object with this structure:
{
  "category": "inbox" | "home" | "work" | "gym" | "projects" | "someday" | "<custom_category_name>",
  "confidence": "high" | "low",
  "custom_category_id": "<id>" // Only include if it's a custom category
}

Examples:
- "Buy groceries" → {"category": "home", "confidence": "high"}
- "Finish the presentation for Monday" → {"category": "work", "confidence": "high"}
- "Go for a run" → {"category": "gym", "confidence": "high"}
- "Work on side project website" → {"category": "projects", "confidence": "high"}
- "Learn Spanish someday" → {"category": "someday", "confidence": "high"}`;

    if (customCategories && customCategories.length > 0) {
      systemPrompt += `\n- "Tag this to ${customCategories[0].name}" → {"category": "${customCategories[0].name}", "confidence": "high", "custom_category_id": "${customCategories[0].id}"}`;
    }

    systemPrompt += `\n\nBe confident and decisive. Use "low" confidence only when truly ambiguous.`;

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
            content: systemPrompt
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
            category: 'inbox', 
            confidence: 'low',
            error: 'Rate limit exceeded' 
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
          category: 'inbox', 
          confidence: 'low',
          error: 'Service temporarily unavailable'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log('Categorized as:', result.category, 'with', result.confidence, 'confidence');

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
        category: 'inbox', 
        confidence: 'low',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
