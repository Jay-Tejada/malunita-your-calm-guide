import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasks } = await req.json();
    
    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ clusters: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare task summary for AI
    const taskSummary = tasks.map((task: any, idx: number) => 
      `${idx + 1}. "${task.title}" (Category: ${task.category || 'None'}, Context: ${task.context || 'None'})`
    ).join('\n');

    const systemPrompt = `You are an AI task organizer. Analyze the given tasks and group them into semantic clusters based on their meaning and context, not just their categories.

Common cluster types to consider:
- Health & Fitness (exercise, nutrition, medical appointments)
- Business Growth (work projects, networking, professional development)
- Family & Personal Care (relationships, personal errands, social commitments)
- Errands & Logistics (shopping, bills, administrative tasks)
- Learning & Skills (education, hobbies, self-improvement)
- Home & Maintenance (cleaning, repairs, organization)
- Creative Projects (art, writing, creative work)

Create 3-7 clusters based on the tasks provided. Each cluster should have:
- A clear, descriptive name
- A list of task indices (1-based) that belong to it
- A task count

Return ONLY a JSON object with this structure (no markdown, no explanation):
{
  "clusters": [
    {
      "name": "Cluster Name",
      "tasks": [1, 3, 5],
      "taskCount": 3
    }
  ]
}`;

    const userPrompt = `Analyze and cluster these tasks:\n\n${taskSummary}`;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse AI response
    let clusters;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedContent);
      clusters = parsed.clusters;
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // Map task indices back to task IDs
    const enrichedClusters = clusters.map((cluster: any) => ({
      name: cluster.name,
      tasks: cluster.tasks.map((idx: number) => tasks[idx - 1].id),
      taskCount: cluster.taskCount || cluster.tasks.length,
    }));

    console.log("Generated clusters:", enrichedClusters);

    return new Response(
      JSON.stringify({ clusters: enrichedClusters }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in cluster-tasks function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        clusters: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
