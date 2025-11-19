interface Task {
  id?: string;
  title: string;
  category?: string;
  reminder_time?: string | null;
}

interface IdeaAnalysis {
  summary: string;
  topics: string[];
  insights: string[];
  decisions: string[];
  ideas: string[];
  followups: string[];
  questions: string[];
  emotional_tone: string;
}

interface ContextMap {
  projects: Array<{ name: string; task_ids: string[] }>;
  categories: Array<{ category: string; task_ids: string[] }>;
  people_mentions: string[];
  implied_deadlines: Array<{ task_id: string; deadline: string }>;
  time_sensitivity: Array<{ task_id: string; urgency: 'high' | 'medium' | 'low' }>;
}

interface TaskScore {
  task_id: string;
  priority: 'MUST' | 'SHOULD' | 'COULD';
  effort: 'tiny' | 'small' | 'medium' | 'large';
  fiesta_ready: boolean;
  big_task: boolean;
}

interface AgendaRouting {
  today: string[];
  tomorrow: string[];
  this_week: string[];
  upcoming: string[];
  someday: string[];
}

interface ClarificationQuestion {
  task_id: string;
  question: string;
  type: 'deadline' | 'category' | 'project' | 'priority' | 'agenda';
}

interface ClarificationOutput {
  questions: ClarificationQuestion[];
  needs_clarification: boolean;
  total_questions: number;
}

interface NotebookSummary {
  markdown: string;
  sections: {
    overview: string;
    analysis: string;
    context: string;
    priorities: string;
    agenda: string;
    clarifications: string;
  };
}

