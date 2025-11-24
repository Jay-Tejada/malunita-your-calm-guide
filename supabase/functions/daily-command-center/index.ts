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
  priorityTasks: string[];
  todaysSchedule: string[];
  quickWins: string[];
  tinyTaskCount: number;
  contextNotes: string[];
  executiveInsight: string;
  tone: 'calm' | 'direct' | 'urgent';
  mood: 'calm' | 'focused' | 'rushed' | 'overwhelmed';
}

const detectMood = (text: string, taskCount: number): { mood: 'calm' | 'focused' | 'rushed' | 'overwhelmed', tone: 'calm' | 'direct' | 'urgent' } => {
  const overwhelmedWords = ['overwhelmed', 'stressed', 'too much', 'can\'t', 'impossible', 'drowning', 'swamped', 'buried'];
  const rushedWords = ['rushed', 'hurry', 'quick', 'fast', 'late', 'behind', 'catch up'];
  const calmWords = ['steady', 'relaxed', 'clear', 'ready', 'good', 'organized'];
  const focusedWords = ['focus', 'prioritize', 'important', 'critical', 'key', 'main'];
  const urgentWords = ['asap', 'urgent', 'now', 'immediately', 'deadline', 'today', 'due'];
  
  const lowerText = text.toLowerCase();
  
  let mood: 'calm' | 'focused' | 'rushed' | 'overwhelmed' = 'calm';
  let tone: 'calm' | 'direct' | 'urgent' = 'direct';
  
  if (overwhelmedWords.some(word => lowerText.includes(word)) || taskCount > 15) {
    mood = 'overwhelmed';
    tone = 'calm';
  } else if (rushedWords.some(word => lowerText.includes(word))) {
    mood = 'rushed';
    tone = 'urgent';
  } else if (focusedWords.some(word => lowerText.includes(word))) {
    mood = 'focused';
    tone = 'direct';
  } else if (calmWords.some(word => lowerText.includes(word))) {
    mood = 'calm';
    tone = 'calm';
  } else if (urgentWords.some(word => lowerText.includes(word))) {
    mood = 'rushed';
    tone = 'urgent';
  }
  
  return { mood, tone };
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

    const { text, mode } = await req.json();

    // Home screen mode: no text input required
    const isHomeScreenMode = mode === 'home_screen';
    let extractedTasks: any[] = [];

    if (!isHomeScreenMode) {
      // Regular mode: requires text input
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid input text' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Processing Daily Command Center for user:', user.id);

      // Step 1: Extract tasks from the text using Thought Engine 2.0
      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-tasks', {
        body: { text, userId: user.id },
        headers: { Authorization: authHeader }
      });

      if (extractError) {
        console.error('Extract tasks error:', extractError);
        throw new Error('Failed to extract tasks');
      }

      extractedTasks = extractData?.tasks || [];
      console.log('Extracted tasks:', extractedTasks.length);
    } else {
      console.log('Processing Daily Command Center (home screen mode) for user:', user.id);
    }

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

    // Step 2.5: Fetch today's ONE thing (primary focus)
    const primaryFocusTask = allTasks.find(t => t.is_focus && t.focus_date === today);
    console.log('Primary focus task:', primaryFocusTask?.title || 'None set');

    // Step 3: Fetch companion state and focus preferences
    const { data: profileData } = await supabase
      .from('profiles')
      .select('companion_personality_type, companion_stage, focus_preferences')
      .eq('id', user.id)
      .single();

    const companionPersonality = profileData?.companion_personality_type || 'zen';
    const companionStage = profileData?.companion_stage || 1;
    const focusPreferences = profileData?.focus_preferences || {};

    // Step 4: Categorize tasks intelligently
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Detect mood and tone
    const { mood, tone } = isHomeScreenMode 
      ? { mood: 'calm' as const, tone: 'direct' as const }
      : detectMood(text, allTasks.length + extractedTasks.length);

    // Priority Tasks: High-impact, focus items, or urgent
    const priorityTasks = allTasks
      .filter(t => t.is_focus || t.category === 'urgent' || t.category === 'primary_focus')
      .slice(0, 5)
      .map(t => t.title);

    // Today's Schedule: Time-sensitive or deadline-linked items
    const todaysSchedule = allTasks
      .filter(t => {
        if (t.reminder_time) {
          const reminderDate = new Date(t.reminder_time).toISOString().split('T')[0];
          return reminderDate === today;
        }
        return t.is_time_based && !priorityTasks.includes(t.title);
      })
      .slice(0, 5)
      .map(t => t.title);

    // Quick Wins: Small, non-time-based tasks
    const quickWins = allTasks
      .filter(t => 
        !t.is_time_based && 
        !priorityTasks.includes(t.title) && 
        !todaysSchedule.includes(t.title) &&
        t.title.split(' ').length <= 8
      )
      .slice(0, 5)
      .map(t => t.title);

    // Tiny tasks: check both extracted and existing tasks
    let tinyTaskCount = 0;
    const tinyWords = ['buy', 'call', 'email', 'text', 'check', 'send', 'reply', 'look up', 'find', 'book', 'schedule'];
    
    // Count from extracted tasks
    if (extractedTasks.length > 0) {
      tinyTaskCount += extractedTasks.filter((t: any) => {
        const title = t.title.toLowerCase();
        return tinyWords.some(word => title.includes(word)) && title.split(' ').length <= 5;
      }).length;
    }
    
    // Count from existing tasks not already categorized
    tinyTaskCount += allTasks.filter(t => {
      if (priorityTasks.includes(t.title) || todaysSchedule.includes(t.title) || quickWins.includes(t.title)) {
        return false;
      }
      const title = t.title.toLowerCase();
      return tinyWords.some(word => title.includes(word)) && title.split(' ').length <= 5;
    }).length;

    // Extract context notes (non-actionable information from user's text)
    let contextNotes: string[] = [];
    
    if (!isHomeScreenMode && text) {
      const contextPrompt = `Extract any non-actionable contextual notes from this text. These are pieces of information that don't need to be turned into tasks but are important context.

User's input: "${text}"

Examples of context notes:
- "Working from home today"
- "Client meeting went well"
- "Feeling overwhelmed with deadlines"
- "Team is on vacation this week"

Return ONLY bullet points of context notes found, or return "No context notes" if there are none. Keep each note under 10 words.`;

      const contextResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You extract contextual notes from user input.' },
            { role: 'user', content: contextPrompt }
          ],
        }),
      });

      const contextData = await contextResponse.json();
      const contextText = contextData.choices?.[0]?.message?.content || 'No context notes';
      contextNotes = contextText === 'No context notes' ? [] : contextText
        .split('\n')
        .filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map((line: string) => line.replace(/^[-•]\s*/, '').trim())
        .filter((line: string) => line.length > 0);
    }

    // Generate Executive Insight with mood-aware, companion-aware tone
    const preferredCategories = Object.entries(focusPreferences)
      .filter(([_, weight]) => (weight as number) > 0.1)
      .map(([category]) => category);
    
    const focusPreferenceContext = preferredCategories.length > 0
      ? `\n\nUser tends to focus well on: ${preferredCategories.join(', ')}`
      : '';

    const insightPrompt = isHomeScreenMode
      ? `You are an Executive Assistant with these attributes: clean, direct, minimalist, slightly dry humor, companion-aware.

Companion personality: ${companionPersonality}
Companion stage: ${companionStage}${focusPreferenceContext}

Task summary:
- Priority tasks: ${priorityTasks.length}
- Today's schedule: ${todaysSchedule.length}
- Quick wins: ${quickWins.length}
- Tiny tasks: ${tinyTaskCount}
- Total open tasks: ${allTasks.length}

Generate ONE welcoming headline for the home screen. Keep it clean, direct, and motivating.

Tone rules:
- Clean, direct, minimalist
- Welcoming but not overly enthusiastic
- Should feel like: "Ready to make today count?"

Companion context (use subtly if natural):
- Personality: ${companionPersonality} (zen=calm/grounded, spark=energetic/quick, cosmo=thoughtful/deep)
- Stage: ${companionStage} (1=seedling, 2=sprout, 3=bloom, 4=radiant)

Return ONLY the headline. No extra text.`
      : `You are an Executive Assistant with these attributes: clean, direct, minimalist, slightly dry humor, mood-aware, companion-aware.

User's input: "${text}"
User's mood: ${mood}
Companion personality: ${companionPersonality}
Companion stage: ${companionStage}${focusPreferenceContext}

Task summary:
- Priority tasks: ${priorityTasks.length}
- Today's schedule: ${todaysSchedule.length}
- Quick wins: ${quickWins.length}
- Tiny tasks: ${tinyTaskCount}
- Total open tasks: ${allTasks.length}

Generate ONE direct sentence shaped by the user's mood. Optionally include a subtle companion reference ONLY if it fits naturally.

Tone rules:
- Clean, direct, minimalist
- Use dry humor ONLY when natural (e.g., "Let's not let this one become a roommate.")
- No corporate tone. No forced enthusiasm.
- Should feel like: "Here's what actually matters today. Let's move smart."

Mood-based adjustments:
- ${mood === 'overwhelmed' ? 'Calming, grounded. Focus on one thing at a time.' : ''}
- ${mood === 'rushed' ? 'Direct, efficient. Cut to what matters now.' : ''}
- ${mood === 'focused' ? 'Strategic, sharp. Reinforce their momentum.' : ''}
- ${mood === 'calm' ? 'Steady, clear. Match their composed energy.' : ''}

Companion context (use subtly if natural):
- Personality: ${companionPersonality} (zen=calm/grounded, spark=energetic/quick, cosmo=thoughtful/deep)
- Stage: ${companionStage} (1=seedling, 2=sprout, 3=bloom, 4=radiant)
- Example subtle reference: "Your companion is calm this morning — match that pace."

Return ONLY the insight sentence. No extra text.`;

    const insightResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a productivity insight generator. Return only the insight.' },
          { role: 'user', content: insightPrompt }
        ],
      }),
    });

    if (!insightResponse.ok) {
      console.error('Insight generation failed:', await insightResponse.text());
      throw new Error('Failed to generate insight');
    }

    const insightData = await insightResponse.json();
    const executiveInsight = insightData.choices?.[0]?.message?.content?.trim() || "Here is what actually matters today.";

    // Generate ONE-thing summary and reasoning
    let oneThingSummary = '';
    let oneThingReasoning = '';

    if (primaryFocusTask) {
      oneThingSummary = `Today's primary focus is ${primaryFocusTask.title}.`;
      
      // Generate reasoning for the chosen ONE thing
      const reasoningPrompt = `Explain in ONE short sentence (max 12 words) why this task is a good primary focus:
Task: "${primaryFocusTask.title}"
Category: ${primaryFocusTask.category || 'general'}

Reasoning should focus on impact (e.g., "reduces blockers", "increases momentum", "unlocks team progress", "clears critical path").
Return ONLY the reasoning sentence starting with "Chosen because...". No extra text.`;

      const reasoningResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You provide concise task reasoning.' },
            { role: 'user', content: reasoningPrompt }
          ],
        }),
      });

      if (reasoningResponse.ok) {
        const reasoningData = await reasoningResponse.json();
        oneThingReasoning = reasoningData.choices?.[0]?.message?.content?.trim() || 'Chosen because it moves the needle.';
      } else {
        oneThingReasoning = 'Chosen because it moves the needle.';
      }
    } else {
      // No ONE thing set - suggest a candidate
      const candidateTask = priorityTasks[0] || todaysSchedule[0] || quickWins[0];
      
      if (candidateTask) {
        oneThingSummary = `If you need direction today, consider focusing on ${candidateTask}.`;
        oneThingReasoning = 'Setting one primary focus helps maintain clarity and momentum.';
      } else {
        oneThingSummary = 'No primary focus set yet.';
        oneThingReasoning = 'Consider choosing one key task to anchor your day.';
      }
    }

    // Format response based on mode
    if (isHomeScreenMode) {
      // Home screen expects: headline, summary_markdown, quick_wins, focus_message
      const quickWinsData = quickWins.slice(0, 3).map((title, index) => ({
        id: `quick-win-${index}`,
        title
      }));

      return new Response(
        JSON.stringify({
          headline: executiveInsight,
          summary_markdown: `You have ${allTasks.length} open tasks. ${priorityTasks.length > 0 ? `${priorityTasks.length} priority items need attention.` : ''}`,
          quick_wins: quickWinsData,
          focus_message: priorityTasks.length > 0 ? `Focus on: ${priorityTasks[0]}` : "Clear slate — ready to plan your day?",
          one_thing_summary: oneThingSummary,
          one_thing_reasoning: oneThingReasoning
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Regular mode: return full summary
      const summary: DailySummary = {
        priorityTasks: priorityTasks.length > 0 ? priorityTasks : [],
        todaysSchedule: todaysSchedule.length > 0 ? todaysSchedule : [],
        quickWins: quickWins.length > 0 ? quickWins : [],
        tinyTaskCount,
        contextNotes,
        executiveInsight,
        tone,
        mood,
      };

      return new Response(
        JSON.stringify({ 
          summary, 
          extractedTasks,
          one_thing_summary: oneThingSummary,
          one_thing_reasoning: oneThingReasoning
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Daily Command Center error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
