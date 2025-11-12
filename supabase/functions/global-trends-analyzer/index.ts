import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting global trends analysis...");

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all task learning feedback (focus on corrections)
    const { data: feedback, error: feedbackError } = await supabase
      .from("task_learning_feedback")
      .select("*")
      .eq("was_corrected", true)
      .order("created_at", { ascending: false })
      .limit(1000); // Analyze last 1000 corrections

    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError);
      throw feedbackError;
    }

    console.log(`Analyzing ${feedback?.length || 0} corrections`);

    if (!feedback || feedback.length === 0) {
      console.log("No corrections to analyze");
      return new Response(
        JSON.stringify({ message: "No corrections to analyze yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate misunderstood phrasings
    const misunderstandings = feedback.map((f) => ({
      original: f.original_text,
      taskTitle: f.task_title,
      suggestedCategory: f.suggested_category,
      actualCategory: f.actual_category,
      suggestedTimeframe: f.suggested_timeframe,
      actualTimeframe: f.actual_timeframe,
    }));

    // Group by suggested vs actual category to find patterns
    const categoryMismatches: Record<string, number> = {};
    feedback.forEach((f) => {
      const key = `${f.suggested_category} → ${f.actual_category}`;
      categoryMismatches[key] = (categoryMismatches[key] || 0) + 1;
    });

    // Prepare data for AI analysis
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an AI system analyzer that reviews task categorization patterns to improve accuracy.

Analyze the provided misunderstood task phrasings and identify:
1. Top 10 most common misunderstandings (specific phrases that were consistently miscategorized)
2. Common patterns in user language that lead to errors
3. Specific improvements for categorization prompts
4. Specific improvements for task suggestion prompts

Be concrete and actionable in your recommendations.`;

    const userPrompt = `Analyze these task categorization corrections:

Total corrections: ${feedback.length}

Category mismatches (top patterns):
${Object.entries(categoryMismatches)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([key, count]) => `- ${key}: ${count} times`)
  .join("\n")}

Sample misunderstood phrasings (first 50):
${misunderstandings
  .slice(0, 50)
  .map(
    (m, i) =>
      `${i + 1}. "${m.original}" → Task: "${m.taskTitle}"
   Suggested: ${m.suggestedCategory}, Actual: ${m.actualCategory}`
  )
  .join("\n\n")}

Provide:
1. Top 10 most problematic phrasings with explanations
2. Common linguistic patterns causing errors
3. Specific prompt improvements for categorization
4. Specific prompt improvements for suggestions`;

    console.log("Calling Lovable AI for analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_trends",
              description: "Analyze global task categorization trends and provide improvements",
              parameters: {
                type: "object",
                properties: {
                  top_misunderstood: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        phrase: { type: "string" },
                        issue: { type: "string" },
                        suggestion: { type: "string" },
                        frequency: { type: "number" },
                      },
                      required: ["phrase", "issue", "suggestion"],
                    },
                    description: "Top 10 misunderstood phrasings with issues and fixes",
                  },
                  common_patterns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string" },
                        description: { type: "string" },
                        improvement: { type: "string" },
                      },
                      required: ["pattern", "description", "improvement"],
                    },
                  },
                  categorization_improvements: {
                    type: "string",
                    description: "Specific improvements for categorization prompts",
                  },
                  suggestion_improvements: {
                    type: "string",
                    description: "Specific improvements for task suggestion prompts",
                  },
                },
                required: [
                  "top_misunderstood",
                  "common_patterns",
                  "categorization_improvements",
                  "suggestion_improvements",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_trends" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI analysis complete");

    // Extract structured data from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Store analysis in learning_trends table
    const { error: insertError } = await supabase.from("learning_trends").insert({
      analysis_date: new Date().toISOString(),
      top_misunderstood_phrasings: analysis.top_misunderstood,
      common_patterns: analysis.common_patterns,
      categorization_improvements: analysis.categorization_improvements,
      suggestion_improvements: analysis.suggestion_improvements,
      total_corrections_analyzed: feedback.length,
    });

    if (insertError) {
      console.error("Error storing analysis:", insertError);
      throw insertError;
    }

    console.log("Analysis stored successfully");

    // Log API usage
    await supabase.from("api_usage_logs").insert({
      function_name: "global-trends-analyzer",
      model_used: "google/gemini-2.5-flash",
      tokens_used: aiData.usage?.total_tokens || 0,
      estimated_cost: 0,
      user_id: "00000000-0000-0000-0000-000000000000", // System user
    });

    return new Response(
      JSON.stringify({
        success: true,
        corrections_analyzed: feedback.length,
        top_misunderstood_count: analysis.top_misunderstood.length,
        patterns_identified: analysis.common_patterns.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in global-trends-analyzer:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
