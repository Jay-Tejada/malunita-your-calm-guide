// src/components/tasks/TinyTaskParty.tsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colors, typography } from "@/ui/tokens";
import { TaskRow } from "@/ui/tasks/TaskRow";
import { OrbButton } from "@/components/orb/OrbButton";
import { haptics } from "@/hooks/useHaptics";

interface Task {
  id: string;
  title: string;
  estimatedMinutes?: number;
  completed?: boolean;
}

interface TinyTaskPartyProps {
  isOpen: boolean;
  tasks: Task[];
  totalMinutes: number;
  onClose: () => void;
  onComplete: (taskId: string) => Promise<void>;
}

export function TinyTaskParty({
  isOpen,
  tasks,
  totalMinutes,
  onClose,
  onComplete,
}: TinyTaskPartyProps) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [celebrating, setCelebrating] = useState(false);

  // Sync localTasks when tasks prop changes
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const completedCount = localTasks.filter((t) => t.completed).length;

  const handleToggle = async (taskId: string) => {
    haptics.success(); // Satisfying click
    
    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );

    try {
      await onComplete(taskId);

      // Check if all done
      const nowCompleted = localTasks.filter((t) => t.id === taskId || t.completed).length;
      if (nowCompleted === localTasks.length) {
        haptics.success();
        setCelebrating(true);
      }
    } catch {
      // Revert on error
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(5,5,9,0.9)", backdropFilter: "blur(16px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Full screen party mode */}
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: colors.bg.base }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <button
                onClick={onClose}
                style={{ color: colors.text.secondary, fontFamily: typography.fontFamily }}
              >
                ← Exit
              </button>
              <div className="text-center">
                <p
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.labelS.size,
                    color: colors.text.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Tiny Task Fiesta
                </p>
                <p
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.bodyS.size,
                    color: colors.text.secondary,
                  }}
                >
                  {completedCount}/{localTasks.length} done · ~{totalMinutes} min
                </p>
              </div>
              <div style={{ width: 48 }} />
            </div>

            {/* Progress bar */}
            <div className="px-5 mb-6">
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.border.subtle }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: colors.accent.primary }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / localTasks.length) * 100}%` }}
                  transition={{ type: "spring", damping: 20 }}
                />
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto">
              {localTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TaskRow
                    title={task.title}
                    isCompleted={task.completed}
                    metadata={task.estimatedMinutes ? `~${task.estimatedMinutes} min` : undefined}
                    onToggleComplete={() => handleToggle(task.id)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Celebration state */}
            {celebrating && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center z-60"
                style={{ backgroundColor: colors.bg.base }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onAnimationComplete={() => haptics.success()}
              >
                <OrbButton state="success" size={120} onPress={() => {}} />
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    fontFamily: typography.fontFamily,
                    fontSize: typography.titleL.size,
                    fontWeight: typography.titleL.weight,
                    color: colors.text.primary,
                    marginTop: 24,
                  }}
                >
                  Fiesta complete! 🎉
                </motion.p>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  className="mt-6 px-6 py-3 rounded-xl"
                  style={{
                    fontFamily: typography.fontFamily,
                    backgroundColor: colors.accent.primary,
                    color: colors.bg.base,
                    fontWeight: 500,
                  }}
                >
                  Done
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
