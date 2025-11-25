import type { UserContext, ExtractedContent } from "./types.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export async function extractFromInput(
  text: string,
  userContext: UserContext
): Promise<ExtractedContent> {
  
  const systemPrompt = `You are Malunita's input processor. Extract structured information from user input.

User Context:
${userContext.goal ? `- Current Goal: ${userContext.goal}` : ''}
${userContext.customCategories.length > 0 ? `- Custom Categories: ${userContext.customCategories.join(', ')}` : ''}

RULES:
1. Extract ALL actionable tasks (things to do)
2. Extract ideas (thoughts, insights, notes that aren't tasks)
3. Extract decisions made
4. Detect emotional tone: stressed, ok, or motivated
5. Generate clarifying questions ONLY if critical info is missing (date, time, who)

OUTPUT FORMAT (JSON only, no explanation):
{
  "tasks": [{"raw": "original text", "cleaned": "cleaned version"}],
  "ideas": ["idea 1", "idea 2"],
  "decisions": ["decision 1"],
  "emotion": "stressed|ok|motivated",
  "clarifyingQuestions": ["question if needed"]
}

Be concise. Don't hallucinate. Only extract what's actually there.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    const parsed = JSON.parse(content);

    return {
      tasks: parsed.tasks || [],
      ideas: parsed.ideas || [],
      decisions: parsed.decisions || [],
      emotion: parsed.emotion || 'ok',
      clarifyingQuestions: parsed.clarifyingQuestions || [],
    };

  } catch (error) {
    console.error('Error in extractFromInput:', error);
    // Fallback: basic extraction - treat entire input as one task
    const lines = text.split('\n').filter(l => l.trim());
    return {
      tasks: lines.length > 0 
        ? lines.map(line => ({ raw: line, cleaned: line.trim() }))
        : [{ raw: text, cleaned: text }],
      ideas: [],
      decisions: [],
      emotion: 'ok',
      clarifyingQuestions: [],
    };
  }
}
