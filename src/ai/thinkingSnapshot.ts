export interface ThinkingSnapshot {
  summaryMarkdown: string;
  topFocusTask?: {
    id?: string;
    title: string;
    reason: string;
  } | null;
  quickWins: Array<{
    title: string;
    reason: string;
  }>;
  followUps: Array<{
    title: string;
    reason?: string;
  }>;
  questions: string[];
  emotionalTone: string;
  agendaBuckets: {
    today: number;
    tomorrow: number;
    thisWeek: number;
    upcoming: number;
    someday: number;
  };
}

export function buildThinkingSnapshot(params: {
  notebookSummary: { markdown: string };
  ideaAnalysis: any;
  contextMap: any;
  priorityScores: any;
  agendaRouting: any;
  clarifications: any;
}): ThinkingSnapshot {
  const {
    notebookSummary,
    ideaAnalysis,
    contextMap,
    priorityScores,
    agendaRouting,
    clarifications,
  } = params;

  // Extract top focus task from priority scores
  const topFocusTask = priorityScores?.tasks?.length > 0
    ? {
        id: priorityScores.tasks[0].id,
        title: priorityScores.tasks[0].title,
        reason: priorityScores.tasks[0].reasoning || "Highest priority task",
      }
    : null;

  // Extract quick wins (tiny tasks or tasks with low time investment)
  const quickWins = (priorityScores?.tasks || [])
    .filter((task: any) => task.is_tiny_task || task.estimated_minutes < 10)
    .slice(0, 3)
    .map((task: any) => ({
      title: task.title,
      reason: task.is_tiny_task 
        ? "Quick task to build momentum" 
        : `Can be done in ~${task.estimated_minutes || 5} minutes`,
    }));

  // Extract follow-ups from context map or clarifications
  const followUps: Array<{ title: string; reason?: string }> = [];
  
  if (contextMap?.relatedTasks) {
    contextMap.relatedTasks.slice(0, 2).forEach((task: any) => {
      followUps.push({
        title: task.title,
        reason: task.relationship || "Related to current focus",
      });
    });
  }

  if (contextMap?.blockers) {
    contextMap.blockers.forEach((blocker: any) => {
      followUps.push({
        title: blocker.description || blocker,
        reason: "Blocking progress",
      });
    });
  }

  // Extract questions from clarifications
  const questions = clarifications?.needed_clarifications || [];

  // Determine emotional tone based on context and analysis
  let emotionalTone = "focused";
  
  if (ideaAnalysis?.themes?.some((t: string) => 
    t.toLowerCase().includes("overwhelm") || 
    t.toLowerCase().includes("stress")
  )) {
    emotionalTone = "calming";
  } else if (ideaAnalysis?.themes?.some((t: string) => 
    t.toLowerCase().includes("celebration") || 
    t.toLowerCase().includes("achievement")
  )) {
    emotionalTone = "celebratory";
  } else if (quickWins.length > 0) {
    emotionalTone = "encouraging";
  } else if (questions.length > 0) {
    emotionalTone = "curious";
  }

  // Count tasks by agenda bucket
  const agendaBuckets = {
    today: 0,
    tomorrow: 0,
    thisWeek: 0,
    upcoming: 0,
    someday: 0,
  };

  if (agendaRouting?.agenda) {
    agendaBuckets.today = agendaRouting.agenda.today?.length || 0;
    agendaBuckets.tomorrow = agendaRouting.agenda.tomorrow?.length || 0;
    agendaBuckets.thisWeek = agendaRouting.agenda.this_week?.length || 0;
    agendaBuckets.upcoming = agendaRouting.agenda.upcoming?.length || 0;
    agendaBuckets.someday = agendaRouting.agenda.someday?.length || 0;
  }

  // Build the summary markdown
  const summaryMarkdown = notebookSummary?.markdown || "";

  return {
    summaryMarkdown,
    topFocusTask,
    quickWins,
    followUps,
    questions,
    emotionalTone,
    agendaBuckets,
  };
}
