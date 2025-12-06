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

    const { text, userProfile, conversationHistory = [] } = await req.json();
    
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

    // Build conversation context for intent detection
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nRecent conversation:\n' + 
        conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');
    }

    const intentSystemPrompt = `You are an intent classifier for voice input. Analyze the user's message and determine what they're trying to do.

Possible modes:
- "add_tasks": User is adding tasks, to-dos, or action items
- "ask_question": User is asking a question that needs an answer
- "journal": User is reflecting, journaling, or processing thoughts
- "request_help": User needs assistance with something specific
- "think_aloud": User is thinking out loud, no specific action needed
- "request_suggestions": User wants task suggestions or recommendations

${conversationContext}

Return JSON in this format:
{
  "mode": "add_tasks|ask_question|journal|request_help|think_aloud|request_suggestions",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this mode"
}`;

    const model = 'gpt-4.1-2025-04-14';
    console.log('🔍 Detecting intent...', "OPENAI_CALL", model, Date.now());
    const intentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
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
          conversationHistory,
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
    } else if (mode === 'journal' || mode === 'think_aloud') {
      // Phase 2B: Route journal/think_aloud to generate-journal-summary (structured analysis)
      console.log('📓 Processing reflection via journal summary...');
      
      const { data: journalResult, error: journalError } = await supabase.functions.invoke('generate-journal-summary', {
        body: {
          entries: [{ content: text, created_at: new Date().toISOString() }],
          timeframe: 'day',
        }
      });

      if (!journalError && journalResult?.summary) {
        insights = { reflection_summary: journalResult.summary };
        reply_text = mode === 'journal' 
          ? "I've captured your thoughts. Taking a moment to reflect can be powerful."
          : "I hear you. Sometimes it helps just to get thoughts out there.";
      } else {
        reply_text = "I've noted your thoughts. Anything specific you'd like to explore?";
      }
      
    } else if (mode === 'request_suggestions') {
      // Phase 2B: Route to suggest-focus for task suggestions
      console.log('💡 Getting task suggestions via suggest-focus...');
      
      const { data: suggestResult, error: suggestError } = await supabase.functions.invoke('suggest-focus', {
        body: { locationContext: null }
      });

      if (!suggestError && suggestResult) {
        insights = { suggestions: suggestResult.suggestedTasks || [] };
        reply_text = suggestResult.message || "Here are some suggestions based on your tasks.";
        
        // If suggest-focus returned tasks, include them
        if (suggestResult.suggestedTasks?.length > 0) {
          tasks = suggestResult.suggestedTasks.map((t: any) => ({
            title: t.title || t,
            suggested_category: t.category || 'inbox',
            suggested_timeframe: 'today',
            confidence: 0.7,
            is_suggestion: true,
          }));
        }
      } else {
        reply_text = "I'd be happy to suggest some tasks. What area would you like help with?";
      }
      
    } else {
      // Phase 2B: ask_question and request_help return structured fallbacks (no chat-completion)
      console.log('ℹ️ Returning structured fallback for mode:', mode);
      
      // Run idea analyzer for any useful insights
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('idea-analyzer', {
        body: {
          text,
          extractedTasks: [],
        }
      });

      if (!analysisError && analysisResult?.analysis) {
        insights = analysisResult.analysis;
      }

      // Structured responses - no conversational AI
      const structuredResponses: Record<string, string> = {
        'ask_question': "I can help you add tasks, journal your thoughts, or suggest what to focus on. What would you like to do?",
        'request_help': "I'm here to help! You can add tasks by speaking them, or ask me to suggest what to focus on next.",
      };
      reply_text = structuredResponses[mode] || "I'm listening. Try adding a task or journaling your thoughts.";
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
