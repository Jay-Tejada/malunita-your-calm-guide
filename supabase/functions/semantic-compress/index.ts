import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are Malunita's semantic compression engine.

You transform raw human input into a clean, actionable meaning sentence.

You do not remove or alter the original input.

OBJECTIVE:
Produce a single, clear sentence that captures the core intent,
removing filler words while preserving meaning.

RULES:
- Output MUST be 1 sentence only
- Use direct, actionable language
- Remove conversational filler ("um", "like", "I think maybe")
- Do NOT invent intent
- Do NOT split into multiple tasks (that's decomposition engine's job)
- Do NOT add advice or commentary

GOOD OUTPUT EXAMPLES:
- "Finalize care plan generator logic for initial and renewal workflows."
- "Schedule dentist appointment and order furnace filters."
- "Research Readwise integration options for Malunita."

BAD OUTPUT:
- Multi-sentence summaries
- Vague phrasing like "handle the thing"
- Repeating filler words from original
- Adding strategy or steps`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text input is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback if JSON parsing fails
      return new Response(
        JSON.stringify({
          ai_summary: content.trim(),
          confidence_score: 0.7,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ai_summary: parsed.ai_summary || '',
        confidence_score: parsed.confidence_score || 0.8,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in semantic-compress:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
