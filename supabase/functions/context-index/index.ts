import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are Malunita's context and memory indexing engine.

You do not generate UI content.
You prepare inputs for long-term contextual understanding.

OBJECTIVE:
Extract durable semantic signals that enable future context retrieval.
This is how Malunita starts to "know your world."

INDEXING TASKS:
- Identify recurring themes (e.g., "PCMH Pro", "renewals", "care plans")
- Detect project associations
- Tag by domain (work, personal, health, finance, etc.)
- Note relationships to prior items (if detectable)

RULES:
- Focus on THEMES, not exact wording
- Keep tags abstract and reusable
- Avoid storing sensitive personal data (SSN, passwords, etc.)
- Lightweight — don't over-index
- Maximum 5 memory_tags
- Maximum 3 related_spaces

OUTPUT FORMAT (JSON ONLY):
{
  "memory_tags": ["theme_1", "theme_2"],
  "related_spaces": ["Work", "Project"],
  "project_association": "PCMH Pro" | null,
  "context_weight": 0.0-1.0
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ai_summary, destination, related_project, related_space } = await req.json();

    if (!ai_summary || typeof ai_summary !== 'string') {
      return new Response(
        JSON.stringify({ error: 'ai_summary is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context for the indexing request
    const userPrompt = `Analyze this content for memory indexing:

Summary: ${ai_summary}
Destination: ${destination || 'Inbox'}
${related_project ? `Related Project: ${related_project}` : ''}
${related_space ? `Related Space: ${related_space}` : ''}

Extract semantic signals for long-term memory retrieval.`;

    console.log('Indexing context for:', ai_summary.substring(0, 50));

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
          { role: 'user', content: userPrompt }
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
    
    console.log('Context indexing response:', content.substring(0, 100));
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback with minimal indexing
      return new Response(
        JSON.stringify({
          memory_tags: [],
          related_spaces: destination ? [destination] : ['Inbox'],
          project_association: related_project || null,
          context_weight: 0.5,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and normalize output
    const result = {
      memory_tags: Array.isArray(parsed.memory_tags) ? parsed.memory_tags.slice(0, 5) : [],
      related_spaces: Array.isArray(parsed.related_spaces) ? parsed.related_spaces.slice(0, 3) : [],
      project_association: parsed.project_association || null,
      context_weight: typeof parsed.context_weight === 'number' 
        ? Math.max(0, Math.min(1, parsed.context_weight)) 
        : 0.5,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in context-index:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
