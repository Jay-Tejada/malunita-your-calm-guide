import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { weekStart, weekEnd, sessions } = await req.json();

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ 
          recommendations: [
            {
              type: "getting_started",
              title: "Start Your Daily Practice",
              description: "You haven't logged any sessions this week. Begin with a morning session to set your daily focus.",
              priority: "high"
            }
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze patterns
    const dayOfWeekCounts: { [key: string]: number } = {};
    const dayCompletions: { [key: string]: number } = {};
    const deepWorkByDay: { [key: string]: number } = {};
    
    sessions.forEach((session: any) => {
      const date = new Date(session.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
      
      if (session.top_focus && (session.reflection_wins || session.reflection_improve)) {
        dayCompletions[dayName] = (dayCompletions[dayName] || 0) + 1;
      }

      if (session.deep_work_blocks && Array.isArray(session.deep_work_blocks)) {
        session.deep_work_blocks.forEach((block: any) => {
          if (block.start && block.end) {
            const start = new Date(`2000-01-01 ${block.start}`);
            const end = new Date(`2000-01-01 ${block.end}`);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            deepWorkByDay[dayName] = (deepWorkByDay[dayName] || 0) + hours;
          }
        });
      }
    });

    // Prepare context for AI
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s: any) => 
      s.top_focus && (s.reflection_wins || s.reflection_improve)
    ).length;
    
    const focusThemes = sessions
      .filter((s: any) => s.top_focus)
      .map((s: any) => s.top_focus)
      .join(', ');

    const mostProductiveDay = Object.entries(dayCompletions)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const mostDeepWorkDay = Object.entries(deepWorkByDay)
      .sort((a, b) => b[1] - a[1])[0];

    const analysisContext = `
Weekly Session Analysis (${weekStart} to ${weekEnd}):
- Total sessions: ${totalSessions}/7
- Completed sessions: ${completedSessions}
- Most productive day: ${mostProductiveDay || 'N/A'}
- Most deep work: ${mostDeepWorkDay?.[0] || 'N/A'} (${Math.round((mostDeepWorkDay?.[1] || 0) * 10) / 10} hours)
- Focus themes: ${focusThemes || 'None recorded'}
- Day-by-day activity: ${Object.entries(dayOfWeekCounts).map(([day, count]) => `${day}: ${count}`).join(', ')}
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are a productivity coach analyzing weekly patterns. Generate 3-5 specific, actionable recommendations based on the user's data. Focus on:
- Scheduling optimization (which days work best)
- Consistency improvements
- Deep work habits
- Reflection practices
- Theme patterns

Return recommendations as a JSON array with this structure:
[
  {
    "type": "productivity|consistency|scheduling|reflection|focus",
    "title": "Short actionable title",
    "description": "Specific recommendation with context from their data",
    "priority": "high|medium|low"
  }
]

Be specific, reference their actual patterns, and keep it encouraging but direct.`
          },
          {
            role: 'user',
            content: analysisContext
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_recommendations",
              description: "Generate personalized productivity recommendations",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["productivity", "consistency", "scheduling", "reflection", "focus"]
                        },
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: {
                          type: "string",
                          enum: ["high", "medium", "low"]
                        }
                      },
                      required: ["type", "title", "description", "priority"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["recommendations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_recommendations" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Failed to generate recommendations');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No recommendations generated');
    }

    const recommendations = JSON.parse(toolCall.function.arguments).recommendations;

    // Detect seasonal patterns from daily_focus_history
    const { data: focusHistory } = await supabase
      .from('daily_focus_history')
      .select('date, focus_task, cluster_label')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(90); // Last 3 months

    const seasonalPatterns: Record<string, { count: number; categories: string[] }> = {
      monday_reset: { count: 0, categories: [] },
      weekend_family: { count: 0, categories: [] },
      month_start_admin: { count: 0, categories: [] },
      month_end_financial: { count: 0, categories: [] },
    };

    focusHistory?.forEach((record) => {
      const date = new Date(record.date);
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();
      const category = record.cluster_label || 'uncategorized';

      // Monday patterns
      if (dayOfWeek === 1) {
        seasonalPatterns.monday_reset.count++;
        seasonalPatterns.monday_reset.categories.push(category);
      }

      // Weekend patterns
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        seasonalPatterns.weekend_family.count++;
        seasonalPatterns.weekend_family.categories.push(category);
      }

      // Start of month patterns (days 1-7)
      if (dayOfMonth >= 1 && dayOfMonth <= 7) {
        seasonalPatterns.month_start_admin.count++;
        seasonalPatterns.month_start_admin.categories.push(category);
      }

      // End of month patterns (days 24-31)
      if (dayOfMonth >= 24) {
        seasonalPatterns.month_end_financial.count++;
        seasonalPatterns.month_end_financial.categories.push(category);
      }
    });

    // Calculate most common category for each pattern
    const seasonalWeight: Record<string, any> = {};
    
    Object.entries(seasonalPatterns).forEach(([pattern, data]) => {
      if (data.count >= 3) { // Minimum 3 occurrences to establish pattern
        const categoryCount: Record<string, number> = {};
        data.categories.forEach(cat => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        const topCategory = Object.entries(categoryCount)
          .sort((a, b) => b[1] - a[1])[0];
        
        if (topCategory && topCategory[1] >= 2) {
          seasonalWeight[pattern] = {
            category: topCategory[0],
            confidence: topCategory[1] / data.count,
            weight: 0.1
          };
        }
      }
    });

    // Update user's focus_preferences with seasonal_weight
    if (Object.keys(seasonalWeight).length > 0) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('focus_preferences')
        .eq('id', user.id)
        .single();

      const updatedPreferences = {
        ...(currentProfile?.focus_preferences as Record<string, any> || {}),
        seasonal_weight: seasonalWeight
      };

      await supabase
        .from('profiles')
        .update({ focus_preferences: updatedPreferences })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in weekly-recommendations:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        recommendations: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
