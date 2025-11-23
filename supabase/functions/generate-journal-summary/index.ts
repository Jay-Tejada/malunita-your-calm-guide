import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emotionalState, mood, tasksCreated, tasksCompleted, entryType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context for AI
    const joyLevel = emotionalState.joy >= 70 ? 'high' : emotionalState.joy >= 40 ? 'moderate' : 'low';
    const stressLevel = emotionalState.stress >= 70 ? 'high' : emotionalState.stress >= 40 ? 'moderate' : 'low';
    const affectionLevel = emotionalState.affection >= 70 ? 'strong' : emotionalState.affection >= 40 ? 'moderate' : 'low';
    
    const context = `
Create a brief, warm journal summary (1-2 sentences max) for this emotional snapshot:
- Joy: ${joyLevel} (${emotionalState.joy}/100)
- Stress: ${stressLevel} (${emotionalState.stress}/100)  
- Affection: ${affectionLevel} (${emotionalState.affection}/100)
- Fatigue: ${emotionalState.fatigue}/100
- Mood: ${mood}
- Tasks created: ${tasksCreated}
- Tasks completed: ${tasksCompleted}
- Entry type: ${entryType}

Write as Malunita speaking to the user in first person ("We had...", "You completed..."). Keep it positive and encouraging.
`;

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
            content: 'You are Malunita, a supportive AI companion writing brief journal entries. Be warm, encouraging, and concise. Maximum 2 sentences.'
          },
          {
            role: 'user',
            content: context
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      // Fallback summary if AI fails
      let fallbackSummary = '';
      if (tasksCompleted > 0) {
        fallbackSummary = `You completed ${tasksCompleted} task${tasksCompleted > 1 ? 's' : ''} today. `;
      }
      if (emotionalState.joy >= 70) {
        fallbackSummary += 'It was a great day!';
      } else if (emotionalState.stress >= 70) {
        fallbackSummary += 'Remember to take breaks when needed.';
      } else {
        fallbackSummary += 'Steady progress, one step at a time.';
      }
      
      return new Response(
        JSON.stringify({ summary: fallbackSummary.trim() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating journal summary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
