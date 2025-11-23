import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Checkbox } from "@/components/ui/checkbox";

interface TasksPanelProps {
  onClose: () => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({ onClose }) => {
  const { tasks, updateTask } = useTasks();
  const [billboardText, setBillboardText] = useState("What's the first task on your mind?");

  // Rotating billboard suggestions
  const suggestions = [
    "What's the first task on your mind?",
    "Need to capture something quickly?",
    "What small win can you tackle today?",
    "Ready to check something off?",
    "What's weighing on you right now?",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * suggestions.length);
      setBillboardText(suggestions[randomIndex]);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const todayTasks = tasks?.filter(t => !t.completed && t.is_focus) || [];
  const upcomingTasks = tasks?.filter(t => !t.completed && !t.is_focus && t.has_reminder) || [];
  const capturedTasks = tasks?.filter(t => !t.completed && !t.is_focus && !t.has_reminder) || [];

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed left-0 top-0 h-full w-[70%] md:w-[500px] bg-card border-r border-border/30 shadow-2xl z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-lg font-medium text-foreground">Tasks</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Rotating Billboard */}
        <motion.div
          key={billboardText}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-amber-50 border border-amber-200/50 rounded-lg p-4 flex items-start gap-3"
        >
          <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="font-mono text-sm text-foreground/70">{billboardText}</p>
        </motion.div>
      </div>

      {/* Task Sections */}
      <div className="p-6 space-y-8">
        {/* Today Section */}
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground/80 mb-3">Today</h3>
          {todayTasks.length > 0 ? (
            <div className="space-y-2">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/30">
                  <Checkbox 
                    checked={task.completed}
                    onCheckedChange={() => {
                      updateTask({ 
                        id: task.id, 
                        updates: { 
                          completed: !task.completed,
                          completed_at: !task.completed ? new Date().toISOString() : null
                        } 
                      });
                    }}
                  />
                  <span className="text-sm font-mono text-foreground flex-1">{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground-soft font-mono">No tasks for today</p>
          )}
        </div>

        {/* Upcoming Section */}
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground/80 mb-3">Upcoming</h3>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/30">
                  <Checkbox 
                    checked={task.completed}
                    onCheckedChange={() => {
                      updateTask({ 
                        id: task.id, 
                        updates: { 
                          completed: !task.completed,
                          completed_at: !task.completed ? new Date().toISOString() : null
                        } 
                      });
                    }}
                  />
                  <span className="text-sm font-mono text-foreground flex-1">{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground-soft font-mono">No upcoming tasks</p>
          )}
        </div>

        {/* Captured Section */}
        <div>
          <h3 className="font-mono text-sm font-medium text-foreground/80 mb-3">Captured</h3>
          {capturedTasks.length > 0 ? (
            <div className="space-y-2">
              {capturedTasks.slice(0, 10).map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/30">
                  <Checkbox 
                    checked={task.completed}
                    onCheckedChange={() => {
                      updateTask({ 
                        id: task.id, 
                        updates: { 
                          completed: !task.completed,
                          completed_at: !task.completed ? new Date().toISOString() : null
                        } 
                      });
                    }}
                  />
                  <span className="text-sm font-mono text-foreground flex-1">{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground-soft font-mono">No captured tasks</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
