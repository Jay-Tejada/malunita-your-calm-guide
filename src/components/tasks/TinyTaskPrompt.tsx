// src/components/tasks/TinyTaskPrompt.tsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { checkTinyTaskCluster } from "@/hooks/useTaskCategorization";

interface TinyTaskPromptProps {
  userId: string;
  onCreateFiesta: (tasks: any[], totalMinutes: number) => void;
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
        className="mx-5 mb-4 p-4 rounded-xl bg-card border border-border"
      >
        <p className="font-mono text-sm text-muted-foreground mb-2">
          I see {cluster.tasks.length} quick tasks that could work as a {cluster.totalMinutes}-minute block.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onCreateFiesta(cluster.tasks, cluster.totalMinutes)}
            className="px-4 py-2 rounded-lg transition-colors font-mono text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create "Tiny Task Fiesta"
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-4 py-2 rounded-lg transition-colors font-mono text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
