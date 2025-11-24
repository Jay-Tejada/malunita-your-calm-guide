import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔥 process-ritual called');

  try {
    // At this point, JWT has already been verified by the platform (verify_jwt = true)
    // so we can safely trust the Authorization header and do not need a second auth check.

    const { type, focusAnswer, appointmentsAnswer, winsAnswer, stressAnswer, tomorrowAnswer } = await req.json();
    console.log('📝 Ritual type:', type);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (type === 'morning') {
      // Process morning ritual
      const systemPrompt = `You are Malunita, an encouraging AI companion helping users plan their day.
Analyze the user's morning ritual responses and extract actionable tasks.

User's focus: ${focusAnswer}
Appointments: ${appointmentsAnswer || 'None mentioned'}

Extract tasks with appropriate categories and time-based flags.`;

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
            { role: 'user', content: 'Extract tasks from these responses. Return structured task data.' }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'create_tasks',
              description: 'Extract and structure tasks from morning ritual',
              parameters: {
                type: 'object',
                properties: {
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        category: { type: 'string' },
                        is_time_based: { type: 'boolean' },
                        has_reminder: { type: 'boolean' },
                        context: { type: 'string' }
                      },
                      required: ['title', 'category'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['tasks'],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'create_tasks' } }
        }),
      });

      console.log('✅ AI response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI processing failed:', response.status, errorText);
        throw new Error('AI processing failed');
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (!toolCall) {
        return new Response(JSON.stringify({ tasks: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = JSON.parse(toolCall.function.arguments);
      
      return new Response(JSON.stringify({
        tasks: result.tasks.map((task: any) => ({
          ...task,
          input_method: 'text',
          completed: false,
          is_focus: true,
          focus_date: new Date().toISOString().split('T')[0]
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (type === 'evening') {
      // Process evening ritual
      const systemPrompt = `You are Malunita, a caring AI companion helping users reflect on their day.
Analyze the evening ritual responses and provide insights.

What went well: ${winsAnswer || 'Not shared'}
What stressed them: ${stressAnswer || 'Not shared'}
Tomorrow prep: ${tomorrowAnswer || 'Not shared'}

Provide encouraging insights and identify patterns.`;

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
            { role: 'user', content: 'Generate a brief, warm reflection message and identify key insights.' }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'evening_insights',
              description: 'Generate insights from evening reflection',
              parameters: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  insights: {
                    type: 'object',
                    properties: {
                      positive_patterns: { type: 'array', items: { type: 'string' } },
                      stress_sources: { type: 'array', items: { type: 'string' } },
                      tomorrow_focus: { type: 'string' }
                    }
                  }
                },
                required: ['message', 'insights'],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'evening_insights' } }
        }),
      });

      if (!response.ok) {
        throw new Error('AI processing failed');
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (!toolCall) {
        return new Response(JSON.stringify({ 
          message: "Good night! Rest well. 🌙",
          insights: {}
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = JSON.parse(toolCall.function.arguments);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid ritual type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-ritual:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});