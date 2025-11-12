import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔍 Starting global trends analysis...');

  try {
    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all task learning feedback from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('task_learning_feedback')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      throw feedbackError;
    }

    console.log(`📊 Analyzing ${feedbackData?.length || 0} feedback entries`);

    if (!feedbackData || feedbackData.length === 0) {
      console.log('No feedback data to analyze');
      return new Response(
        JSON.stringify({ message: 'No feedback data available for analysis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate misunderstood phrasings (where was_corrected = true)
    const corrections = feedbackData.filter(f => f.was_corrected);
    const misunderstoodMap = new Map<string, any>();

    corrections.forEach(correction => {
      const key = correction.original_text.toLowerCase().trim();
      if (!misunderstoodMap.has(key)) {
        misunderstoodMap.set(key, {
          original: correction.original_text,
          taskTitle: correction.task_title,
          suggestedCategory: correction.suggested_category,
          actualCategory: correction.actual_category,
          count: 0,
        });
      }
      const entry = misunderstoodMap.get(key);
      entry.count++;
    });

    // Sort by count and get top 10
    const topMisunderstood = Array.from(misunderstoodMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate common patterns across all tasks
    const allPhrasings = feedbackData.map(f => ({
      text: f.original_text,
      title: f.task_title,
      category: f.actual_category,
    }));

    // Use Lovable AI to analyze patterns and generate improvements
    const systemPrompt = `You are an AI learning system that analyzes task management patterns.
Analyze the provided task feedback data and generate:
1. Common phrasing patterns users employ
2. Suggested improvements to categorization logic
3. Suggested improvements to task suggestion logic

Be specific and actionable. Focus on patterns that appear frequently.`;

    const userPrompt = `Here is the feedback data:

Top 10 Misunderstood Phrasings (${corrections.length} total corrections):
${JSON.stringify(topMisunderstood, null, 2)}

Sample of all task phrasings (${allPhrasings.length} total):
${JSON.stringify(allPhrasings.slice(0, 50), null, 2)}

Provide:
1. Common patterns you observe
2. Specific improvements for categorization prompts
3. Specific improvements for task suggestion prompts`;

    console.log('🤖 Calling Lovable AI for analysis...');

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
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_trends',
              description: 'Analyze task management trends and provide improvements',
              parameters: {
                type: 'object',
                properties: {
                  commonPatterns: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        pattern: { type: 'string' },
                        frequency: { type: 'string' },
                        recommendation: { type: 'string' },
                      },
                    },
                  },
                  categorizationImprovements: { type: 'string' },
                  suggestionImprovements: { type: 'string' },
                },
                required: ['commonPatterns', 'categorizationImprovements', 'suggestionImprovements'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_trends' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const analysis = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!analysis) {
      throw new Error('No analysis returned from AI');
    }

    console.log('✅ Analysis complete');

    // Store results in learning_trends table
    const { error: insertError } = await supabase
      .from('learning_trends')
      .insert({
        top_misunderstood_phrasings: topMisunderstood,
        common_patterns: analysis.commonPatterns,
        categorization_improvements: analysis.categorizationImprovements,
        suggestion_improvements: analysis.suggestionImprovements,
        total_corrections_analyzed: corrections.length,
      });

    if (insertError) {
      console.error('Error storing trends:', insertError);
      throw insertError;
    }

    // Log API usage
    await supabase.from('api_usage_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      function_name: 'global-trends-analyzer',
      model_used: 'google/gemini-2.5-flash',
      tokens_used: aiData.usage?.total_tokens || 0,
      estimated_cost: 0,
    });

    console.log('✨ Global trends analysis complete');

    return new Response(
      JSON.stringify({
        success: true,
        misunderstoodCount: topMisunderstood.length,
        totalCorrections: corrections.length,
        analysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in global-trends-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
