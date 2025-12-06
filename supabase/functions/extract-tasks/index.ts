import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TEXT_LENGTH = 5000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract JWT and validate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limit
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      _user_id: user.id,
      _endpoint: 'extract-tasks',
      _max_requests: 20,
      _window_minutes: 1
    })

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, userProfile, userId, currentDate, conversationHistory = [] } = await req.json();
    
    // Get current date for time calculations
    const now = currentDate ? new Date(currentDate) : new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toTimeString().split(' ')[0];
    
    // Input validation
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid text input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Text too long. Maximum 5000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Updated to gpt-4.1 for improved performance
    const preferredModel = 'gpt-4.1-2025-04-14';
    console.log("OPENAI_CALL", preferredModel, Date.now());
    
    // Fetch learning data if userId provided
    let learningInsights = '';
    if (userId) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.80.0');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get memory profile for personalized extraction
      const { data: memoryProfile } = await supabase
        .from('ai_memory_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (memoryProfile) {
        learningInsights += `\n\nPersonalized learning data:
- Writing style: ${memoryProfile.writing_style || 'neutral'}`;
        
        // Add personal vocabulary hints
        if (memoryProfile.category_preferences?._writing_patterns) {
          const patterns = memoryProfile.category_preferences._writing_patterns as any[];
          if (patterns.length > 0) {
            learningInsights += `\n- Common phrases: ${patterns.map((p: any) => p.text).join(', ')}`;
          }
        }
        
        // Add procrastination triggers
        if (memoryProfile.procrastination_triggers && memoryProfile.procrastination_triggers.length > 0) {
          learningInsights += `\n- Avoid suggesting categories: ${memoryProfile.procrastination_triggers.join(', ')}`;
        }
        
        // Add tiny task threshold
        if (memoryProfile.tiny_task_threshold) {
          learningInsights += `\n- Tiny task threshold: ${memoryProfile.tiny_task_threshold} characters`;
        }
      }
      
      // Get user's custom categories
      const { data: customCategories } = await supabase
        .from('custom_categories')
        .select('id, name')
        .eq('user_id', userId);
      
      // Get recent corrections to learn from
      const { data: feedback } = await supabase
        .from('task_learning_feedback')
        .select('*')
        .eq('user_id', userId)
        .eq('was_corrected', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (feedback && feedback.length > 0) {
        // Aggregate patterns
        const categoryPatterns: Record<string, string[]> = {};
        const timeframePatterns: Record<string, string[]> = {};
        
        feedback.forEach(item => {
          // Build category patterns
          const key = item.task_title.toLowerCase();
          if (!categoryPatterns[item.actual_category]) {
            categoryPatterns[item.actual_category] = [];
          }
          categoryPatterns[item.actual_category].push(key);
          
          // Build timeframe patterns
          if (!timeframePatterns[item.actual_timeframe]) {
            timeframePatterns[item.actual_timeframe] = [];
          }
          timeframePatterns[item.actual_timeframe].push(key);
        });
        
        learningInsights += `\n\nLearning from user's past corrections:
- Category preferences: ${Object.entries(categoryPatterns).map(([cat, tasks]) => 
  `${cat} for tasks like: ${tasks.slice(0, 3).join(', ')}`).join('; ')}
- Timeframe preferences: ${Object.entries(timeframePatterns).map(([time, tasks]) => 
  `${time} for tasks like: ${tasks.slice(0, 3).join(', ')}`).join('; ')}`;
      }

      // Add custom categories to learning insights
      if (customCategories && customCategories.length > 0) {
        learningInsights += `\n\nUser's custom categories:\n`;
        customCategories.forEach(cat => {
          learningInsights += `- "${cat.name}" (ID: ${cat.id}): Use when user mentions this category by name or related keywords\n`;
        });
        learningInsights += `When the user says "tag this to [name]", use that custom category if it exists.`;
      }
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nRecent conversation:\n' + 
        conversationHistory.slice(-5).map((msg: any) => 
          `${msg.role === 'user' ? 'User' : 'Malunita'}: ${msg.content.substring(0, 80)}...`
        ).join('\n');
    }

    const systemPrompt = `You are Malunita, a goal-aware productivity coach for solo creators. Your job is to extract actionable tasks from natural, unfiltered voice input and evaluate their alignment with the user's stated goal.

${userProfile?.current_goal ? `🎯 USER'S CURRENT GOAL: "${userProfile.current_goal}" (${userProfile.goal_timeframe || 'this_week'})` : ''}

${conversationContext}

