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
    const { data } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const context = `
Analyze this monthly productivity data and generate personalized insights:

**Tasks:**
- Created: ${data.tasksCreated}
- Completed: ${data.tasksCompleted}
- Top categories: ${data.topCategories.map((c: any) => `${c.category} (${c.count})`).join(', ')}

**Streaks:**
- Task completion: ${data.streaks.taskCompletion} days
- Reflection: ${data.streaks.reflection} days

**Emotional Trends:**
- Average joy: ${data.emotionalTrends.avgJoy}/100
- Average stress: ${data.emotionalTrends.avgStress}/100
- Average affection: ${data.emotionalTrends.avgAffection}/100
- Average fatigue: ${data.emotionalTrends.avgFatigue}/100
- Joy peaks: ${data.emotionalTrends.joyPeaks} times
- Stress spikes: ${data.emotionalTrends.stressSpikes} times

**Mood Distribution:**
${Object.entries(data.moodDistribution).map(([mood, count]) => `- ${mood}: ${count} times`).join('\n')}

**Ritual Consistency:**
- Morning rituals: ${data.ritualConsistency.morningCount}/${data.ritualConsistency.totalDays} days
- Evening reflections: ${data.ritualConsistency.eveningCount}/${data.ritualConsistency.totalDays} days

Generate:
1. Three specific wins from this month (be encouraging and concrete)
2. Two challenges or things that caused overwhelm (be empathetic)
3. List of emerging habits that are becoming reliable rhythms
4. One focused thing to improve next month

Return as JSON with structure:
{
  "wins": ["win1", "win2", "win3"],
  "challenges": ["challenge1", "challenge2"],
  "emergingHabits": ["habit1", "habit2", "habit3"],
  "focusNext": "one specific focus area"
}
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
            content: 'You are Malunita, a supportive AI companion analyzing monthly progress. Be warm, specific, and encouraging. Always return valid JSON.'
          },
          {
            role: 'user',
            content: context
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      // Fallback insights
      return new Response(
        JSON.stringify({
          wins: [
            `You completed ${data.tasksCompleted} tasks this month!`,
            `You maintained a ${data.streaks.taskCompletion}-day task completion streak`,
            `Your joy level averaged ${data.emotionalTrends.avgJoy}/100`
          ],
          challenges: [
            data.emotionalTrends.stressSpikes > 3 ? "You experienced some stress spikes this month" : "Task management felt overwhelming at times",
            "Finding consistent time for rituals"
          ],
          emergingHabits: [
            data.ritualConsistency.morningCount > 15 ? "Morning planning is becoming a solid habit" : "Building morning ritual consistency",
            data.topCategories[0] ? `${data.topCategories[0].category} tasks are a reliable rhythm` : "Developing task routines"
          ],
          focusNext: data.emotionalTrends.avgStress > 60 ? "Focus on stress management techniques" : "Continue building on your momentum"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const insights = JSON.parse(content);

    // Detect seasonal insight for display
    const topCategories = data.topCategories || [];
    let seasonalInsight = '';

    if (topCategories.length > 0) {
      // Analyze which seasonal pattern is strongest
      const mondayTasks = topCategories.filter((c: any) => 
        c.category.toLowerCase().includes('planning') || 
        c.category.toLowerCase().includes('review')
      );
      const weekendTasks = topCategories.filter((c: any) => 
        c.category.toLowerCase().includes('family') || 
        c.category.toLowerCase().includes('personal')
      );
      
      if (mondayTasks.length > 0) {
        seasonalInsight = `Your ONE things on Mondays tend to cluster around ${mondayTasks[0].category}.`;
      } else if (weekendTasks.length > 0) {
        seasonalInsight = `Your ONE things on weekends tend to cluster around ${weekendTasks[0].category}.`;
      } else if (topCategories[0]) {
        seasonalInsight = `Your most common ONE-thing focus this month was ${topCategories[0].category}.`;
      }
    }

    return new Response(
      JSON.stringify({ 
        ...insights,
        seasonalInsight 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating monthly insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
