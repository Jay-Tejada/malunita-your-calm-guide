export type TaskStoryline = {
  id: string;
  title: string;              // e.g. "PCMH Pro Launch", "Clear The Admin Fog"
  theme: string;              // short label: "client work", "health", "admin", etc.
  mood: 'calm' | 'stressed' | 'momentum' | 'stuck' | 'playful';
  progressPercent: number;    // 0–100
  taskCount: number;          // total tasks in this storyline
  completedCount: number;     // how many done
  lastActivity: string | null;// human-readable, e.g. "2 days ago"
  keyTasks: {
    id: string;
    title: string;
    is_focus: boolean;
    is_tiny: boolean;
  }[];
  suggestedNextStep?: string; // one sentence next move
  frictionNote?: string;      // where things are stuck
  energyTag?: 'light' | 'medium' | 'heavy';
  timeHorizon?: 'today' | 'this_week' | 'soon' | 'someday';
  allTaskIds?: string[];      // All task IDs in this storyline (for filtering)
};
