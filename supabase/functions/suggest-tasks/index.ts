import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TASKS = 100;
const MAX_DOMAIN_LENGTH = 100;

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

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
      _endpoint: 'suggest-tasks',
      _max_requests: 10,
      _window_minutes: 1
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { tasks, domain, userId } = await req.json();
    
    // Input validation
    if (!tasks || !Array.isArray(tasks)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tasks format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (tasks.length > MAX_TASKS) {
      return new Response(
        JSON.stringify({ error: 'Too many tasks provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (domain && domain.length > MAX_DOMAIN_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Domain name too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

    const systemPrompt = `You are an intelligent productivity assistant. Your role is to:

1. **PROACTIVELY BREAK DOWN COMPLEX TASKS**
   - Identify tasks containing multiple distinct actions (e.g., "Buy sauna gear and research saunas" → 2 tasks)
   - Suggest sub-tasks for large or vague tasks
   - Mark these as suggestion_type: "breakdown" and reference parent_task_title

2. **AUTO-IDENTIFY TEMPORAL CUES AND SUGGEST SCHEDULES**
   - Extract deadlines from phrases like "by Friday", "next week", "end of month", "urgent"
   - Identify recurring patterns: "weekly", "monthly", "every Monday", "daily"
   - Set suggested_due_date and is_recurring + recurrence_pattern accordingly
   - Mark these as suggestion_type: "scheduled"

3. **SUGGEST RELATED SUB-TASKS BASED ON KEYWORDS**
   - If "client list" is mentioned → suggest "Verify client contact info", "Update client database"
   - If "meeting" → suggest "Prepare agenda", "Send calendar invite", "Follow up notes"
   - If "project" → suggest "Create timeline", "Assign resources", "Set milestones"
   - Mark these as suggestion_type: "related" and include related_keywords
   - Mark follow-up actions as suggestion_type: "followup"

4. **HANDLE CONTEXTUAL INFORMATION AS NOTES**
   - Extract non-actionable details (background info, reasoning, constraints)
   - Store in contextual_note field to keep task titles concise
   - Example: Task "Call John" + contextual_note: "Regarding Q4 budget discussion"

Current domain: ${domain}

Analyze existing tasks for:
- Tasks that need breaking down (multiple actions in one)
- Tasks with implicit deadlines or temporal cues
- Keywords that suggest related workflows
- Contextual information that should be notes

Return 3-7 suggestions that are specific, actionable, and genuinely helpful.`;

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
              description: "Return 3-7 intelligent task suggestions including breakdowns, schedules, and related sub-tasks",
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
                        },
                        suggestion_type: {
                          type: "string",
                          enum: ["breakdown", "related", "followup", "scheduled", "standard"],
                          description: "Type of suggestion: breakdown (from complex task), related (based on keywords), followup (next action), scheduled (has due date), standard (regular suggestion)"
                        },
                        parent_task_title: {
                          type: "string",
                          description: "If suggestion_type is 'breakdown', the title of the task being broken down"
                        },
                        suggested_due_date: {
                          type: "string",
                          description: "ISO date string if temporal cues detected (e.g., '2024-11-20'). Empty string if none."
                        },
                        is_recurring: {
                          type: "boolean",
                          description: "True if task should repeat (weekly, monthly, etc.)"
                        },
                        recurrence_pattern: {
                          type: "string",
                          description: "Human-readable recurrence (e.g., 'Weekly on Mondays', 'Every 2 weeks', 'Monthly'). Empty if not recurring."
                        },
                        related_keywords: {
                          type: "array",
                          items: { type: "string" },
                          description: "Keywords that triggered related suggestions (e.g., ['client', 'meeting'])"
                        },
                        contextual_note: {
                          type: "string",
                          description: "Non-actionable background info to keep task title concise (e.g., 'Regarding Q4 budget'). Empty if none."
                        }
                      },
                      required: ["title", "priority", "category", "context", "suggestion_type"],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 7
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
      return new Response(
        JSON.stringify({ error: 'Task suggestion service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