export function summaryComposer(
  extractedTasks: Task[],
  ideaAnalysis: IdeaAnalysis,
  contextMap: ContextMap,
  priorityScores: TaskScore[],
  agendaRouting: AgendaRouting,
  clarifications: ClarificationOutput
): NotebookSummary {
  const tasks = extractedTasks || [];
  const analysis = ideaAnalysis || { summary: '', topics: [], insights: [], decisions: [], ideas: [], followups: [], questions: [], emotional_tone: 'neutral' };
  const context = contextMap || { projects: [], categories: [], people_mentions: [], implied_deadlines: [], time_sensitivity: [] };
  const scores = priorityScores || [];
  const routing = agendaRouting || { today: [], tomorrow: [], this_week: [], upcoming: [], someday: [] };
  const clarify = clarifications || { questions: [], needs_clarification: false, total_questions: 0 };

  // Helper to get task by id
  const getTask = (taskId: string) => tasks.find(t => t.id === taskId);

  // Helper to format task list
  const formatTaskList = (taskIds: string[], includeDetails: boolean = false): string => {
    if (!taskIds || taskIds.length === 0) return '  _None_\n';
    
    return taskIds.map(id => {
      const task = getTask(id);
      if (!task) return '';
      
      const score = scores.find(s => s.task_id === id);
      if (includeDetails && score) {
        const badges = [];
        badges.push(`Priority: ${score.priority}`);
        badges.push(`Effort: ${score.effort}`);
        if (score.fiesta_ready) badges.push('🎉 Fiesta-ready');
        if (score.big_task) badges.push('📦 Big task');
        
        return `  - **${task.title}**\n    _${badges.join(' • ')}_\n`;
      }
      
      return `  - ${task.title}\n`;
    }).join('');
  };

  // OVERVIEW SECTION
  const overviewSection = `# 📓 Session Overview

**Total Tasks Captured:** ${tasks.length}
**Emotional Tone:** ${analysis.emotional_tone}
${analysis.summary ? `\n**Summary:** ${analysis.summary}\n` : ''}
---
`;

  // ANALYSIS SECTION
  const analysisSection = `## 🧠 Idea Analysis

${analysis.topics && analysis.topics.length > 0 ? `**Topics Identified:**\n${analysis.topics.map(t => `- ${t}`).join('\n')}\n` : ''}

${analysis.insights && analysis.insights.length > 0 ? `\n**Key Insights:**\n${analysis.insights.map(i => `- ${i}`).join('\n')}\n` : ''}

${analysis.decisions && analysis.decisions.length > 0 ? `\n**Decisions Made:**\n${analysis.decisions.map(d => `- ✓ ${d}`).join('\n')}\n` : ''}

${analysis.ideas && analysis.ideas.length > 0 ? `\n**Ideas to Explore:**\n${analysis.ideas.map(i => `- 💡 ${i}`).join('\n')}\n` : ''}

${analysis.followups && analysis.followups.length > 0 ? `\n**Follow-ups:**\n${analysis.followups.map(f => `- → ${f}`).join('\n')}\n` : ''}

${analysis.questions && analysis.questions.length > 0 ? `\n**Open Questions:**\n${analysis.questions.map(q => `- ❓ ${q}`).join('\n')}\n` : ''}

---
`;

  // CONTEXT SECTION
  const contextSection = `## 🗺️ Context Map

${context.projects && context.projects.length > 0 ? `**Projects Detected:**\n${context.projects.map(p => `- **${p.name}** (${p.task_ids.length} tasks)`).join('\n')}\n` : ''}

${context.categories && context.categories.length > 0 ? `\n**Categories:**\n${context.categories.map(c => `- ${c.category}: ${c.task_ids.length} tasks`).join('\n')}\n` : ''}

${context.people_mentions && context.people_mentions.length > 0 ? `\n**People Mentioned:**\n${context.people_mentions.map(p => `- @${p}`).join('\n')}\n` : ''}

${context.implied_deadlines && context.implied_deadlines.length > 0 ? `\n**Deadlines Detected:**\n${context.implied_deadlines.map(d => {
  const task = getTask(d.task_id);
  return `- ${task?.title || 'Unknown'}: ${new Date(d.deadline).toLocaleDateString()}`;
}).join('\n')}\n` : ''}

${context.time_sensitivity && context.time_sensitivity.length > 0 ? `\n**Time Sensitivity:**\n${context.time_sensitivity.map(t => {
  const task = getTask(t.task_id);
  const urgencyEmoji = t.urgency === 'high' ? '🔴' : t.urgency === 'medium' ? '🟡' : '🟢';
  return `- ${urgencyEmoji} ${task?.title || 'Unknown'}: ${t.urgency} urgency`;
}).join('\n')}\n` : ''}

---
`;

  // PRIORITIES SECTION
  const prioritiesSection = `## 🎯 Priority Scores

**MUST-do tasks:** ${scores.filter(s => s.priority === 'MUST').length}
**SHOULD-do tasks:** ${scores.filter(s => s.priority === 'SHOULD').length}
**COULD-do tasks:** ${scores.filter(s => s.priority === 'COULD').length}

**Fiesta-ready tasks:** ${scores.filter(s => s.fiesta_ready).length}
**Big tasks:** ${scores.filter(s => s.big_task).length}

**Effort Distribution:**
- Tiny: ${scores.filter(s => s.effort === 'tiny').length}
- Small: ${scores.filter(s => s.effort === 'small').length}
- Medium: ${scores.filter(s => s.effort === 'medium').length}
- Large: ${scores.filter(s => s.effort === 'large').length}

---
`;

  // AGENDA SECTION
  const agendaSection = `## 📅 Agenda Routing

### Today (${routing.today.length} tasks)
${formatTaskList(routing.today, true)}

### Tomorrow (${routing.tomorrow.length} tasks)
${formatTaskList(routing.tomorrow)}

### This Week (${routing.this_week.length} tasks)
${formatTaskList(routing.this_week)}

### Upcoming (${routing.upcoming.length} tasks)
${formatTaskList(routing.upcoming)}

### Someday/Maybe (${routing.someday.length} tasks)
${formatTaskList(routing.someday)}

---
`;

  // CLARIFICATIONS SECTION
  const clarificationsSection = `## ❓ Clarification Questions

${clarify.needs_clarification ? `**${clarify.total_questions} question(s) need your input:**\n\n${clarify.questions.map(q => {
  const task = getTask(q.task_id);
  return `**${task?.title || 'Unknown Task'}**\n- ${q.question}\n- _Type: ${q.type}_\n`;
}).join('\n')}` : '**No clarifications needed!** All tasks are clear and ready to go.\n'}

---
`;

  // Combine all sections
  const markdown = overviewSection + analysisSection + contextSection + prioritiesSection + agendaSection + clarificationsSection;

  return {
    markdown,
    sections: {
      overview: overviewSection,
      analysis: analysisSection,
      context: contextSection,
      priorities: prioritiesSection,
      agenda: agendaSection,
      clarifications: clarificationsSection,
    },
  };
}
