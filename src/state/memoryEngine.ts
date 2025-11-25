import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

interface MemoryEngineState {
  writingStyle: string | null;
  categoryPreferences: Record<string, number>;
  priorityBias: Record<"must" | "should" | "could", number>;
  tinyTaskThreshold: number;
  energyPattern: Record<"morning" | "afternoon" | "night", number>;
  procrastinationTriggers: string[];
  emotionalTriggers: string[];
  positiveReinforcers: string[];
  streakHistory: Array<{ date: string; type: string; value: number }>;
  lastUpdated: Date | null;
}

interface MemoryEngineActions {
  updateFromCorrection: (correction: any) => void;
  updateFromTask: (task: any) => void;
  updateFromVoiceInput: (input: string, metadata?: any) => void;
  updateFromCompanionInteraction: (interaction: any) => void;
  getProfileSnapshot: () => MemoryEngineState;
  syncWithBackend: () => Promise<void>;
  setWritingStyle: (style: string) => void;
  addProcrastinationTrigger: (trigger: string) => void;
  addEmotionalTrigger: (trigger: string) => void;
  addPositiveReinforcer: (reinforcer: string) => void;
  updateCategoryPreference: (category: string, weight: number) => void;
  updatePriorityBias: (priority: "must" | "should" | "could", weight: number) => void;
  updateEnergyPattern: (timeOfDay: "morning" | "afternoon" | "night", energy: number) => void;
  addToStreakHistory: (type: string, value: number) => void;
}

const initialState: MemoryEngineState = {
  writingStyle: null,
  categoryPreferences: {},
  priorityBias: {
    must: 0.5,
    should: 0.5,
    could: 0.5,
  },
  tinyTaskThreshold: 5,
  energyPattern: {
    morning: 0.5,
    afternoon: 0.5,
    night: 0.5,
  },
  procrastinationTriggers: [],
  emotionalTriggers: [],
  positiveReinforcers: [],
  streakHistory: [],
  lastUpdated: null,
};

