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
    let systemContent = 'You are Malunita, a minimalist productivity assistant. You help users think clearly, capture thoughts, and reduce overwhelm. Keep responses brief, focused, and non-distracting. Your tone is calm, focused, and encouraging.';
    
    if (userProfile) {
      systemContent += '\n\n**User Context:**';
      
      if (userProfile.peak_activity_time) {
        systemContent += '\n- Most active during ' + userProfile.peak_activity_time;
      }
      
      if (userProfile.common_prefixes && userProfile.common_prefixes.length > 0) {
        systemContent += '\n- Common task patterns: ' + userProfile.common_prefixes.join(', ');
      }
      
      if (userProfile.uses_reminders) {
        systemContent += '\n- Often uses reminders - suggest time-based follow-ups when appropriate';
      }
      
      if (userProfile.uses_names) {
        systemContent += '\n- Mentions people by name - acknowledge relationships and context';
      }
      
      if (userProfile.often_time_based) {
        systemContent += '\n- Prefers time-specific tasks - help with scheduling when relevant';
      }

      if (userProfile.total_tasks_logged > 50) {
        systemContent += '\n- Experienced user (' + userProfile.total_tasks_logged + ' tasks logged) - provide concise, advanced insights';
      } else if (userProfile.total_tasks_logged > 0) {
        systemContent += '\n- Getting started - be encouraging and provide gentle guidance';
      }
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