Guidelines:
- Extract 1-3 clear, actionable tasks maximum
- Clean up rambling or vague language into clear task titles
- Suggest appropriate categories: inbox, work, home, projects, gym, someday, or user's custom categories
- Suggest timeframes: today, this_week, later
- Extract reminder dates AND times if mentioned:
  * Current date context: ${currentDateStr} at ${currentTimeStr}
  * Relative dates: "tomorrow at 10 AM", "next Monday at 3 PM", "in 3 days at noon"
  * Absolute dates: "November 10th at 10 AM", "Dec 25 at 9:00", "on the 15th at 2 PM"
  * Time only: "remind me at 10 AM" or "due at 3 PM" (assumes today: ${currentDateStr})
  * Date only: "remind me tomorrow" or "due tomorrow" (assumes 9 AM)
  * "today" references should use: ${currentDateStr}
- Return reminder_time as complete ISO 8601 timestamp (YYYY-MM-DDTHH:MM:SSZ) including date and time
- If no reminder mentioned, return null for reminder_time
- Create friendly confirmation prompts for each task

${userProfile?.current_goal ? `Goal Alignment Evaluation:
- Analyze if this task directly supports the stated goal
- goal_aligned = true: Task directly contributes to achieving the goal
- goal_aligned = false: Task is unrelated to the goal (general/background work)
- goal_aligned = null: Unclear or could be tangentially related
- Provide a brief alignment_reason when applicable` : ''}

${userProfile?.peak_activity_time ? `User's peak activity time: ${userProfile.peak_activity_time}` : ''}
${userProfile?.common_prefixes?.length > 0 ? `User often uses these prefixes: ${userProfile.common_prefixes.join(', ')}` : ''}${learningInsights}

Capture Meta (for tracking rambles → structured inbox):
- Create a brief raw_summary (1-2 sentences) of what the user was talking about
- Detect intent_tags: array of ["work", "family", "finance", "health", "creative", etc.] based on the content
- Set inbox_bucket: always "today_inbox" for now

Task Enrichment Requirements:
For EACH task, provide:
1. **summary**: One sentence summary of what the task involves (max 20 words)
2. **task_type**: Classify as one of: admin, communication, errand, focus, physical, creative, delivery, follow_up
3. **tiny_task**: Boolean - can be done in under 5 minutes?
4. **heavy_task**: Boolean - requires significant mental/physical energy?
5. **emotional_weight**: Number 0-10 (0=neutral, 10=high stress/anxiety)
6. **priority_score**: Number 0-100 based on urgency, impact, dependencies
7. **ideal_time**: Suggest when to do it: "morning", "afternoon", "evening", "anytime"
8. **ideal_day**: Suggest which day: "today", "tomorrow", "this_week", "later"
9. **is_one_thing**: Boolean - detect if user is signaling this as their main priority using phrases like:
   - "if I just get this one thing done"
   - "this is the main item"
   - "this will get my head above water"
   - "most important thing is"
   - "key thing is"
   - "only thing I need to do is"

Return valid JSON in this exact format:
{
  "raw_summary": "Brief 1-2 sentence summary of the ramble",
  "intent_tags": ["work", "planning"],
  "inbox_bucket": "today_inbox",
  "tasks": [
    {
      "title": "Clear task title",
      "summary": "One sentence description of the task",
      "suggested_category": "work",
      "custom_category_id": "<id if custom category>",
      "suggested_timeframe": "today",
      "confidence": 0.85,
      "reminder_time": "2024-11-10T10:00:00Z (complete ISO 8601 with date + time, or null if no reminder)",
      "confirmation_prompt": "Should I add this to Work for today?",
      "task_type": "focus",
      "tiny_task": false,
      "heavy_task": true,
      "emotional_weight": 7,
      "priority_score": 85,
      "ideal_time": "morning",
      "ideal_day": "today",
      "is_one_thing": true${userProfile?.current_goal ? `,
      "goal_aligned": true,
      "alignment_reason": "This directly supports your goal by..."` : ''}
    }
  ],
  "conversation_reply": "Optional friendly reply if no tasks were found"
}

