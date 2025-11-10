import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Splitting tasks from text:', text);

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
            content: 'You are a task extraction assistant. Extract individual actionable tasks from user input. Return ONLY tasks, not general thoughts or statements.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_tasks',
              description: 'Extract individual tasks from the text',
              parameters: {
                type: 'object',
                properties: {
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { 
                          type: 'string',
                          description: 'Clear, concise task title'
                        },
                        has_person_name: { 
                          type: 'boolean',
                          description: 'Does this task mention a specific person name?'
                        },
                        has_reminder: { 
                          type: 'boolean',
                          description: 'Does this task need a reminder or follow-up?'
                        },
                        is_time_based: { 
                          type: 'boolean',
                          description: 'Is this task time-specific or has a deadline?'
                        },
                        keywords: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'Key action words (e.g., email, call, follow-up, send)'
                        }
                      },
                      required: ['title', 'has_person_name', 'has_reminder', 'is_time_based', 'keywords'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['tasks'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_tasks' } }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error('AI gateway error: ' + response.status);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Extracted tasks:', result.tasks);

    return new Response(
      JSON.stringify({ tasks: result.tasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Task splitting error:', error);
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
