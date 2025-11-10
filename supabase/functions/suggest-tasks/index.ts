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
    const { tasks, domain } = await req.json();
    
    if (!tasks) {
      throw new Error('No tasks provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating task suggestions for domain:', domain);
    console.log('Task count:', tasks.length);

    // Prepare task summary for the AI
    const taskSummary = tasks.map((t: any) => 
      `${t.completed ? '✓' : '○'} ${t.title} (${t.context || 'no context'})`
    ).join('\n');

    const systemPrompt = `You are Malunita, an AI assistant that helps users manage their tasks effectively.

Analyze the user's current tasks and patterns to suggest 3-5 new actionable tasks that would be valuable additions.

Current domain: ${domain}

Consider:
- Incomplete tasks that might need follow-up actions
- Patterns in the user's work (contexts, types of activities)
- Tasks that complement existing work
- Balance between different types of activities
- Realistic time commitments

Suggest tasks that are:
- Specific and actionable
- Relevant to the current domain (${domain})
- Complementary to existing tasks
- Not duplicates of existing tasks

Return suggestions with appropriate priority levels:
- high: Urgent or critical tasks
- medium: Important but not urgent
- low: Nice to have, can be done later`;

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
          { 
            role: 'user', 
            content: `Current tasks:\n${taskSummary}\n\nSuggest 3-5 new tasks for the ${domain} domain.` 
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_tasks",
              description: "Return 3-5 actionable task suggestions based on user's current tasks and patterns",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: {
                          type: "string",
                          description: "Clear, actionable task title"
                        },
                        priority: {
                          type: "string",
                          enum: ["low", "medium", "high"],
                          description: "Priority level of the task"
                        },
                        category: {
                          type: "string",
                          enum: ["personal", "health", "enterprises"],
                          description: "Category that best fits this task"
                        },
                        context: {
                          type: "string",
                          description: "Brief context or reason for this suggestion"
                        }
                      },
                      required: ["title", "priority", "category", "context"],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 5
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_tasks" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), 
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Generated suggestions:', result.suggestions.length);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Task suggestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
