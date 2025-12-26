import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are Malunita's context retrieval engine.

You assist analysis by recalling relevant prior context silently.
You do not generate user-facing content.

OBJECTIVE:
Determine whether prior context should influence current analysis or suggestions.

RETRIEVAL LOGIC:
- Compare new capture's themes against memory index
- Calculate relevance score
- If high relevance: flag for influence
- If low relevance: proceed without context

RULES:
- Only retrieve if relevance >= 0.7
- Do NOT surface memory to user unless explicitly useful
- Do NOT overwhelm current task with past context
- Context influences ANALYSIS, not UI by default
- Respect recency (recent items weighted higher)

OUTPUT FORMAT (JSON ONLY):
{
  "context_retrieved": true | false,
  "related_items_count": number,
  "strongest_match": "item_id or theme",
  "relevance_score": 0.0-1.0,
  "influence_level": "none | low | medium | high"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ai_summary, user_id } = await req.json();

    if (!ai_summary || !user_id) {
      return new Response(
        JSON.stringify({ error: 'ai_summary and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client to fetch prior context
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch recent tasks with memory-related fields for context matching
    const { data: recentTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, ai_summary, category, keywords, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (tasksError) {
      console.error('Error fetching recent tasks:', tasksError);
    }

    // Fetch pattern insights for the user
    const { data: patternInsights, error: patternsError } = await supabase
      .from('pattern_insights')
      .select('insight_type, insight')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (patternsError) {
      console.error('Error fetching patterns:', patternsError);
    }

    // Build memory index from recent data
    const memoryIndex = {
      recent_themes: extractThemes(recentTasks || []),
      patterns: patternInsights?.map(p => p.insight) || [],
      recent_items: recentTasks?.slice(0, 10).map(t => ({
        id: t.id,
        summary: t.ai_summary || t.title,
        category: t.category,
        keywords: t.keywords
      })) || []
    };

    console.log('Retrieving context for:', ai_summary.substring(0, 50));
    console.log('Memory index themes:', memoryIndex.recent_themes);

    // Ask AI to determine relevance
    const userPrompt = `Analyze this new capture against the user's memory index:

NEW CAPTURE:
${ai_summary}

MEMORY INDEX:
Recent themes: ${JSON.stringify(memoryIndex.recent_themes)}
Recent items: ${JSON.stringify(memoryIndex.recent_items.slice(0, 5))}
Patterns: ${JSON.stringify(memoryIndex.patterns.slice(0, 3))}

Determine if prior context should influence this capture's analysis.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Context retrieval response:', content);
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback with no context
      return new Response(
        JSON.stringify({
          context_retrieved: false,
          related_items_count: 0,
          strongest_match: null,
          relevance_score: 0,
          influence_level: 'none',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize and validate output
    const relevanceScore = typeof parsed.relevance_score === 'number' 
      ? Math.max(0, Math.min(1, parsed.relevance_score)) 
      : 0;

    const result = {
      context_retrieved: relevanceScore >= 0.7,
      related_items_count: typeof parsed.related_items_count === 'number' ? parsed.related_items_count : 0,
      strongest_match: parsed.strongest_match || null,
      relevance_score: relevanceScore,
      influence_level: determineInfluenceLevel(relevanceScore),
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in context-retrieve:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Extract recurring themes from recent tasks
function extractThemes(tasks: any[]): string[] {
  const themeCount: Record<string, number> = {};
  
  for (const task of tasks) {
    // Count categories
    if (task.category) {
      themeCount[task.category] = (themeCount[task.category] || 0) + 1;
    }
    
    // Count keywords
    if (task.keywords && Array.isArray(task.keywords)) {
      for (const keyword of task.keywords) {
        themeCount[keyword] = (themeCount[keyword] || 0) + 1;
      }
    }
  }
  
  // Return themes that appear 2+ times, sorted by frequency
  return Object.entries(themeCount)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([theme]) => theme);
}

// Determine influence level based on relevance score
function determineInfluenceLevel(score: number): 'none' | 'low' | 'medium' | 'high' {
  if (score >= 0.85) return 'high';
  if (score >= 0.7) return 'medium';
  if (score >= 0.4) return 'low';
  return 'none';
}
