import type { Task } from "./types.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface BasicTask {
  raw: string;
  cleaned: string;
}

export async function classifyTasks(basicTasks: BasicTask[]): Promise<Task[]> {
  if (basicTasks.length === 0) return [];

  const systemPrompt = `You classify tasks as tiny or complex, and split complex tasks into subtasks.

TINY TASK = can be done in <5 minutes, low cognitive load
Examples: "reply to email", "water plants", "file report"

COMPLEX TASK = multi-step, needs planning, or takes >15 minutes
Examples: "plan Q1 strategy", "organize office", "research new vendors"

For complex tasks, generate 2-4 subtasks.

OUTPUT FORMAT (JSON only):
{
  "classified": [
    {
      "raw": "original text",
      "cleaned": "cleaned text",
      "isTiny": true/false,
      "subtasks": ["subtask 1", "subtask 2"] // only if complex
    }
  ]
}`;

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
          { role: 'user', content: JSON.stringify({ tasks: basicTasks }) }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('Classification API error:', response.status);
      return basicTasks.map(t => ({ 
        raw: t.raw,
        cleaned: t.cleaned,
        isTiny: false, 
        subtasks: [],
        priority: 'could',
        due: null,
        project: null,
        people: [],
        contextMarkers: [],
      }));
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    // Convert to full Task format
    return (parsed.classified || basicTasks).map((t: any) => ({
      raw: t.raw,
      cleaned: t.cleaned,
      isTiny: t.isTiny || false,
      subtasks: t.subtasks || [],
      priority: 'could',
      due: null,
      project: null,
      people: [],
      contextMarkers: [],
    }));

  } catch (error) {
    console.error('Error in classifyTasks:', error);
    return basicTasks.map(t => ({ 
      raw: t.raw,
      cleaned: t.cleaned,
      isTiny: false, 
      subtasks: [],
      priority: 'could',
      due: null,
      project: null,
      people: [],
      contextMarkers: [],
    }));
  }
}
