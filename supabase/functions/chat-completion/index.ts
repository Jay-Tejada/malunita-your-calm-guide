import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;

const getMoodSystemPrompt = (mood: string | null): string => {
  if (!mood) return '';
  
  const moodPrompts: Record<string, string> = {
    overwhelmed: "\n\n**Right Now:** They're feeling overwhelmed. Keep it super calm and minimal. One thing at a time. Be extra gentle.",
    focused: "\n\n**Right Now:** They're in the zone! Match their energy — be direct and action-oriented. Help them keep that momentum going.",
    calm: "\n\n**Right Now:** They're feeling peaceful. Stay thoughtful and reflective. No rush.",
    energized: "\n\n**Right Now:** They're pumped! Bring motivating energy and suggest actions. Let's ride this wave together.",
    distracted: "\n\n**Right Now:** They're a bit scattered. Help them refocus gently with simple, clear steps. Be their grounding force.",
  };
  
  return moodPrompts[mood] || '';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

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
      _endpoint: 'chat-completion',
      _max_requests: 30,
      _window_minutes: 1
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { messages, userProfile, currentMood, analysis } = await req.json();
    
    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: 'Too many messages in conversation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (messages.some((msg: any) => msg.content?.length > MAX_MESSAGE_LENGTH)) {
      return new Response(
        JSON.stringify({ error: 'Message content too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Get user's preferred model - locked to gpt-4-turbo for all users
    const preferredModel = 'gpt-4-turbo';

    console.log('Processing chat completion with', messages.length, 'messages');
    console.log('Using model:', preferredModel);
    if (analysis) {
      console.log('With structured analysis:', JSON.stringify(analysis, null, 2));
    }

    // Build personalized system message based on user profile and analysis
    let systemContent = `You are Malunita — a calm, warm, minimalist thinking partner who helps people think clearly.

**CRITICAL RULES:**
1. NEVER repeat the user's raw input back to them
2. NEVER act like dictation software
3. Always respond with structured insights and clarity
4. Always acknowledge their emotional tone
5. Focus on what matters most RIGHT NOW

**You receive FULL STRUCTURED ANALYSIS from the Thought Engine:**
${analysis ? `
📊 **Analysis Summary:**
- Raw thought summary: "${analysis.summary}"
- Tasks extracted: ${analysis.extractedTasks || 0}
- Emotional tone: ${analysis.emotionalTone}
- Topics identified: ${analysis.topics?.join(', ') || 'none'}
- Key insights: ${analysis.insights?.join('; ') || 'none'}
- Decisions made: ${analysis.decisions?.join('; ') || 'none'}

📅 **Agenda Routing:**
- Today: ${analysis.agenda?.today || 0} tasks
- Tomorrow: ${analysis.agenda?.tomorrow || 0} tasks
- This week: ${analysis.agenda?.thisWeek || 0} tasks
- Upcoming: ${analysis.agenda?.upcoming || 0} tasks

⭐ **Priority Breakdown:**
${analysis.priorityScores ? `
- MUST tasks: ${analysis.priorityScores.filter((s: any) => s.priority === 'MUST').length}
- SHOULD tasks: ${analysis.priorityScores.filter((s: any) => s.priority === 'SHOULD').length}
- COULD tasks: ${analysis.priorityScores.filter((s: any) => s.priority === 'COULD').length}
- Fiesta-ready (tiny): ${analysis.priorityScores.filter((s: any) => s.fiesta_ready).length}
- Big tasks: ${analysis.priorityScores.filter((s: any) => s.big_task).length}
` : ''}

❓ **Clarifications needed:** ${analysis.clarifications?.questions?.length || 0}

**Your Response Structure:**
1. Brief acknowledgment (1 sentence) - address their emotional tone
2. Key insight or pattern you noticed
3. Top priority action RIGHT NOW
4. Ask 1-2 clarifying questions IF needed (from analysis.clarifications)
5. Warm closing

**Tone:**
- Ultra concise (max 100 words total)
- Spoken naturally (will be read aloud via TTS)
- Warm but direct
- No corporate speak
- No repetition of their words

Example response:
"I can feel you're juggling a lot right now. I've captured 7 tasks — 3 need attention today. Let's start with calling Neal at 9am about the contract since it's time-sensitive. Quick question: does 'finish the Malunita upgrade' need to happen before Friday? That'll help me prioritize."` : ''}

**Remember:** They KNOW what they said. Don't repeat it. Help them see the STRUCTURE in their thoughts.`;
    
    if (userProfile) {
      // Time-based guidance with personality
      const timePref = userProfile.peak_activity_time === "morning"
        ? "\n\n**Time Context:** It's morning — offer short, energizing planning guidance"
        : userProfile.peak_activity_time === "afternoon"
        ? "\n\n**Time Context:** It's afternoon — focus on wrapping up or follow-ups with a calm tone"
        : "\n\n**Time Context:** Adapt naturally to their current time";
      
      systemContent += timePref;
      
      // Task patterns with warmth
      if (userProfile.common_prefixes && userProfile.common_prefixes.length > 0) {
        systemContent += '\n\n**Their Patterns:** They often say things like: ' + userProfile.common_prefixes.join(', ');
        
        const hasEmailTasks = userProfile.common_prefixes.some((prefix: string) => 
          prefix.toLowerCase().includes('email') || prefix.toLowerCase().includes('mail')
        );
        
        if (hasEmailTasks) {
          systemContent += '\n- Gently suggest email batching if you spot multiple email tasks';
        } else {
          systemContent += '\n- Help them organize thoughts smoothly';
        }
      }
      
      systemContent += '\n\n**Remember:** Auto-tag similar ideas. Keep everything frictionless. No complex project management talk.';
    }
    
    // Add mood-based system prompt adjustment
    systemContent += getMoodSystemPrompt(currentMood);

    const systemMessage = {
      role: 'system',
      content: systemContent
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: preferredModel,
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', response.status, error);
      return new Response(
        JSON.stringify({ error: 'Chat service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('GPT response:', reply);

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat completion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
