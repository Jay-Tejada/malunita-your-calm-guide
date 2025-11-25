import type { Task } from "./types.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export async function inferContext(tasks: Task[], originalText: string): Promise<Task[]> {
  if (tasks.length === 0) return [];

  const systemPrompt = `You infer context from tasks: people mentioned, deadlines, locations, categories.

EXTRACT:
- People: names mentioned (e.g., "with John", "call Sarah")
- Deadlines: explicit dates/times (e.g., "by Friday", "tomorrow 3pm")
- Project: if task belongs to a larger project
- Context markers: tags like @work, @home, @urgent

OUTPUT FORMAT (JSON only):
{
  "tasks": [
    {
      "raw": "...",
      "cleaned": "...",
      "isTiny": true/false,
      "priority": "must|should|could",
      "due": "2024-01-15" or null,
      "project": "Project Name" or null,
      "people": ["John", "Sarah"],
      "contextMarkers": ["@work", "@urgent"],
      "subtasks": []
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
          { 
            role: 'user', 
            content: JSON.stringify({ 
              tasks,
              originalText 
            }) 
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('Context inference API error:', response.status);
      return tasks.map(t => ({
        ...t,
        due: null,
        project: null,
        people: [],
        contextMarkers: [],
      }));
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return parsed.tasks || tasks;

  } catch (error) {
    console.error('Error in inferContext:', error);
    return tasks.map(t => ({
      ...t,
      due: null,
      project: null,
      people: [],
      contextMarkers: [],
    }));
  }
}
