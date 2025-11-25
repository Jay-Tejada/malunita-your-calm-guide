/**
 * Cognitive Load Model
 * Calculates cognitive load based on task activity, completion patterns, and time
 */

interface Task {
  id: string;
  completed: boolean;
  created_at: string;
  completed_at?: string;
  is_focus?: boolean;
  category?: string;
  reminder_time?: string;
}

interface Activity {
  tasksCompletedToday: number;
  tasksCreatedToday: number;
  tasksOverdue: number;
  streakCount: number;
  oneThingCompleted: boolean;
  voiceSentiment?: 'positive' | 'neutral' | 'negative';
}

interface CognitiveLoad {
  overall: number;          // 0-100
  stress_signals: number;   // 0-100
  momentum_signals: number; // 0-100
  fatigue_signals: number;  // 0-100
}

export type { CognitiveLoad };

/**
 * Calculate overall cognitive load
 */
export function calculateCognitiveLoad(params: {
  tasks: Task[];
  activity: Activity;
}): CognitiveLoad {
  const { tasks, activity } = params;
  const now = new Date();
  const hour = now.getHours();
  const today = now.toISOString().split('T')[0];

  // Base metrics
  const incompleteTasks = tasks.filter(t => !t.completed).length;
  const tasksCompletedToday = activity.tasksCompletedToday || 0;
  const tasksCreatedToday = activity.tasksCreatedToday || 0;
  const tasksOverdue = activity.tasksOverdue || 0;
  const streakCount = activity.streakCount || 0;
  const oneThingCompleted = activity.oneThingCompleted || false;

  // Calculate stress signals
  const stress_signals = calculateStressSignals({
    incompleteTasks,
    tasksOverdue,
    tasksCreatedToday,
    tasksCompletedToday,
    hour,
  });

  // Calculate momentum signals
  const momentum_signals = calculateMomentumSignals({
    streakCount,
    tasksCompletedToday,
    oneThingCompleted,
    incompleteTasks,
  });

  // Calculate fatigue signals
  const fatigue_signals = calculateFatigueSignals({
    hour,
    tasksCompletedToday,
    incompleteTasks,
    voiceSentiment: activity.voiceSentiment,
  });

  // Overall cognitive load (weighted average)
  const overall = Math.round(
    stress_signals * 0.4 +
    fatigue_signals * 0.3 +
    (100 - momentum_signals) * 0.3
  );

  return {
    overall: clamp(overall),
    stress_signals: clamp(stress_signals),
    momentum_signals: clamp(momentum_signals),
    fatigue_signals: clamp(fatigue_signals),
  };
}

/**
 * Calculate stress signals
 */
export function calculateStressSignals(params: {
  incompleteTasks: number;
  tasksOverdue: number;
  tasksCreatedToday: number;
  tasksCompletedToday: number;
  hour: number;
}): number {
  const {
    incompleteTasks,
    tasksOverdue,
    tasksCreatedToday,
    tasksCompletedToday,
    hour,
  } = params;

  let stress = 0;

  // Task load stress (0-40 points)
  if (incompleteTasks > 20) stress += 40;
  else if (incompleteTasks > 10) stress += 30;
  else if (incompleteTasks > 5) stress += 20;
  else stress += 10;

  // Overdue task stress (0-30 points)
  if (tasksOverdue > 5) stress += 30;
  else if (tasksOverdue > 2) stress += 20;
  else if (tasksOverdue > 0) stress += 10;

  // Creation vs completion imbalance (0-20 points)
  const imbalance = tasksCreatedToday - tasksCompletedToday;
  if (imbalance > 10) stress += 20;
  else if (imbalance > 5) stress += 15;
  else if (imbalance > 2) stress += 10;

  // Time of day factor (0-10 points)
  // Higher stress in evening if many tasks remain
  if (hour >= 18 && incompleteTasks > 5) {
    stress += 10;
  }

  return clamp(stress);
}

/**
 * Calculate momentum signals
 */
export function calculateMomentumSignals(params: {
  streakCount: number;
  tasksCompletedToday: number;
  oneThingCompleted: boolean;
  incompleteTasks: number;
}): number {
  const {
    streakCount,
    tasksCompletedToday,
    oneThingCompleted,
    incompleteTasks,
  } = params;

  let momentum = 0;

  // Streak bonus (0-40 points)
  if (streakCount >= 7) momentum += 40;
  else if (streakCount >= 5) momentum += 35;
  else if (streakCount >= 3) momentum += 25;
  else if (streakCount >= 1) momentum += 15;

  // Completion momentum (0-30 points)
  if (tasksCompletedToday >= 10) momentum += 30;
  else if (tasksCompletedToday >= 5) momentum += 25;
  else if (tasksCompletedToday >= 3) momentum += 20;
  else if (tasksCompletedToday >= 1) momentum += 10;

  // ONE Thing completion (0-20 points)
  if (oneThingCompleted) {
    momentum += 20;
  }

  // Progress ratio (0-10 points)
  const totalTasks = incompleteTasks + tasksCompletedToday;
  if (totalTasks > 0) {
    const progressRatio = tasksCompletedToday / totalTasks;
    momentum += Math.round(progressRatio * 10);
  }

  return clamp(momentum);
}

/**
 * Calculate fatigue signals
 */
export function calculateFatigueSignals(params: {
  hour: number;
  tasksCompletedToday: number;
  incompleteTasks: number;
  voiceSentiment?: 'positive' | 'neutral' | 'negative';
}): number {
  const { hour, tasksCompletedToday, incompleteTasks, voiceSentiment } = params;

  let fatigue = 0;

  // Time of day baseline (0-30 points)
  if (hour >= 22 || hour < 6) {
    fatigue += 30; // Late night / early morning
  } else if (hour >= 20) {
    fatigue += 20; // Evening
  } else if (hour >= 18) {
    fatigue += 10; // Late afternoon
  } else if (hour >= 14 && hour < 16) {
    fatigue += 15; // Post-lunch dip
  }

  // Workload fatigue (0-30 points)
  if (tasksCompletedToday > 15) fatigue += 30;
  else if (tasksCompletedToday > 10) fatigue += 20;
  else if (tasksCompletedToday > 7) fatigue += 10;

  // Remaining task pressure (0-20 points)
  if (incompleteTasks > 15) fatigue += 20;
  else if (incompleteTasks > 10) fatigue += 15;
  else if (incompleteTasks > 5) fatigue += 10;

  // Voice sentiment (0-20 points)
  if (voiceSentiment === 'negative') {
    fatigue += 20;
  } else if (voiceSentiment === 'neutral') {
    fatigue += 10;
  }

  return clamp(fatigue);
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
