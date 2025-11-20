import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  category?: string;
  created_at: string;
  is_focus?: boolean;
  is_time_based?: boolean;
  reminder_time?: string;
  completed: boolean;
}

interface DailySummary {
  priority: string[];
  dueToday: string[];
  thisWeek: string[];
  smallTasks: string[];
  tinyTaskCount: number;
  staleFromYesterday: string[];
  insights: string[];
  tone: 'calm' | 'direct' | 'urgent';
}

const detectTone = (text: string, taskCount: number): 'calm' | 'direct' | 'urgent' => {
  const overwhelmedWords = ['overwhelmed', 'stressed', 'too much', 'can\'t', 'impossible', 'drowning'];
  const urgentWords = ['asap', 'urgent', 'now', 'immediately', 'deadline', 'today', 'due'];
  
  const lowerText = text.toLowerCase();
  
  if (overwhelmedWords.some(word => lowerText.includes(word)) || taskCount > 15) {
    return 'calm';
  }
  if (urgentWords.some(word => lowerText.includes(word))) {
    return 'urgent';
  }
  return 'direct';
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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !lovableApiKey) {
      throw new Error('Missing configuration');
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

    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid input text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing Daily Command Center for user:', user.id);

    // Step 1: Extract tasks from the text using Thought Engine 2.0
    const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-tasks', {
      body: { text, userId: user.id }
    });

    if (extractError) {
      console.error('Extract tasks error:', extractError);
      throw new Error('Failed to extract tasks');
    }

    const extractedTasks = extractData?.tasks || [];
    console.log('Extracted tasks:', extractedTasks.length);

    // Step 2: Fetch existing open tasks
    const { data: existingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
      throw new Error('Failed to fetch tasks');
    }

    const allTasks = existingTasks || [];
    console.log('Existing open tasks:', allTasks.length);

    // Step 3: Categorize tasks intelligently
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thisWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Detect tone
    const tone = detectTone(text, allTasks.length + extractedTasks.length);

    // Priority tasks: focus tasks or high-urgency
    const priority = allTasks
      .filter(t => t.is_focus || (t.is_time_based && t.reminder_time))
      .slice(0, 3)
      .map(t => t.title);

    // Due today: tasks with today's date or immediate reminders
    const dueToday = allTasks
      .filter(t => {
        if (t.reminder_time) {
          const reminderDate = new Date(t.reminder_time).toISOString().split('T')[0];
          return reminderDate === today;
        }
        return false;
      })
      .map(t => t.title);

    // This week: recently created or marked for this week
    const thisWeek = allTasks
      .filter(t => {
        if (!t.is_focus && !priority.includes(t.title) && !dueToday.includes(t.title)) {
          const createdDate = new Date(t.created_at).toISOString().split('T')[0];
          return createdDate >= today && createdDate <= thisWeekEnd;
        }
        return false;
      })
      .slice(0, 5)
      .map(t => t.title);

    // Small tasks: simple, non-time-based tasks
    const smallTasks = allTasks
      .filter(t => !t.is_time_based && !priority.includes(t.title) && !dueToday.includes(t.title))
      .slice(0, 5)
      .map(t => t.title);

    // Tiny tasks: check extracted tasks for tiny ones
    let tinyTaskCount = 0;
    if (extractedTasks.length > 0) {
      const tinyWords = ['buy', 'call', 'email', 'text', 'check', 'send', 'reply', 'look up', 'find'];
      tinyTaskCount = extractedTasks.filter((t: any) => {
        const title = t.title.toLowerCase();
        return tinyWords.some(word => title.includes(word)) && title.split(' ').length <= 5;
      }).length;
    }

    // Stale from yesterday
    const staleFromYesterday = allTasks
      .filter(t => {
        const createdDate = new Date(t.created_at).toISOString().split('T')[0];
        return createdDate <= yesterday && !t.completed;
      })
      .slice(0, 3)
      .map(t => t.title);

    // Generate insights using AI
    const insightsPrompt = `You are analyzing a user's daily task landscape. 

User's input: "${text}"

Existing tasks:
- Priority: ${priority.length}
- Due today: ${dueToday.length}
- This week: ${thisWeek.length}
- Small tasks: ${smallTasks.length}
- Tiny tasks extracted: ${tinyTaskCount}
- Stale from yesterday: ${staleFromYesterday.length}

Total open tasks: ${allTasks.length}
Tone detected: ${tone}

Generate 2-3 brief, actionable insights as bullet points. Examples:
- "You have 12 tiny tasks ready for a Fiesta session"
- "Your biggest priority today is [task]"
- "Consider archiving 3 stale tasks from yesterday"
- "Focus on closing out time-sensitive items first"

Keep insights specific, motivating, and under 15 words each. Return ONLY the bullet points, no extra text.`;

    const insightsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a productivity insights generator. Return only bullet points.' },
          { role: 'user', content: insightsPrompt }
        ],
      }),
    });

    if (!insightsResponse.ok) {
      console.error('Insights generation failed:', await insightsResponse.text());
      throw new Error('Failed to generate insights');
    }

    const insightsData = await insightsResponse.json();
    const insightsText = insightsData.choices?.[0]?.message?.content || '';
    const insights = insightsText
      .split('\n')
      .filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map((line: string) => line.replace(/^[-•]\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    const summary: DailySummary = {
      priority: priority.length > 0 ? priority : ['No priority tasks set'],
      dueToday: dueToday.length > 0 ? dueToday : ['Nothing due today'],
      thisWeek: thisWeek.length > 0 ? thisWeek : ['No tasks scheduled this week'],
      smallTasks: smallTasks.length > 0 ? smallTasks : ['No small tasks'],
      tinyTaskCount,
      staleFromYesterday: staleFromYesterday.length > 0 ? staleFromYesterday : [],
      insights: insights.length > 0 ? insights : ['Ready to capture your day'],
      tone,
    };

    return new Response(
      JSON.stringify({ summary, extractedTasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Daily Command Center error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
