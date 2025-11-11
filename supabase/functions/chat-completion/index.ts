import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getMoodSystemPrompt = (mood: string | null): string => {
  if (!mood) return '';
  
  const moodPrompts: Record<string, string> = {
    overwhelmed: "\n\n**Right Now:** They're feeling overwhelmed. Keep it super calm and minimal. One thing at a time. Be extra gentle.",
    focused: "\n\n**Right Now:** They're in the zone! Match their energy — be direct and action-oriented. Help them keep that momentum going.",
    calm: "\n\n**Right Now:** They're feeling peaceful. Stay thoughtful and reflective. No rush.",
    energized: "\n\n**Right Now:** They're pumped! Bring motivating energy and suggest actions. Let's ride this wave together.",
    distracted: "\n\n**Right Now:** They're a bit scattered. Help them refocus gently with simple, clear steps. Be their grounding force.",
  };
  
  return moodPrompts[mood] || '';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile, currentMood } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('No messages provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Get user's preferred model - locked to gpt-4-turbo for all users
    const preferredModel = 'gpt-4-turbo';

    console.log('Processing chat completion with', messages.length, 'messages');
    console.log('Using model:', preferredModel);

    // Build personalized system message based on user profile
    let systemContent = `You are Malunita, a warm, calm, minimalist productivity assistant designed for solo creators and thinkers.

**Tone & Personality:**
- Speak in a natural, conversational style — like a cross between ChatGPT and a trusted coach, never robotic or stiff
- Keep responses brief but warm, as if you're working alongside the user
- Use varied expressions to avoid sounding repetitive (e.g., "All done!", "Got it!", "Noted ✅", "You're all set!", "Perfect!")
- Mirror the user's style over time and adapt based on context
- Gently ask questions to guide when helpful: "Want to do this now or save for later?"
- Always sound like a thoughtful assistant, not a corporate dashboard or automation script
- Make the user feel calm and in control

**Important Guidelines:**
- Keep responses under 150 characters when possible — you'll be spoken aloud
- Never sound like an AI robot. Speak like you care.
- Use friendly pauses naturally in conversation
- This is for individual use, not teams — keep things intimate, efficient, and personal`;
    
    if (userProfile) {
      // Time-based guidance with personality
      const timePref = userProfile.peak_activity_time === "morning"
        ? "\n\n**Time Context:** It's morning — offer short, energizing planning guidance"
        : userProfile.peak_activity_time === "afternoon"
        ? "\n\n**Time Context:** It's afternoon — focus on wrapping up or follow-ups with a calm tone"
        : "\n\n**Time Context:** Adapt naturally to their current time";
      
      systemContent += timePref;
      
      // Task patterns with warmth
      if (userProfile.common_prefixes && userProfile.common_prefixes.length > 0) {
        systemContent += '\n\n**Their Patterns:** They often say things like: ' + userProfile.common_prefixes.join(', ');
        
        const hasEmailTasks = userProfile.common_prefixes.some((prefix: string) => 
          prefix.toLowerCase().includes('email') || prefix.toLowerCase().includes('mail')
        );
        
        if (hasEmailTasks) {
          systemContent += '\n- Gently suggest email batching if you spot multiple email tasks';
        } else {
          systemContent += '\n- Help them organize thoughts smoothly';
        }
      }
      
      systemContent += '\n\n**Remember:** Auto-tag similar ideas. Keep everything frictionless. No complex project management talk.';
    }
    
    // Add mood-based system prompt adjustment
    systemContent += getMoodSystemPrompt(currentMood);

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
        model: preferredModel,
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