export const useMemoryEngine = create<MemoryEngineState & MemoryEngineActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateFromCorrection: (correction) => {
        set((state) => {
          const updates: Partial<MemoryEngineState> = { lastUpdated: new Date() };

          // Learn from category corrections
          if (correction.corrected_output?.category) {
            const category = correction.corrected_output.category;
            updates.categoryPreferences = {
              ...state.categoryPreferences,
              [category]: (state.categoryPreferences[category] || 0) + 0.1,
            };
          }

          // Learn from priority corrections
          if (correction.corrected_output?.priority) {
            const priority = correction.corrected_output.priority.toLowerCase() as "must" | "should" | "could";
            if (priority in state.priorityBias) {
              updates.priorityBias = {
                ...state.priorityBias,
                [priority]: Math.min(1, state.priorityBias[priority] + 0.05),
              };
            }
          }

          return { ...state, ...updates };
        });
      },

      updateFromTask: (task) => {
        set((state) => {
          const updates: Partial<MemoryEngineState> = { lastUpdated: new Date() };
          
          // Track category preferences based on completed tasks
          if (task.completed && task.category) {
            updates.categoryPreferences = {
              ...state.categoryPreferences,
              [task.category]: (state.categoryPreferences[task.category] || 0) + 0.05,
            };
          }

          // Learn tiny task threshold
          if (task.is_tiny_task !== undefined) {
            const titleLength = task.title?.length || 0;
            if (titleLength > 0) {
              const currentThreshold = state.tinyTaskThreshold;
              const newThreshold = (currentThreshold + titleLength) / 2;
              updates.tinyTaskThreshold = Math.round(newThreshold);
            }
          }

          // Track completion time patterns for energy
          if (task.completed_at) {
            const hour = new Date(task.completed_at).getHours();
            let timeOfDay: "morning" | "afternoon" | "night";
            if (hour >= 6 && hour < 12) timeOfDay = "morning";
            else if (hour >= 12 && hour < 18) timeOfDay = "afternoon";
            else timeOfDay = "night";

            updates.energyPattern = {
              ...state.energyPattern,
              [timeOfDay]: Math.min(1, state.energyPattern[timeOfDay] + 0.02),
            };
          }

          return { ...state, ...updates };
        });
      },

      updateFromVoiceInput: (input, metadata) => {
        set((state) => {
          const updates: Partial<MemoryEngineState> = { lastUpdated: new Date() };

          // Infer writing style from voice input patterns
          if (!state.writingStyle && input.length > 50) {
            const hasCasualPhrases = /like|just|maybe|kinda|sorta/i.test(input);
            const hasFormalTone = /please|kindly|would appreciate/i.test(input);
            updates.writingStyle = hasFormalTone ? "formal" : hasCasualPhrases ? "casual" : "neutral";
          }

          // Track positive reinforcers from metadata
          if (metadata?.emotion === "excited" || metadata?.emotion === "happy") {
            const words = input.toLowerCase().split(" ");
            words.forEach((word) => {
              if (word.length > 4 && !state.positiveReinforcers.includes(word)) {
                updates.positiveReinforcers = [...state.positiveReinforcers, word].slice(-20);
              }
            });
          }

          return { ...state, ...updates };
        });
      },

      updateFromCompanionInteraction: (interaction) => {
        set((state) => {
          const updates: Partial<MemoryEngineState> = { lastUpdated: new Date() };

          // Track emotional triggers
          if (interaction.emotion && interaction.trigger) {
            if (!state.emotionalTriggers.includes(interaction.trigger)) {
              updates.emotionalTriggers = [...state.emotionalTriggers, interaction.trigger].slice(-15);
            }
          }

          // Track procrastination patterns
          if (interaction.type === "procrastination_detected") {
            const trigger = interaction.context || "unknown";
            if (!state.procrastinationTriggers.includes(trigger)) {
              updates.procrastinationTriggers = [...state.procrastinationTriggers, trigger].slice(-10);
            }
          }

          // Track streak achievements
          if (interaction.type === "streak_achieved") {
            updates.streakHistory = [
              ...state.streakHistory,
              {
                date: new Date().toISOString(),
                type: interaction.streakType || "general",
                value: interaction.streakValue || 0,
              },
            ].slice(-50);
          }

          return { ...state, ...updates };
        });
      },

      getProfileSnapshot: () => {
        return { ...get() };
      },

      syncWithBackend: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const snapshot = get().getProfileSnapshot();
          
          const memoryProfile = {
            writing_style: snapshot.writingStyle,
            category_preferences: snapshot.categoryPreferences,
            priority_bias: snapshot.priorityBias,
            tiny_task_threshold: snapshot.tinyTaskThreshold,
            energy_pattern: snapshot.energyPattern,
            procrastination_triggers: snapshot.procrastinationTriggers,
            emotional_triggers: snapshot.emotionalTriggers,
            positive_reinforcers: snapshot.positiveReinforcers,
            streak_history: snapshot.streakHistory,
            last_updated: snapshot.lastUpdated?.toISOString(),
          };

          await supabase
            .from("profiles")
            .update({
              learning_profile: memoryProfile,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        } catch (error) {
          console.error("Error syncing memory engine with backend:", error);
        }
      },

      setWritingStyle: (style) => set({ writingStyle: style, lastUpdated: new Date() }),

      addProcrastinationTrigger: (trigger) =>
        set((state) => ({
          procrastinationTriggers: [...state.procrastinationTriggers, trigger].slice(-10),
          lastUpdated: new Date(),
        })),

      addEmotionalTrigger: (trigger) =>
        set((state) => ({
          emotionalTriggers: [...state.emotionalTriggers, trigger].slice(-15),
          lastUpdated: new Date(),
        })),

      addPositiveReinforcer: (reinforcer) =>
        set((state) => ({
          positiveReinforcers: [...state.positiveReinforcers, reinforcer].slice(-20),
          lastUpdated: new Date(),
        })),

      updateCategoryPreference: (category, weight) =>
        set((state) => ({
          categoryPreferences: {
            ...state.categoryPreferences,
            [category]: Math.max(0, Math.min(1, weight)),
          },
          lastUpdated: new Date(),
        })),

      updatePriorityBias: (priority, weight) =>
        set((state) => ({
          priorityBias: {
            ...state.priorityBias,
            [priority]: Math.max(0, Math.min(1, weight)),
          },
          lastUpdated: new Date(),
        })),

      updateEnergyPattern: (timeOfDay, energy) =>
        set((state) => ({
          energyPattern: {
            ...state.energyPattern,
            [timeOfDay]: Math.max(0, Math.min(1, energy)),
          },
          lastUpdated: new Date(),
        })),

      addToStreakHistory: (type, value) =>
        set((state) => ({
          streakHistory: [
            ...state.streakHistory,
            { date: new Date().toISOString(), type, value },
          ].slice(-50),
          lastUpdated: new Date(),
        })),
    }),
    {
      name: "memory-engine-storage",
    }
  )
);
