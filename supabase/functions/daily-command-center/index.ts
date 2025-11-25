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
  one_thing_focus?: {
    id: string;
    title: string;
    reason: string;
    relief_score: number;
  };
  yesterday_done?: string[];
  yesterday_missed?: string[];
  yesterday_summary_text?: string;
  missed_tasks_count?: number;
  carry_over_suggestions?: string[];
  optional_carry_over?: string[];
  follow_ups?: string[];
  summary_markdown?: string;
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

    // Step 2.4: Calculate today's date
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Step 2.5: Fetch today's ONE thing (primary focus) or tomorrow's plan
    let primaryFocusTask = allTasks.find(t => t.is_focus && t.focus_date === today);
    
    // If no primary focus set yet, check tomorrow_plan for suggestions
    if (!primaryFocusTask) {
      const { data: tomorrowPlan } = await supabase
        .from('tomorrow_plan')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .maybeSingle();
      
      if (tomorrowPlan && tomorrowPlan.recommended_one_thing_id) {
        // Find the recommended task in existing tasks
        primaryFocusTask = allTasks.find(t => t.id === tomorrowPlan.recommended_one_thing_id);
        console.log('Using tomorrow plan recommendation:', tomorrowPlan.recommended_one_thing);
      }
    }
    
    console.log('Primary focus task:', primaryFocusTask?.title || 'None set');

    // Step 2.6: Analyze domino effect for primary focus task
    let dominoUnlocksCount = 0;
    if (primaryFocusTask) {
      try {
        // Call domino effect analyzer
        const { data: dominoData, error: dominoError } = await supabase.functions.invoke('analyze-domino-effect', {
          body: { 
            task: {
              id: primaryFocusTask.id,
              title: primaryFocusTask.title,
              category: primaryFocusTask.category,
              keywords: primaryFocusTask.keywords,
              context: primaryFocusTask.context,
              created_at: primaryFocusTask.created_at,
            }
          }
        });

        if (!dominoError && dominoData?.unlocks_count) {
          dominoUnlocksCount = dominoData.unlocks_count;
          console.log(`Primary focus unlocks ${dominoUnlocksCount} tasks`);
        }
      } catch (error) {
        console.error('Error analyzing domino effect:', error);
      }
    }

    // Step 3: Fetch companion state and focus preferences
    const { data: profileData } = await supabase
      .from('profiles')
      .select('companion_personality_type, companion_stage, focus_preferences')
      .eq('id', user.id)
      .single();

    const companionPersonality = profileData?.companion_personality_type || 'zen';
    const companionStage = profileData?.companion_stage || 1;
    const focusPreferences = profileData?.focus_preferences || {};

    // Step 4: Yesterday Review - detect completed and missed tasks
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Fetch tasks completed yesterday
    const { data: completedYesterday } = await supabase
      .from('tasks')
      .select('title, completed_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('completed_at', yesterdayStart.toISOString())
      .lte('completed_at', yesterdayEnd.toISOString());

    const yesterdayDone = completedYesterday?.map(t => t.title) || [];

    // Fetch tasks created yesterday but not completed yet
    const { data: createdYesterday } = await supabase
      .from('tasks')
      .select('id, title, category, created_at')
      .eq('user_id', user.id)
      .eq('completed', false)
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString());

    const yesterdayMissed = createdYesterday?.map(t => t.title) || [];

    // Suggest carry-overs only for relevant missed tasks
    const carryOverSuggestions = createdYesterday
      ?.filter(t => {
        const title = t.title.toLowerCase();
        // Exclude tasks that are clearly recurring or low priority
        const isRecurring = title.includes('daily') || title.includes('weekly');
        const isLowPriority = t.category === 'someday' || t.category === 'maybe';
        return !isRecurring && !isLowPriority;
      })
      .slice(0, 3)
      .map(t => t.title) || [];

    // Generate yesterday summary text
    const missedTasksCount = yesterdayMissed.length;
    let yesterdaySummaryText = '';
    
    if (yesterdayDone.length > 0 && missedTasksCount > 0) {
      yesterdaySummaryText = `Yesterday you completed ${yesterdayDone.length} task${yesterdayDone.length > 1 ? 's' : ''}, with ${missedTasksCount} still pending.`;
    } else if (yesterdayDone.length > 0) {
      yesterdaySummaryText = `Great work yesterday — ${yesterdayDone.length} task${yesterdayDone.length > 1 ? 's' : ''} completed!`;
    } else if (missedTasksCount > 0) {
      yesterdaySummaryText = `You have ${missedTasksCount} task${missedTasksCount > 1 ? 's' : ''} from yesterday to review.`;
    } else {
      yesterdaySummaryText = 'Fresh start today.';
    }

    const optionalCarryOver = carryOverSuggestions.length > 0 
      ? carryOverSuggestions 
      : [];

    // Step 5: Categorize tasks intelligently
    // Detect mood and tone
    const { mood, tone } = isHomeScreenMode 
      ? { mood: 'calm' as const, tone: 'direct' as const }
      : detectMood(text || '', allTasks.length + extractedTasks.length);

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

    // Quick Wins: Tasks < 5 min using heuristics
    const quickWinKeywords = ['email', 'call', 'fix', 'upload', 'send', 'reply', 'text', 'message', 'check', 'review', 'schedule', 'book'];
    const quickWins = allTasks
      .filter(t => {
        const title = t.title.toLowerCase();
        const hasKeyword = quickWinKeywords.some(kw => title.includes(kw));
        const isShort = t.title.split(' ').length <= 6;
        const notInOtherCategories = !priorityTasks.includes(t.title) && !todaysSchedule.includes(t.title);
        return notInOtherCategories && (hasKeyword || isShort);
      })
      .slice(0, 5)
      .map(t => t.title);

    // Follow-ups: Find waiting tasks or tasks not touched in 48 hours
    const followUpKeywords = ['waiting', 'follow up', 'check', 'pending', 'awaiting', 'blocked'];
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const followUpTasks = allTasks
      .filter(t => {
        const title = t.title.toLowerCase();
        const hasKeyword = followUpKeywords.some(kw => title.includes(kw));
        const notTouchedRecently = new Date(t.updated_at || t.created_at) < twoDaysAgo;
        const notInOtherCategories = !priorityTasks.includes(t.title) && 
                                      !todaysSchedule.includes(t.title) && 
                                      !quickWins.includes(t.title);
        return notInOtherCategories && (hasKeyword || notTouchedRecently);
      })
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

    // Step 6: ONE Thing Logic - Find the task that creates the biggest relief
    // Score each task based on urgency, overdue, emotional weight, dependencies, complexity
    const scoreTask = (task: any) => {
      let score = 0;
      const title = task.title.toLowerCase();
      const createdDate = new Date(task.created_at);
      const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      // Urgency (keywords)
      if (title.includes('urgent') || title.includes('asap') || title.includes('critical')) score += 30;
      
      // Overdue (created more than 3 days ago)
      if (daysSinceCreated > 3) score += 20;
      if (daysSinceCreated > 7) score += 15; // bonus for very old tasks

      // Emotional weight (blocking keywords)
      if (title.includes('blocked') || title.includes('stuck') || title.includes('waiting')) score += 25;
      
      // High-impact categories
      if (task.category === 'work' || task.category === 'primary_focus') score += 15;
      if (task.is_focus) score += 40;

      // Complexity (longer tasks likely unlock more)
      const wordCount = task.title.split(' ').length;
      if (wordCount > 5 && wordCount < 15) score += 10; // Not too simple, not too complex

      // Keywords suggesting high impact
      if (title.includes('meeting') || title.includes('presentation') || title.includes('proposal')) score += 15;
      if (title.includes('review') || title.includes('approve') || title.includes('decision')) score += 10;

      return score;
    };

    // Get top candidate for ONE thing
    const scoredTasks = allTasks
      .filter(t => !t.completed)
      .map(t => ({ task: t, score: scoreTask(t) }))
      .sort((a, b) => b.score - a.score);

    const oneThingFocus = scoredTasks.length > 0 
      ? {
          id: scoredTasks[0].task.id,
          title: scoredTasks[0].task.title,
          reason: `This task creates the biggest relief because it's ${
            scoredTasks[0].score > 60 ? 'urgent and high-impact' :
            scoredTasks[0].score > 40 ? 'important and actionable' :
            'a solid starting point'
          }.`,
          relief_score: scoredTasks[0].score
        }
      : undefined;

    // Check for upcoming priority storms (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const { data: tomorrowStorm } = await supabase
      .from('priority_storms')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', tomorrowStr)
      .gte('expected_load_score', 60)
      .maybeSingle();

    let stormWarning = '';
    if (tomorrowStorm) {
      const loadLevel = tomorrowStorm.expected_load_score >= 80 ? 'very heavy' : 'heavy';
      stormWarning = `Tomorrow may be a ${loadLevel} day — ${tomorrowStorm.task_count} tasks expected. ${tomorrowStorm.recommended_focus_task || 'Want to prepare for it?'}`;
    }

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

    // Use DEEP REASONING for executive insights
    const preferredCategories = Object.entries(focusPreferences)
      .filter(([_, weight]) => (weight as number) > 0.1)
      .map(([category]) => category);
    
    const focusPreferenceContext = preferredCategories.length > 0
      ? `User tends to focus well on: ${preferredCategories.join(', ')}`
      : '';

    // Call long-reasoning for deeper insights
    let executiveInsight = "Here is what actually matters today.";
    
    try {
      const deepReasoningInput = isHomeScreenMode
        ? `Generate a welcoming headline for the home screen given this context:
- Companion: ${companionPersonality} (stage ${companionStage})
- Priority tasks: ${priorityTasks.length}
- Today's schedule: ${todaysSchedule.length}
- Quick wins: ${quickWins.length}
- Tiny tasks: ${tinyTaskCount}
- Total open tasks: ${allTasks.length}
${focusPreferenceContext ? `\n- ${focusPreferenceContext}` : ''}

Generate ONE welcoming headline that is clean, direct, and motivating.`
        : `Analyze the user's day and generate an executive insight:
User's input: "${text}"
User's mood: ${mood}
Companion: ${companionPersonality} (stage ${companionStage})
Task summary:
- Priority: ${priorityTasks.length}
- Schedule: ${todaysSchedule.length}
- Quick wins: ${quickWins.length}
- Tiny tasks: ${tinyTaskCount}
- Total: ${allTasks.length}
${focusPreferenceContext ? `\n${focusPreferenceContext}` : ''}

What is the ONE most important insight for the user today?`;

      const { data: deepData, error: deepError } = await supabase.functions.invoke('long-reasoning', {
        body: {
          input: deepReasoningInput,
          context: {
            mood,
            companionPersonality,
            companionStage,
            taskCounts: {
              priority: priorityTasks.length,
              schedule: todaysSchedule.length,
              quickWins: quickWins.length,
              tiny: tinyTaskCount,
              total: allTasks.length
            },
            isHomeScreenMode
          }
        }
      });

      if (!deepError && deepData?.final_answer) {
        executiveInsight = deepData.final_answer.trim();
        console.log('✨ Deep reasoning applied to executive insight');
      } else {
        console.warn('Deep reasoning failed, using fallback');
      }
    } catch (error) {
      console.error('Error calling long-reasoning:', error);
      // Fallback to simple insight
    }

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
      
      // Add domino effect information
      if (dominoUnlocksCount > 0) {
        const unlocksText = dominoUnlocksCount === 1 
          ? 'Completing this will unlock 1 related task.'
          : `Completing this will unlock ${dominoUnlocksCount} related tasks.`;
        oneThingReasoning += ` ${unlocksText}`;
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

      const summaryMarkdown = `
${yesterdayDone.length > 0 ? `✅ Yesterday: ${yesterdayDone.length} task${yesterdayDone.length > 1 ? 's' : ''} completed.` : ''}
${oneThingFocus ? `🎯 Focus: ${oneThingFocus.title}` : ''}
${priorityTasks.length > 0 ? `📌 ${priorityTasks.length} priority items.` : ''}
${quickWins.length > 0 ? `⚡ ${quickWins.length} quick wins ready.` : ''}
      `.trim();

      return new Response(
        JSON.stringify({
          headline: executiveInsight,
          summary_markdown: summaryMarkdown || `You have ${allTasks.length} open tasks. ${priorityTasks.length > 0 ? `${priorityTasks.length} priority items need attention.` : ''}`,
          quick_wins: quickWinsData,
          focus_message: oneThingFocus ? oneThingFocus.title : (priorityTasks.length > 0 ? `Focus on: ${priorityTasks[0]}` : "Clear slate — ready to plan your day?"),
          one_thing_summary: oneThingSummary,
          one_thing_reasoning: oneThingReasoning,
          storm_warning: stormWarning || null,
          one_thing_focus: oneThingFocus,
          follow_ups: followUpTasks.slice(0, 3),
          yesterday_done: yesterdayDone.slice(0, 3),
          yesterday_summary_text: yesterdaySummaryText,
          missed_tasks_count: missedTasksCount,
          carry_over_suggestions: carryOverSuggestions,
          optional_carry_over: optionalCarryOver
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Generate narrative summary in markdown
      const summaryMarkdown = `
## Your Day at a Glance

${yesterdayDone.length > 0 ? `✅ **Yesterday, you completed ${yesterdayDone.length} task${yesterdayDone.length > 1 ? 's' : ''}.**` : ''}
${yesterdayMissed.length > 0 ? `⏭️ You have ${yesterdayMissed.length} task${yesterdayMissed.length > 1 ? 's' : ''} from yesterday still pending.` : ''}

${oneThingFocus ? `🎯 **Your ONE Thing Today**: ${oneThingFocus.title}\n   ${oneThingFocus.reason}` : ''}

${priorityTasks.length > 0 ? `📌 **Priority Tasks**: ${priorityTasks.length} items need your attention.` : ''}
${todaysSchedule.length > 0 ? `📅 **Today's Schedule**: ${todaysSchedule.length} time-sensitive items.` : ''}
${quickWins.length > 0 ? `⚡ **Quick Wins**: ${quickWins.length} small tasks you can knock out fast.` : ''}
${followUpTasks.length > 0 ? `🔔 **Follow-ups**: ${followUpTasks.length} items need your attention or are awaiting response.` : ''}

${stormWarning ? `⚠️ ${stormWarning}` : ''}

${carryOverSuggestions.length > 0 ? `💡 **Consider carrying over**: ${carryOverSuggestions.join(', ')}` : ''}

You've got this. Start with one thing, and the rest will follow.
      `.trim();

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
        one_thing_focus: oneThingFocus,
        yesterday_done: yesterdayDone,
        yesterday_missed: yesterdayMissed,
        yesterday_summary_text: yesterdaySummaryText,
        missed_tasks_count: missedTasksCount,
        carry_over_suggestions: carryOverSuggestions,
        optional_carry_over: optionalCarryOver,
        follow_ups: followUpTasks,
        summary_markdown: summaryMarkdown,
      };

      return new Response(
        JSON.stringify({ 
          summary, 
          extractedTasks,
          one_thing_summary: oneThingSummary,
          one_thing_reasoning: oneThingReasoning,
          storm_warning: stormWarning || null
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
