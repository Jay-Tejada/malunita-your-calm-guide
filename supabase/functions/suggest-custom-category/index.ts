import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ suggestions: [], error: 'Authentication required' }),
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
        JSON.stringify({ suggestions: [], error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { taskText } = await req.json();
    
    if (!taskText || typeof taskText !== 'string') {
      return new Response(
        JSON.stringify({ suggestions: [], error: 'Invalid task text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch user's custom categories
    const { data: customCategories } = await supabase
      .from('custom_categories')
      .select('id, name, icon, color')
      .eq('user_id', user.id)
      .order('display_order');

    // Fetch user's trained keywords
    const { data: trainedKeywords } = await supabase
      .from('category_keywords')
      .select('keyword, custom_category_id')
      .eq('user_id', user.id);

    if (!customCategories || customCategories.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for trained keyword matches first (highest priority)
    if (trainedKeywords && trainedKeywords.length > 0) {
      const taskLower = taskText.toLowerCase();
      const keywordMatches: Record<string, number> = {};
      
      for (const { keyword, custom_category_id } of trainedKeywords) {
        if (taskLower.includes(keyword.toLowerCase())) {
          keywordMatches[custom_category_id] = (keywordMatches[custom_category_id] || 0) + 1;
        }
      }

      // If we have exact keyword matches, return them with high confidence
      if (Object.keys(keywordMatches).length > 0) {
        const suggestions = Object.entries(keywordMatches)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([catId, matchCount]) => {
            const category = customCategories.find(c => c.id === catId);
            if (!category) return null;
            return {
              category_id: catId,
              category_name: category.name,
              confidence: 0.95,
              reason: `Matches ${matchCount} trained keyword${matchCount > 1 ? 's' : ''}`
            };
          })
          .filter(Boolean);

        if (suggestions.length > 0) {
          console.log('Returning keyword-based suggestions:', suggestions);
          return new Response(
            JSON.stringify({ suggestions }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Fetch user's past tasks for pattern analysis
    const { data: pastTasks } = await supabase
      .from('tasks')
      .select('title, custom_category_id')
      .eq('user_id', user.id)
      .not('custom_category_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    // Build context for AI
    let contextPrompt = `Analyze this task and suggest which custom category it belongs to based on patterns and keywords.

Task: "${taskText}"

Available custom categories:
${customCategories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')}`;

    if (trainedKeywords && trainedKeywords.length > 0) {
      const keywordsByCategory: Record<string, string[]> = {};
      trainedKeywords.forEach(({ keyword, custom_category_id }) => {
        if (!keywordsByCategory[custom_category_id]) {
          keywordsByCategory[custom_category_id] = [];
        }
        keywordsByCategory[custom_category_id].push(keyword);
      });

      contextPrompt += `\n\nUser has trained these keywords (PRIORITIZE THESE):`;
      Object.entries(keywordsByCategory).forEach(([catId, keywords]) => {
        const category = customCategories.find(c => c.id === catId);
        if (category) {
          contextPrompt += `\n- ${category.name}: [${keywords.join(', ')}]`;
        }
      });
    }

    if (pastTasks && pastTasks.length > 0) {
      const categoryPatterns: Record<string, string[]> = {};
      
      pastTasks.forEach(task => {
        if (!categoryPatterns[task.custom_category_id]) {
          categoryPatterns[task.custom_category_id] = [];
        }
        categoryPatterns[task.custom_category_id].push(task.title);
      });

      contextPrompt += `\n\nUser's past task patterns:`;
      Object.entries(categoryPatterns).forEach(([catId, tasks]) => {
        const category = customCategories.find(c => c.id === catId);
        if (category) {
          contextPrompt += `\n- ${category.name}: ${tasks.slice(0, 5).join(', ')}`;
        }
      });
    }

    contextPrompt += `\n\nReturn the top 3 most relevant category suggestions with confidence scores. Consider:
- Keyword matches between task and past tasks in each category
- Similar phrasing patterns
- Context clues in the task text

Return JSON array with this structure:
[
  {
    "category_id": "uuid",
    "category_name": "Name",
    "confidence": 0.85,
    "reason": "Brief explanation of why this category matches"
  }
]

Only suggest categories with confidence > 0.3. If no good matches, return empty array.`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Requesting category suggestions - textLength:', taskText.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an AI that analyzes tasks and suggests relevant categories based on patterns and keywords. Always return valid JSON.' },
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ suggestions: [], error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ suggestions: [], error: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let suggestions = [];

    try {
      const content = data.choices[0].message.content;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      suggestions = [];
    }

    // Validate and filter suggestions
    const validSuggestions = suggestions
      .filter((s: any) => 
        s.category_id && 
        s.confidence > 0.3 && 
        customCategories.some(c => c.id === s.category_id)
      )
      .slice(0, 3);

    console.log('Generated suggestions:', validSuggestions);

    return new Response(
      JSON.stringify({ suggestions: validSuggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Category suggestion error:', error);
    return new Response(
      JSON.stringify({ 
        suggestions: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
