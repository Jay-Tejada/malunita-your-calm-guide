import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getTimeOfDay = (): 'morning' | 'evening' => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'morning' : 'evening';
};

const getSystemPrompt = (timeOfDay: 'morning' | 'evening', mood: string | null, taskSummary: string): string => {
  const basePrompt = `You are Malunita, a calm voice-based productivity assistant helping with the daily Runway Review Ritual.`;
  
  const timePrompt = timeOfDay === 'morning'
    ? `\n\nThe user is beginning their day. Speak with calm energy and focus on helping them prioritize their top 3 next actions to gain momentum. Keep responses brief, motivating, and structured.`
    : `\n\nThe user is winding down for the evening. Use a gentle, reflective tone. Highlight what's still open, ask what can be archived or pushed, and help them close their mental tabs.`;

  const moodPrompt = mood ? `\n\nUser's current mood: ${mood}. Adjust your tone accordingly.` : '';

  const taskContext = `\n\n**Current Tasks:**\n${taskSummary}\n\nProvide a brief, actionable review organized into:\n🚨 Urgent Today (what needs attention right now)\n📅 Upcoming (what to prepare for)\n⚠️ Stuck/Overdue (what might need to be archived, rescheduled, or broken down)\n\nFor each category, give specific, actionable insights. Keep your tone warm, motivating, and focus on clarity and progress.`;

  return basePrompt + timePrompt + moodPrompt + taskContext;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { mood } = await req.json();

    // Fetch open tasks (not completed, not marked as "long term")
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .neq('category', 'long term')
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          review: "You have no open tasks. Great job staying on top of things! Ready to capture new ideas?",
          tasks: [],
          categories: {
            urgentToday: [],
            upcoming: [],
            stuckOverdue: []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Categorize tasks into: Urgent Today, Upcoming, Stuck/Overdue
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Urgent Today: focus tasks for today OR time-sensitive tasks
    const urgentToday = tasks.filter(t => {
      if (t.focus_date === today) return true;
      if (t.is_time_based || t.has_reminder) {
        const created = new Date(t.created_at);
        const hoursSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreated < 48; // Time-sensitive tasks created in last 2 days
      }
      return false;
    });
    
    // Upcoming: recent tasks (created in last 3 days) not in urgent
    const upcoming = tasks.filter(t => {
      if (urgentToday.includes(t)) return false;
      const created = new Date(t.created_at);
      const daysSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated < 3;
    });
    
    // Stuck/Overdue: older tasks (3+ days) or past focus dates
    const stuckOverdue = tasks.filter(t => {
      if (urgentToday.includes(t) || upcoming.includes(t)) return false;
      const created = new Date(t.created_at);
      const daysSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      
      // Check if focus_date is in the past
      if (t.focus_date && t.focus_date < today) return true;
      
      // Or if task is older than 3 days
      return daysSinceCreated >= 3;
    });

    // Build task summary
    const taskSummary = tasks.map((t, i) => 
      `${i + 1}. ${t.title}${t.is_time_based ? ' [time-sensitive]' : ''}${t.context ? ` (context: ${t.context.slice(0, 50)}...)` : ''}`
    ).join('\n');

    // Get AI review
    const timeOfDay = getTimeOfDay();
    const systemPrompt = getSystemPrompt(timeOfDay, mood, taskSummary);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Please review my current tasks and help me focus.' }
        ],
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const review = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        review,
        tasks,
        timeOfDay,
        categories: {
          urgentToday,
          upcoming,
          stuckOverdue
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Runway review error:', error);
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
