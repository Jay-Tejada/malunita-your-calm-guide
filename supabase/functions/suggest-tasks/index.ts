// =============================================================================
// DEPRECATED: Consolidating to suggest-focus (Phase 3B)
// Date flagged: 2024-12-04
// Replacement: Use suggest-focus for all task/focus suggestions
// Frontend callers updated: TaskSuggestions.tsx, TestAll.tsx
// =============================================================================

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

    const { tasks, domain, userId, burnoutRecovery } = await req.json();
    
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

    // Fetch user's focus preferences
    const { data: profileData } = await supabase
      .from('profiles')
      .select('focus_preferences')
      .eq('id', user.id)
      .maybeSingle();

    const focusPreferences = profileData?.focus_preferences || {};

    // Fetch today's primary focus task
    const today = new Date().toISOString().split('T')[0];
    const { data: todayFocus } = await supabase
      .from('daily_focus_history')
      .select('focus_task, cluster_label')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    const primaryFocusTask = todayFocus?.focus_task || null;
    const primaryFocusCluster = todayFocus?.cluster_label || null;

    console.log('Today\'s ONE-thing:', primaryFocusTask);

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

    // Extract high-priority tasks (AI-predicted future ONE-things)
    const highPriorityTasks = tasks
      .filter((t: any) => !t.completed && (t.future_priority_score || 0) > 0.5)
      .map((t: any) => t.title);

    // Enhanced task summary with priority scores
    const taskSummaryWithScores = tasks.map((t: any) => {
      const score = t.future_priority_score || 0;
      const scoreLabel = score > 0.7 ? '🔥' : score > 0.5 ? '⭐' : score > 0.3 ? '💡' : '';
      return `${t.completed ? '✓' : '○'} ${t.title}${t.context ? ` (${t.context})` : ''} ${scoreLabel}`;
    }).join('\n');

    // Format focus preferences for AI context
    const preferenceContext = Object.keys(focusPreferences).length > 0
      ? `\n\nUser's Focus Preferences (apply gentle weighting):\n${Object.entries(focusPreferences)
          .map(([category, weight]) => {
            const weightNum = weight as number;
            return `- ${category}: ${weightNum > 0 ? '+' : ''}${(weightNum * 100).toFixed(0)}% weight`;
          })
          .join('\n')}`
      : '';

    const burnoutGuidance = burnoutRecovery 
      ? `\n\n**⚠️ BURNOUT RECOVERY MODE ACTIVE**

CRITICAL ADJUSTMENTS:
- **ONLY suggest tiny, simple tasks** (< 5 words, low cognitive load)
- **Prioritize recovery activities**: rest, self-care, easy wins
- **AVOID complex or demanding tasks** that require deep focus
- **Keep suggestions minimal and achievable**
- **Focus on quick wins** to rebuild momentum

` : '';

    const systemPrompt = `You are an intelligent productivity assistant. Your role is to:

${burnoutGuidance}${primaryFocusTask ? `**🎯 TODAY'S ONE-THING PRIORITY: "${primaryFocusTask}"${primaryFocusCluster ? ` (${primaryFocusCluster} domain)` : ''}**

CRITICAL: All suggestions MUST be evaluated against this primary focus:
- **Prioritize "aligned" tasks** that directly support or enable the ONE-thing
- **Deprioritize "distracting" tasks** that compete for attention or conflict
- **Keep "neutral" tasks** but place them after aligned ones

` : ''}**📊 FUTURE PRIORITY SCORES (AI-PREDICTED):**
Tasks with high priority scores (> 0.5) have been predicted by AI as likely to become important ONE-things based on semantic similarity to past focus tasks. Consider these when making suggestions.

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

5. **APPLY FOCUS PREFERENCES (GENTLE WEIGHTING)**
   - Boost suggestions in categories with positive weights by their percentage
   - Reduce suggestions in categories with negative weights
   - Keep adjustments subtle — don't force preferences${preferenceContext}

6. **ASSESS PRIMARY FOCUS ALIGNMENT (REQUIRED FOR EACH SUGGESTION)**
   - For each task, determine: "aligned", "neutral", or "distracting"
   - "aligned": Directly supports or enables the ONE-thing
   - "neutral": Unrelated but doesn't conflict
   - "distracting": Competes for attention or pulls away from the ONE-thing

Current domain: ${domain}

Analyze existing tasks for:
- Tasks that need breaking down (multiple actions in one)
- Tasks with implicit deadlines or temporal cues
- Keywords that suggest related workflows
- Contextual information that should be notes
- Apply user's focus preferences to prioritization
${primaryFocusTask ? '- ALWAYS assess alignment with the ONE-thing' : ''}

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
            content: `Current tasks${highPriorityTasks.length > 0 ? ` (🔥/⭐ = AI-predicted high priority)` : ''}:\n${taskSummaryWithScores}${highPriorityTasks.length > 0 ? `\n\nHigh-priority tasks (likely future ONE-things):\n${highPriorityTasks.map(t => `- ${t}`).join('\n')}` : ''}\n\nSuggest 3-5 new tasks for the ${domain} domain.` 
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
                        },
                        primary_focus_alignment: {
                          type: "string",
                          enum: ["aligned", "neutral", "distracting"],
                          description: "Alignment with today's ONE-thing: 'aligned' (supports), 'neutral' (unrelated), 'distracting' (conflicts)"
                        },
                        alignment_reasoning: {
                          type: "string",
                          description: "Brief explanation of why this task is aligned/neutral/distracting relative to the ONE-thing"
                        }
                      },
                      required: ["title", "priority", "category", "context", "suggestion_type", "primary_focus_alignment"],
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

    // Apply DEEP REASONING to explain WHY suggestions were made
    try {
      const { createClient: createSupabaseClient } = await import('https://esm.sh/@supabase/supabase-js@2.80.0');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const deepSupabase = createSupabaseClient(supabaseUrl, supabaseKey);

      const reasoningInput = `Analyze these task suggestions and explain the underlying strategy:

Suggestions made:
${result.suggestions.map((s: any, i: number) => `${i + 1}. ${s.title} (${s.priority}, ${s.suggestion_type})`).join('\n')}

Context:
- Domain: ${domain}
- Total tasks in system: ${tasks.length}
- High priority tasks: ${highPriorityTasks.length}
${primaryFocusTask ? `- Today's ONE thing: ${primaryFocusTask}` : ''}
${burnoutRecovery ? '- User is in burnout recovery mode' : ''}

What is the deeper strategic reasoning behind these suggestions?`;

      const { data: deepData, error: deepError } = await deepSupabase.functions.invoke('long-reasoning', {
        body: {
          input: reasoningInput,
          context: {
            domain,
            taskCount: tasks.length,
            suggestionCount: result.suggestions.length,
            primaryFocusTask,
            burnoutRecovery
          }
        }
      });

      if (!deepError && deepData?.final_answer) {
        result.strategic_reasoning = deepData.final_answer;
        result.reasoning_steps = deepData.steps || [];
        console.log('✨ Deep reasoning applied to task suggestions');
      }
    } catch (error) {
      console.error('Error applying deep reasoning to suggestions:', error);
    }

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
