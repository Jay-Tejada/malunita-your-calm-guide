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

  console.log('🎙️ Process-voice-input called');

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

    console.log('✅ User authenticated:', userId);

    // Check rate limit
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: userId,
      _endpoint: 'process-voice-input',
      _max_requests: 20,
      _window_minutes: 1
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, userProfile } = await req.json();
    
    // Input validation
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Text too long. Maximum 5000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📝 Processing text:', text.substring(0, 100));

    // ===========================================================
    // STEP 1: Detect intent/mode using AI
    // ===========================================================
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const intentSystemPrompt = `You are an intent classifier for voice input. Analyze the user's message and determine what they're trying to do.

Possible modes:
- "add_tasks": User is adding tasks, to-dos, or action items
- "ask_question": User is asking a question that needs an answer
- "journal": User is reflecting, journaling, or processing thoughts
- "request_help": User needs assistance with something specific
- "think_aloud": User is thinking out loud, no specific action needed
- "request_suggestions": User wants task suggestions or recommendations

Return JSON in this format:
{
  "mode": "add_tasks|ask_question|journal|request_help|think_aloud|request_suggestions",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this mode"
}`;

    console.log('🔍 Detecting intent...');
    const intentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: intentSystemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!intentResponse.ok) {
      throw new Error('Intent detection failed');
    }

    const intentData = await intentResponse.json();
    const intent = JSON.parse(intentData.choices[0].message.content);
    console.log('🎯 Intent detected:', intent.mode, '(confidence:', intent.confidence + ')');

    // ===========================================================
    // STEP 2: Route based on mode
    // ===========================================================
    let mode = intent.mode;
    let tasks: any[] = [];
    let insights: any = {};
    let reply_text = '';

    // For task-related modes, extract tasks
    if (mode === 'add_tasks' || mode === 'request_suggestions') {
      console.log('📋 Extracting tasks...');
      
      const { data: extractResult, error: extractError } = await supabase.functions.invoke('extract-tasks', {
        body: {
          text,
          userProfile,
          userId,
          currentDate: new Date().toISOString(),
        }
      });

      if (extractError) {
        console.error('Task extraction error:', extractError);
      } else if (extractResult?.tasks) {
        tasks = extractResult.tasks;
        insights = {
          raw_summary: extractResult.raw_summary,
          intent_tags: extractResult.intent_tags || [],
        };
        
        // Generate confirmation message
        if (tasks.length > 0) {
          reply_text = `I've captured ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}: ${tasks.map((t: any) => t.title).join(', ')}. Ready to add them?`;
        } else {
          reply_text = "I didn't find any tasks in what you said. Want to try rephrasing?";
        }
      }
    } else {
      // For non-task modes, analyze and generate a helpful response
      console.log('💬 Generating conversational response...');
      
      // Run idea analyzer for structured insights
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('idea-analyzer', {
        body: {
          text,
          extractedTasks: [],
        }
      });

      if (!analysisError && analysisResult?.analysis) {
        insights = analysisResult.analysis;
      }

      // Generate appropriate reply based on mode
      const { data: chatResult, error: chatError } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'user', content: text }
          ],
          userProfile,
          analysis: insights,
          personalityArchetype: userProfile?.companion_personality_type,
        }
      });

      if (!chatError && chatResult?.reply) {
        reply_text = chatResult.reply;
      } else {
        // Fallback response based on mode
        const fallbackResponses: Record<string, string> = {
          'ask_question': "That's a great question! Let me think about that for you.",
          'journal': "I hear you. Sometimes it helps just to get thoughts out there.",
          'request_help': "I'm here to help! What specifically can I assist you with?",
          'think_aloud': "I appreciate you sharing your thoughts with me.",
          'request_suggestions': "I'd be happy to suggest some tasks. What area would you like help with?"
        };
        reply_text = fallbackResponses[mode] || "I'm listening and here to help.";
      }
    }

    // ===========================================================
    // STEP 3: Return unified response
    // ===========================================================
    const result = {
      mode,
      tasks,
      insights,
      reply_text,
      intent_confidence: intent.confidence,
      intent_reasoning: intent.reasoning,
    };

    console.log('✅ Processing complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Process-voice-input error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        mode: 'error',
        tasks: [],
        insights: {},
        reply_text: 'Sorry, something went wrong processing your input.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
