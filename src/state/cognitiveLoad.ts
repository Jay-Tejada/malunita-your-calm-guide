import { create } from 'zustand';
import { useEmotionalMemory } from './emotionalMemory';
import { useMoodStore } from './moodMachine';
import type { Mood } from './moodMachine';

export type CognitiveLoadLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface TaskActivity {
  tasksAddedRecently: number;
  lastTaskAddTime: number | null;
  tasksCompletedRecently: number;
  lastCompletionTime: number | null;
  categorySwitch: number;
  lastCategorySwitch: number | null;
  overdueTasks: number;
  hasComplexPrimaryFocus: boolean;
  primaryFocusBaselineBoost: number;
}

interface CognitiveLoadState {
  score: number; // 0-100
  level: CognitiveLoadLevel;
  taskActivity: TaskActivity;
  stressedWordCount: number;
  lastCalculation: number;
  recommendations: string[];
}

interface CognitiveLoadActions {
  calculateLoad: () => void;
  recordTaskAdded: () => void;
  recordTaskCompleted: () => void;
  recordCategorySwitch: () => void;
  recordStressedLanguage: (text: string) => void;
  updateOverdueTasks: (count: number) => void;
  recordComplexPrimaryFocus: () => void;
  recordPrimaryFocusCompleted: () => void;
  getRecommendations: () => string[];
  applyLoadEffects: () => void;
  reset: () => void;
}

const STRESSED_WORDS = [
  'overwhelmed', 'stressed', 'too much', 'cant', "can't", 'exhausted',
  'burned out', 'burnout', 'swamped', 'drowning', 'struggling',
  'impossible', 'never gonna', 'give up', 'quit', 'anxious', 'panic'
];

const ACTIVITY_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const RAPID_TASK_THRESHOLD = 10; // 10 tasks in 30 mins = rapid
const CATEGORY_SWITCH_THRESHOLD = 5; // 5 switches in 30 mins = rapid

const initialTaskActivity: TaskActivity = {
  tasksAddedRecently: 0,
  lastTaskAddTime: null,
  tasksCompletedRecently: 0,
  lastCompletionTime: null,
  categorySwitch: 0,
  lastCategorySwitch: null,
  overdueTasks: 0,
  hasComplexPrimaryFocus: false,
  primaryFocusBaselineBoost: 0,
};

