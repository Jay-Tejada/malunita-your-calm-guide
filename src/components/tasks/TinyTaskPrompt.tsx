// src/components/tasks/TinyTaskPrompt.tsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colors, typography } from "@/ui/tokens";
import { checkTinyTaskCluster } from "@/hooks/useTaskCategorization";

interface TinyTaskPromptProps {
  userId: string;
  onCreateFiesta: (tasks: any[]) => void;
}

export function TinyTaskPrompt({ userId, onCreateFiesta }: TinyTaskPromptProps) {
  const [cluster, setCluster] = useState<{ tasks: any[]; totalMinutes: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    checkTinyTaskCluster(userId).then((result) => {
      if (result.canCreateFiesta) {
        setCluster({ tasks: result.tasks, totalMinutes: result.totalMinutes });
      }
    });
  }, [userId]);

  if (!cluster || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-5 mb-4 p-4 rounded-xl"
        style={{
          backgroundColor: colors.bg.elevated,
          border: `1px solid ${colors.border.subtle}`,
        }}
      >
        <p
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.bodyS.size,
            color: colors.text.secondary,
            marginBottom: 8,
          }}
        >
          I see {cluster.tasks.length} quick tasks that could work as a {cluster.totalMinutes}-minute block.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onCreateFiesta(cluster.tasks)}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.bodyS.size,
              fontWeight: 500,
              backgroundColor: colors.accent.primary,
              color: colors.bg.base,
            }}
          >
            Create "Tiny Task Fiesta"
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.bodyS.size,
              color: colors.text.muted,
              backgroundColor: "transparent",
            }}
          >
            Not now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
