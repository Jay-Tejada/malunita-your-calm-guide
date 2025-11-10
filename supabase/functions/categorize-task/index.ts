import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('No text provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Categorizing task:', text);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are Malunita, a helpful AI assistant that categorizes tasks. 
Analyze the task and categorize it into one of these domains:
- personal: Tasks related to personal life, hobbies, errands, home, relationships, etc.
- health: Tasks related to health, fitness, medical appointments, wellness, mental health, etc.
- enterprises: Tasks related to work, business, professional development, career, etc.

Return ONLY a JSON object with this structure:
{
  "category": "personal" | "health" | "enterprises",
  "confidence": "high" | "low"
}

Use "high" confidence when the categorization is clear and obvious.
Use "low" confidence when the task is ambiguous or could fit multiple categories.`
          },
          {
            role: 'user',
            content: `Categorize this task: "${text}"`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_task",
              description: "Categorize a task into personal, health, or enterprises domain",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["personal", "health", "enterprises"],
                    description: "The domain category for the task"
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "low"],
                    description: "Confidence level of the categorization"
                  }
                },
                required: ["category", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "categorize_task" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your workspace.');
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Categorization result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Categorization error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