export const useCognitiveLoad = create<CognitiveLoadState & CognitiveLoadActions>((set, get) => ({
  score: 0,
  level: 'LOW',
  taskActivity: { ...initialTaskActivity },
  stressedWordCount: 0,
  lastCalculation: Date.now(),
  recommendations: [],

  calculateLoad: () => {
    const state = get();
    const now = Date.now();
    
    // Clean up old activity data
    const cleanedActivity = { ...state.taskActivity };
    
    if (cleanedActivity.lastTaskAddTime && (now - cleanedActivity.lastTaskAddTime) > ACTIVITY_WINDOW_MS) {
      cleanedActivity.tasksAddedRecently = 0;
    }
    
    if (cleanedActivity.lastCompletionTime && (now - cleanedActivity.lastCompletionTime) > ACTIVITY_WINDOW_MS) {
      cleanedActivity.tasksCompletedRecently = 0;
    }
    
    if (cleanedActivity.lastCategorySwitch && (now - cleanedActivity.lastCategorySwitch) > ACTIVITY_WINDOW_MS) {
      cleanedActivity.categorySwitch = 0;
    }

    // Calculate individual signal scores (0-25 each)
    const emotionalMemory = useEmotionalMemory.getState();
    
    // 1. Stress level from emotional memory (0-25)
    const stressScore = (emotionalMemory.stress / 100) * 25;
    
    // 2. Rapid task additions (0-25)
    const rapidTaskScore = Math.min((cleanedActivity.tasksAddedRecently / RAPID_TASK_THRESHOLD) * 25, 25);
    
    // 3. Task completion ratio (0-25, inverse)
    const completionRatio = cleanedActivity.tasksAddedRecently > 0 
      ? cleanedActivity.tasksCompletedRecently / cleanedActivity.tasksAddedRecently
      : 1;
    const completionScore = (1 - completionRatio) * 25;
    
    // 4. Category switching + stressed language + overdue (0-25)
    const categoryScore = Math.min((cleanedActivity.categorySwitch / CATEGORY_SWITCH_THRESHOLD) * 10, 10);
    const languageScore = Math.min(state.stressedWordCount * 2, 10);
    const overdueScore = Math.min(cleanedActivity.overdueTasks * 0.5, 5);
    const behaviorScore = categoryScore + languageScore + overdueScore;
    
    // Apply primary focus baseline boost if complex ONE thing is set
    const primaryFocusBoost = cleanedActivity.primaryFocusBaselineBoost;
    
    // Total score (0-100)
    const totalScore = Math.min(
      Math.round(stressScore + rapidTaskScore + completionScore + behaviorScore + primaryFocusBoost),
      100
    );
    
    // Determine level
    let level: CognitiveLoadLevel = 'LOW';
    if (totalScore > 70) {
      level = 'HIGH';
    } else if (totalScore >= 40) {
      level = 'MEDIUM';
    }
    
    set({
      score: totalScore,
      level,
      taskActivity: cleanedActivity,
      lastCalculation: now,
    });
    
    // Apply effects based on level
    get().applyLoadEffects();
  },

  recordTaskAdded: () => {
    const now = Date.now();
    set((state) => ({
      taskActivity: {
        ...state.taskActivity,
        tasksAddedRecently: state.taskActivity.tasksAddedRecently + 1,
        lastTaskAddTime: now,
      }
    }));
    get().calculateLoad();
  },

  recordTaskCompleted: () => {
    const now = Date.now();
    set((state) => ({
      taskActivity: {
        ...state.taskActivity,
        tasksCompletedRecently: state.taskActivity.tasksCompletedRecently + 1,
        lastCompletionTime: now,
      }
    }));
    get().calculateLoad();
  },

  recordCategorySwitch: () => {
    const now = Date.now();
    set((state) => ({
      taskActivity: {
        ...state.taskActivity,
        categorySwitch: state.taskActivity.categorySwitch + 1,
        lastCategorySwitch: now,
      }
    }));
    get().calculateLoad();
  },

  recordStressedLanguage: (text: string) => {
    const lowerText = text.toLowerCase();
    const matches = STRESSED_WORDS.filter(word => lowerText.includes(word));
    
    if (matches.length > 0) {
      set((state) => ({
        stressedWordCount: state.stressedWordCount + matches.length,
      }));
      get().calculateLoad();
    }
  },

  updateOverdueTasks: (count: number) => {
    set((state) => ({
      taskActivity: {
        ...state.taskActivity,
        overdueTasks: count,
      }
    }));
    get().calculateLoad();
  },

  recordComplexPrimaryFocus: () => {
    console.log('Recording complex primary focus - increasing cognitive load baseline by +2');
    set((state) => ({
      taskActivity: {
        ...state.taskActivity,
        hasComplexPrimaryFocus: true,
        primaryFocusBaselineBoost: 2,
      }
    }));
    
    // Increase fatigue slightly when tackling complex primary focus
    const emotionalMemory = useEmotionalMemory.getState();
    emotionalMemory.adjustFatigue(1);
    
    get().calculateLoad();
  },

  recordPrimaryFocusCompleted: () => {
    console.log('Recording primary focus completed - reducing cognitive load by -4');
    set((state) => ({
      score: Math.max(state.score - 4, 0),
      taskActivity: {
        ...state.taskActivity,
        hasComplexPrimaryFocus: false,
        primaryFocusBaselineBoost: 0,
      }
    }));
    
    // Reduce fatigue by -2 on ONE thing completion
    const emotionalMemory = useEmotionalMemory.getState();
    emotionalMemory.adjustFatigue(-2);
    
    get().calculateLoad();
  },

  getRecommendations: () => {
    const { level, taskActivity, score } = get();
    const recommendations: string[] = [];

    if (level === 'HIGH') {
      recommendations.push("Let's pick ONE thing together.");
      recommendations.push("Try Focus Mode to concentrate on your top priority.");
      recommendations.push("Consider taking a 5-minute break.");
      if (taskActivity.overdueTasks > 5) {
        recommendations.push("Let's reschedule some overdue tasks.");
      }
    } else if (level === 'MEDIUM') {
      recommendations.push("Start a Tiny Task Fiesta session to build momentum.");
      recommendations.push("Break down larger tasks into smaller steps.");
      if (taskActivity.tasksAddedRecently > taskActivity.tasksCompletedRecently) {
        recommendations.push("Focus on completing existing tasks before adding new ones.");
      }
    } else {
      recommendations.push("You're doing great! Keep up the momentum.");
      if (taskActivity.tasksCompletedRecently > 3) {
        recommendations.push("Celebrate your progress!");
      }
    }

    set({ recommendations });
    return recommendations;
  },

  applyLoadEffects: () => {
    const { level, score } = get();
    const moodStore = useMoodStore.getState();
    const emotionalMemory = useEmotionalMemory.getState();

    if (level === 'HIGH') {
      // Set concerned/worried mood
      if (moodStore.mood !== 'worried' && moodStore.mood !== 'concerned') {
        moodStore.updateMood('worried');
      }
      
      // Increase stress slowly
      emotionalMemory.adjustStress(2);
      
    } else if (level === 'MEDIUM') {
      // Neutral, supportive mood
      if (score > 50 && moodStore.mood !== 'neutral' && moodStore.mood !== 'concerned') {
        moodStore.updateMood('neutral');
      }
      
    } else if (level === 'LOW') {
      // Allow excited, playful behavior
      if (score < 20 && emotionalMemory.joy > 60) {
        moodStore.updateMood('excited');
      }
    }
  },

  reset: () => {
    set({
      score: 0,
      level: 'LOW',
      taskActivity: { ...initialTaskActivity },
      stressedWordCount: 0,
      lastCalculation: Date.now(),
      recommendations: [],
    });
  },
}));

// Export helper functions for primary focus tracking
export const recordComplexPrimaryFocus = () => {
  useCognitiveLoad.getState().recordComplexPrimaryFocus();
};

export const recordPrimaryFocusCompleted = () => {
  useCognitiveLoad.getState().recordPrimaryFocusCompleted();
};

// Helper function to monitor task activity
export const startCognitiveLoadMonitoring = () => {
  // Check every 2 minutes
  const interval = setInterval(() => {
    useCognitiveLoad.getState().calculateLoad();
  }, 2 * 60 * 1000);

  return () => clearInterval(interval);
};

// Helper to get load indicator color
export const getLoadColor = (level: CognitiveLoadLevel): string => {
  switch (level) {
    case 'HIGH':
      return 'text-destructive';
    case 'MEDIUM':
      return 'text-warning';
    case 'LOW':
      return 'text-primary';
  }
};

// Helper to get mood for load level
export const getLoadMood = (level: CognitiveLoadLevel): Mood => {
  switch (level) {
    case 'HIGH':
      return 'worried';
    case 'MEDIUM':
      return 'neutral';
    case 'LOW':
      return 'excited';
  }
};
