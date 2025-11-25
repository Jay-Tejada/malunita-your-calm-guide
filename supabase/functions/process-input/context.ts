import type { Task } from "./types.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export async function inferContext(tasks: Task[], originalText: string): Promise<Task[]> {
  if (tasks.length === 0) return [];

  const systemPrompt = `You infer context from tasks: people mentioned, deadlines, locations, categories, and reminders.

CATEGORY DETECTION (Work/Home/Gym):
- Work: "client", "invoice", "email", "proposal", "report", "meeting", "deadline", "presentation"
- Home: "laundry", "clean", "kids", "house", "groceries", "dishes", "trash", "bills"
- Gym: "workout", "exercise", "running", "gym", "fitness", "training", "cardio"
- If no keywords match, leave category null

DEADLINE PARSING (natural language → ISO date):
- "by Monday" → next Monday's date
- "due tomorrow" → tomorrow's date
- "next week" → 7 days from now
- "Friday" → next Friday's date
- Parse relative dates to ISO format (YYYY-MM-DD)

REMINDER DETECTION:
- "remind me at 3pm tomorrow" → extract "reminder_time": "2024-01-15T15:00:00"
- "remind me tomorrow morning" → "2024-01-15T09:00:00"
- "remind me at 5" → today at 5pm if not passed, else tomorrow
- Parse reminders to ISO timestamp format

PRIORITY DETECTION:
- "urgent", "ASAP", "important", "critical" → priority: "must"
- Otherwise keep existing priority

OUTPUT FORMAT (JSON only):
{
  "tasks": [
    {
      "raw": "...",
      "cleaned": "...",
      "isTiny": true/false,
      "priority": "must|should|could",
      "category": "work|home|gym" or null,
      "due": "2024-01-15" or null,
      "reminder_time": "2024-01-15T15:00:00" or null,
      "project": "Project Name" or null,
      "people": ["John", "Sarah"],
      "contextMarkers": ["@work", "@urgent"],
      "subtasks": []
    }
  ]
}

Today's date for reference: ${new Date().toISOString().split('T')[0]}`;

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
        category: null,
        due: null,
        reminder_time: null,
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
      category: null,
      due: null,
      reminder_time: null,
      project: null,
      people: [],
      contextMarkers: [],
    }));
  }
}
