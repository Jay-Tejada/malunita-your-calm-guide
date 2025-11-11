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
    const { tasks, domain, userId } = await req.json();
    
    if (!tasks) {
      throw new Error('No tasks provided');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Locked to gpt-4-turbo for consistency
    const model = 'gpt-4-turbo';

    console.log('Generating task suggestions for domain:', domain);
    console.log('Task count:', tasks.length);
    console.log('Using model:', model);

    // Prepare task summary for the AI
    const taskSummary = tasks.map((t: any) => 
      `${t.completed ? '✓' : '○'} ${t.title}${t.context ? ` (${t.context})` : ''}`
    ).join('\n');

    const systemPrompt = `You are a productivity assistant helping the user think clearly. Based on recent voice notes, unfinished tasks, and goal themes, suggest 3–5 tasks that are meaningful and time-sensitive. Keep it light, encouraging, and avoid generic fluff.

Current domain: ${domain}

Consider:
- Incomplete tasks that might need follow-up actions
- Patterns in the user's work and activities
- Tasks that complement existing work
- Balance between different types of activities
- Realistic time commitments
- What would be genuinely helpful right now

Suggest tasks that are:
- Specific and actionable
- Relevant to the current domain (${domain})
- Complementary to existing tasks
- Not duplicates of existing tasks
- Time-sensitive or meaningful to current goals`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
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
                          enum: ["inbox", "home", "work", "gym", "projects"],
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
        tool_choice: { type: "function", function: { name: "suggest_tasks" } },
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      // Alert builder about failures - don't fallback
      if (response.status === 429) {
        console.error('BUILDER ALERT: OpenAI rate limit exceeded for suggest-tasks');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.error('BUILDER ALERT: OpenAI API failure in suggest-tasks:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('BUILDER ALERT: No tool call in OpenAI response for suggest-tasks');
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Generated suggestions:', result.suggestions.length);

    // Log API usage for admin tracking
    if (userId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.80.0');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const totalTokens = data.usage?.total_tokens || 0;
        const costPer1kTokens = 0.020; // gpt-4-turbo cost
        const estimatedCost = (totalTokens / 1000) * costPer1kTokens;

        await supabase.from('api_usage_logs').insert({
          user_id: userId,
          function_name: 'suggest-tasks',
          model_used: model,
          tokens_used: totalTokens,
          estimated_cost: estimatedCost,
        });
      } catch (logError) {
        console.error('Failed to log usage:', logError);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('BUILDER ALERT: Task suggestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
