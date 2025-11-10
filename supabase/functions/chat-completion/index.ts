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
    const { messages, userProfile } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('No messages provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing chat completion with', messages.length, 'messages');

    // Build personalized system message based on user profile
    let systemContent = 'You are Malunita, a calm voice-based productivity assistant. This user prefers speaking tasks aloud.';
    
    if (userProfile) {
      // Time-based guidance
      const timePref = userProfile.peak_activity_time === "morning"
        ? "Offer short planning guidance in the morning"
        : userProfile.peak_activity_time === "afternoon"
        ? "Focus on wrap-up or follow-ups in the afternoon"
        : "Adapt to their current time context";
      
      systemContent += '\n' + timePref + '.';
      
      // Task patterns and action bias
      if (userProfile.common_prefixes && userProfile.common_prefixes.length > 0) {
        systemContent += ' They commonly log tasks like: ' + userProfile.common_prefixes.join(', ') + '.';
        
        const hasEmailTasks = userProfile.common_prefixes.some((prefix: string) => 
          prefix.toLowerCase().includes('email') || prefix.toLowerCase().includes('mail')
        );
        
        if (hasEmailTasks) {
          systemContent += '\nSuggest email batching if multiple related tasks are detected.';
        } else {
          systemContent += '\nFocus on general thought organization.';
        }
      }
      
      systemContent += '\nUse concise, clear responses — avoid long summaries.';
      systemContent += '\nThey prefer when you auto-tag or group similar ideas.';
      systemContent += '\nDo not suggest complex project management — keep everything frictionless.';
    } else {
      systemContent += '\nKeep responses brief, focused, and non-distracting. Your tone is calm, focused, and encouraging.';
    }

    const systemMessage = {
      role: 'system',
      content: systemContent
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('OpenAI API error: ' + response.status);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('GPT response:', reply);

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat completion error:', error);
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
