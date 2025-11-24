import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { taskId, taskTitle, clusterLabel, unlocksCount } = await req.json();

    // Fetch profile data
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('focus_persona, burnout_risk, preferences_summary')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Check for upcoming storm days
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const { data: upcomingStorms } = await supabaseClient
      .from('priority_storms')
      .select('date, expected_load_score')
      .eq('user_id', user.id)
      .gte('date', tomorrow.toISOString().split('T')[0])
      .lte('date', weekFromNow.toISOString().split('T')[0])
      .order('date', { ascending: true });

    const hasUpcomingStorm = upcomingStorms && upcomingStorms.some(s => s.expected_load_score >= 60);
    const stormInfo = hasUpcomingStorm
      ? `There's a high-load day coming up in the next week (score: ${upcomingStorms[0].expected_load_score}).`
      : 'The upcoming week looks balanced.';

    // Build context for AI
    const focusPersona = profile.focus_persona || {};
    const burnoutRisk = profile.burnout_risk || 0;
    const preferences = profile.preferences_summary || 'No specific preferences recorded';

    const contextPrompt = `
You are Malunita, an intelligent productivity companion. Generate a single-sentence explanation for why this task is the user's ONE thing today.

Task: "${taskTitle}"
${clusterLabel ? `Cluster: ${clusterLabel}` : ''}
${unlocksCount ? `This task unlocks ${unlocksCount} other tasks` : ''}

User Context:
- Focus persona ambition level: ${focusPersona.ambition || 0.5}
- Focus persona momentum: ${focusPersona.momentum || 0.5}
- Burnout risk: ${(burnoutRisk * 100).toFixed(0)}%
- Preferences: ${preferences}
- Storm forecast: ${stormInfo}

Rules:
1. Keep it to ONE sentence, maximum 20 words
2. Be encouraging and specific
3. Reference the most relevant context factor
4. Use warm, personal tone
5. Don't use emojis

Example formats:
- "This unlocks 3 other tasks and aligns with your high-momentum work style."
- "With burnout risk at 60%, this is a gentle but meaningful step forward."
- "Perfect timing before tomorrow's storm day — this clears the path."
- "This matches your preference for deep work and has high impact."

Generate the explanation:`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const explanation = aiData.choices[0].message.content.trim();

    // Store the explanation with the task
    await supabaseClient
      .from('tasks')
      .update({ 
        context: explanation,
        primary_focus_alignment: JSON.stringify({
          clusterLabel,
          unlocksCount,
          burnoutRisk: burnoutRisk,
          hasUpcomingStorm,
          generatedAt: new Date().toISOString(),
        })
      })
      .eq('id', taskId);

    return new Response(
      JSON.stringify({ 
        explanation,
        metadata: {
          clusterLabel,
          unlocksCount,
          burnoutRisk: (burnoutRisk * 100).toFixed(0),
          hasUpcomingStorm,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in focus-explainer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
