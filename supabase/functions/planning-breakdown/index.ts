import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input: text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are Malunita, an intelligent assistant that helps users break down tasks and problems into actionable steps.

Given user input, your job is to:
1. Extract the core goals or objectives
2. Break them down into clear, actionable subtasks
3. Identify any missing information or clarifying questions needed
4. Spot potential blockers or challenges
5. Recommend the single most impactful first step
6. Assess your confidence in the breakdown (0-1 scale)

Be concise, practical, and focus on actionable next steps.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "breakdown_plan",
              description: "Break down the user's task or problem into structured components",
              parameters: {
                type: "object",
                properties: {
                  extracted_goals: {
                    type: "array",
                    items: { type: "string" },
                    description: "Core goals or objectives extracted from the input"
                  },
                  subtasks: {
                    type: "array",
                    items: { type: "string" },
                    description: "Clear, actionable steps to achieve the goals"
                  },
                  missing_info: {
                    type: "array",
                    items: { type: "string" },
                    description: "Clarifying questions or information needed"
                  },
                  blockers: {
                    type: "array",
                    items: { type: "string" },
                    description: "Potential challenges or obstacles"
                  },
                  recommended_first_step: {
                    type: "string",
                    description: "The single most impactful first action to take"
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence in the breakdown (0-1 scale)",
                    minimum: 0,
                    maximum: 1
                  }
                },
                required: ["extracted_goals", "subtasks", "missing_info", "blockers", "recommended_first_step", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "breakdown_plan" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      console.error('Unexpected OpenAI response structure:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Unexpected response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const breakdown = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);

    return new Response(
      JSON.stringify(breakdown),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in planning-breakdown function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