Examples for reminder_time (using current date ${currentDateStr}):
- "due at 10 AM" or "at 10 AM today" → "${currentDateStr}T10:00:00Z"
- "remind me tomorrow at 3 PM" → calculate tomorrow from ${currentDateStr}
- "remind me November 10th at 10 AM" → "2024-11-10T10:00:00Z"
- "remind me next Monday at 9 AM" → calculate next Monday from ${currentDateStr}
- "today at 5 PM" → "${currentDateStr}T17:00:00Z"
- No reminder mentioned → null`;

    console.log('Extracting tasks from:', text);
    console.log('Using model:', preferredModel);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: preferredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Task extraction service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log('Extracted tasks:', result);

    // ===========================================================
    // DEEP REASONING: Analyze extracted tasks for hidden intent
    // ===========================================================
    if (result.tasks && result.tasks.length > 0 && userId) {
      console.log('🧠 Running deep reasoning analysis on extracted tasks...');
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.80.0');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const reasoningSupabase = createClient(supabaseUrl, supabaseKey);

        // Call long-reasoning function
        const { data: deepResult, error: deepError } = await reasoningSupabase.functions.invoke('long-reasoning', {
          body: {
            input: "Analyze these tasks and tell me the underlying goal and the real obstacle. What is the user actually trying to accomplish? What hidden dependencies or themes exist?",
            context: {
              tasks: result.tasks.map((t: any) => ({
                title: t.title,
                category: t.suggested_category,
                timeframe: t.suggested_timeframe,
                goal_aligned: t.goal_aligned
              })),
              userGoal: userProfile?.current_goal,
              extractedText: text,
            }
          }
        });

        if (!deepError && deepResult) {
          console.log('✅ Deep reasoning complete:', deepResult);
          
          // Parse structured insights from the answer
          const answer = deepResult.final_answer || '';
          const steps = deepResult.steps || [];
          
          // Extract themes and patterns from the reasoning
          let commonTheme = '';
          let hiddenObstacle = '';
          let suggestedPriority: Record<string, number> = {};
          
          // Analyze the answer for themes
          if (answer.toLowerCase().includes('underlying goal') || answer.toLowerCase().includes('real objective')) {
            const themeMatch = answer.match(/(?:underlying goal|real objective|actually trying to)[:\s]+([^.!?\n]+)/i);
            if (themeMatch) {
              commonTheme = themeMatch[1].trim();
            }
          }
          
          if (answer.toLowerCase().includes('obstacle') || answer.toLowerCase().includes('blocker')) {
            const obstacleMatch = answer.match(/(?:obstacle|blocker|challenge)[:\s]+([^.!?\n]+)/i);
            if (obstacleMatch) {
              hiddenObstacle = obstacleMatch[1].trim();
            }
          }
          
          // Use reasoning steps to improve task metadata
          result.tasks = result.tasks.map((task: any, index: number) => {
            // Build hidden intent summary
            let hiddenIntent = '';
            if (commonTheme) {
              hiddenIntent += `Theme: ${commonTheme}`;
            }
            if (hiddenObstacle) {
              hiddenIntent += hiddenIntent ? ` | Obstacle: ${hiddenObstacle}` : `Obstacle: ${hiddenObstacle}`;
            }
            
            // Check if any step mentions this specific task
            const taskMentioned = steps.some((step: string) => 
              step.toLowerCase().includes(task.title.toLowerCase().substring(0, 20))
            );
            
            // Boost confidence if deep reasoning validates the task
            let adjustedConfidence = task.confidence || 0.7;
            if (taskMentioned) {
              adjustedConfidence = Math.min(1.0, adjustedConfidence + 0.1);
            }
            
            // Detect if this task unlocks others (hidden dependency)
            const isFoundational = answer.toLowerCase().includes('first') || 
                                    answer.toLowerCase().includes('prerequisite') ||
                                    steps.some((s: string) => s.toLowerCase().includes('start') && 
                                              s.toLowerCase().includes(task.title.toLowerCase().substring(0, 15)));
            
            return {
              ...task,
              confidence: adjustedConfidence,
              hidden_intent: hiddenIntent || null,
              ai_metadata: {
                ...(task.ai_metadata || {}),
                deep_reasoning: {
                  theme_detected: !!commonTheme,
                  is_foundational: isFoundational,
                  reasoning_steps: steps.length,
                  analysis_summary: answer.substring(0, 200)
                }
              }
            };
          });
          
          console.log('📊 Tasks enriched with deep reasoning insights');
        }
      } catch (deepReasoningError) {
        console.error('Deep reasoning failed, continuing with standard extraction:', deepReasoningError);
        // Don't fail the entire request if deep reasoning fails
      }
    }

    // Log API usage for admin tracking
    if (userId) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.80.0');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const totalTokens = data.usage?.total_tokens || 0;
        const modelCosts: Record<string, number> = {
          'gpt-3.5-turbo': 0.001,
          'gpt-4': 0.045,
          'gpt-4-turbo': 0.020,
          'gpt-4o': 0.010,
        };
        const costPer1kTokens = modelCosts[preferredModel] || 0.020;
        const estimatedCost = (totalTokens / 1000) * costPer1kTokens;

        await supabase.from('api_usage_logs').insert({
          user_id: userId,
          function_name: 'extract-tasks',
          model_used: preferredModel,
          tokens_used: totalTokens,
          estimated_cost: estimatedCost,
        });
      } catch (logError) {
        console.error('Failed to log usage:', logError);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract tasks';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
