import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * OpenAI API Test Endpoint
 * Used to verify OpenAI API connectivity and configuration.
 * DELETE THIS FUNCTION AFTER VERIFICATION.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🧪 OpenAI Test endpoint called');
  const startTime = Date.now();

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: 'OPENAI_API_KEY not configured',
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OPENAI_CALL', 'gpt-4.1-2025-04-14', Date.now());
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a test assistant. Respond with exactly: "OpenAI connection successful"' },
          { role: 'user', content: 'Test' }
        ],
        max_completion_tokens: 50,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          error: `OpenAI API error: ${response.status}`,
          details: errorText,
          elapsed_ms: elapsed,
          timestamp: new Date().toISOString()
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || 'No response';

    console.log('✅ OpenAI test successful:', message);

    return new Response(
      JSON.stringify({ 
        status: 'good',
        message,
        model: 'gpt-4.1-2025-04-14',
        elapsed_ms: elapsed,
        usage: data.usage,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('❌ OpenAI test error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        elapsed_ms: elapsed,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
