import React from "react";
import { motion } from "framer-motion";
import { X, TrendingUp, Calendar, Target } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";

interface InsightsPanelProps {
  onClose: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ onClose }) => {
  const { tasks } = useTasks();

  const completedToday = tasks?.filter(t => {
    if (!t.completed || !t.completed_at) return false;
    const completedDate = new Date(t.completed_at);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  }).length || 0;

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.completed).length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 h-[400px] bg-card/95 backdrop-blur-sm border-b border-border/30 shadow-2xl z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-lg font-medium text-foreground">Insights</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completed Today */}
        <div className="bg-gradient-to-br from-green-50 to-card border border-green-200/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-4 h-4 text-green-700" />
            </div>
            <span className="text-sm font-mono text-foreground-soft">Completed Today</span>
          </div>
          <p className="text-3xl font-mono font-medium text-foreground">{completedToday}</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-gradient-to-br from-blue-50 to-card border border-blue-200/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-sm font-mono text-foreground-soft">Completion Rate</span>
          </div>
          <p className="text-3xl font-mono font-medium text-foreground">{completionRate}%</p>
        </div>

        {/* Total Tasks */}
        <div className="bg-gradient-to-br from-amber-50 to-card border border-amber-200/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Target className="w-4 h-4 text-amber-700" />
            </div>
            <span className="text-sm font-mono text-foreground-soft">Total Tasks</span>
          </div>
          <p className="text-3xl font-mono font-medium text-foreground">{totalTasks}</p>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="px-6 pb-6">
        <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
          <p className="text-sm font-mono text-foreground-soft">
            {completedToday > 0 
              ? `Great progress! You've completed ${completedToday} ${completedToday === 1 ? 'task' : 'tasks'} today.`
              : "Ready to tackle your first task of the day?"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
