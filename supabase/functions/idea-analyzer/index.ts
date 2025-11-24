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
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Idea-analyzer function called');

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract user ID from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(atob(jwt.split('.')[1]))
    const userId = payload.sub
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', userId);

    // Fetch today's primary focus task for alignment checking
    const today = new Date().toISOString().split('T')[0];
    const { data: todayFocus } = await supabase
      .from('daily_focus_history')
      .select('focus_task, cluster_label')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    const primaryFocusTask = todayFocus?.focus_task || null;
    const primaryFocusCluster = todayFocus?.cluster_label || null;

    console.log('Today\'s ONE-thing:', primaryFocusTask);

    // Check rate limit
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: userId,
      _endpoint: 'idea-analyzer',
      _max_requests: 20,
      _window_minutes: 1
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { text, extractedTasks } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Text too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Analyzing text:', text.substring(0, 100));

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert at analyzing raw user input and extracting structured meaning.

Your job is to analyze the user's input and return a JSON object with the following structure:
{
  "summary": "A brief summary of what the user said (1-2 sentences max)",
  "topics": ["topic1", "topic2"],
  "insights": ["key insight 1", "key insight 2"],
  "decisions": ["decision 1", "decision 2"],
  "ideas": ["idea 1", "idea 2"],
  "followups": ["followup 1", "followup 2"],
  "questions": ["question they're asking themselves"],
  "emotional_tone": "neutral|overwhelmed|focused|stressed",
  "primary_focus_alignment": {
    "score": "aligned|neutral|distracting",
    "reasoning": "Brief explanation of alignment"
  }
}

${primaryFocusTask ? `\n**CRITICAL CONTEXT: Today's ONE-thing priority is "${primaryFocusTask}"**\nWhen analyzing tasks, consider their relationship to this primary focus:\n- "aligned": Tasks that directly support or enable the ONE-thing\n- "neutral": Unrelated tasks that don't conflict\n- "distracting": Tasks that compete for attention or conflict with the ONE-thing\n` : ''}

Guidelines:
- Keep summary SHORT (under 20 words)
- Infer implicit topics from context
- Extract clear decisions they've made
- Identify questions they're asking themselves (not asking you)
- Detect emotional tone from language patterns
- Identify actionable follow-ups
- Be concise and specific
${primaryFocusTask ? '- ALWAYS assess alignment with the ONE-thing when provided' : ''}`;

    const userPrompt = `Analyze this input:

"${text}"

${extractedTasks && extractedTasks.length > 0 ? `\nExtracted tasks: ${extractedTasks.map((t: any) => t.title).join(', ')}` : ''}
${primaryFocusTask ? `\n\n**Today's ONE-thing priority**: "${primaryFocusTask}"${primaryFocusCluster ? ` (${primaryFocusCluster} domain)` : ''}` : ''}

Return ONLY the JSON object, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Raw GPT response:', content);

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse GPT response:', content);
      // Return a default structure if parsing fails
      analysis = {
        summary: text.substring(0, 100),
        topics: [],
        insights: [],
        decisions: [],
        ideas: [],
        followups: [],
        questions: [],
        emotional_tone: 'neutral'
      };
    }

    console.log('Structured analysis:', analysis);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Idea analysis error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
