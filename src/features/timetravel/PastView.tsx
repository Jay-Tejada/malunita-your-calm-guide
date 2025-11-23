import { motion } from "framer-motion";
import { Task } from "@/hooks/useTasks";
import { Star } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface PastViewProps {
  tasks: Task[];
}

export const PastView = ({ tasks }: PastViewProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Group completed tasks into constellations (by week)
  const completedByWeek = tasks
    .filter(t => t.completed)
    .reduce((acc, task) => {
      const weekKey = format(new Date(task.completed_at || task.created_at), 'yyyy-ww');
      if (!acc[weekKey]) acc[weekKey] = [];
      acc[weekKey].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

  const incompleteTasks = tasks.filter(t => !t.completed);

  return (
    <>
      <div className="relative h-full w-full">
        {/* Dim stars for incomplete past tasks */}
        {incompleteTasks.map((task, idx) => {
          const age = Date.now() - new Date(task.created_at).getTime();
          const maxAge = 90 * 24 * 60 * 60 * 1000;
          const position = {
            x: 20 + ((maxAge - age) / maxAge) * 70,
            y: 20 + (idx % 5) * 15,
          };

          return (
            <motion.div
              key={task.id}
              className="absolute cursor-pointer group"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1 }}
              whileHover={{ opacity: 0.8, scale: 1.3 }}
              onClick={() => setSelectedTask(task)}
            >
              <Star className="w-3 h-3 text-muted-foreground/60 fill-muted-foreground/30" />
              {/* Trail */}
              <motion.div
                className="absolute -left-8 top-1/2 w-8 h-px bg-gradient-to-r from-transparent to-muted-foreground/20"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: idx * 0.05 }}
              />
              <div className="absolute left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap border border-border">
                {task.title}
              </div>
            </motion.div>
          );
        })}

        {/* Constellations for completed tasks */}
        {Object.entries(completedByWeek).map(([weekKey, weekTasks], weekIdx) => {
          const baseX = 25 + weekIdx * 15;
          const baseY = 50;

          return (
            <motion.g key={weekKey}>
              {weekTasks.map((task, idx) => {
                const angle = (idx / weekTasks.length) * Math.PI * 2;
                const radius = 8;
                const x = baseX + Math.cos(angle) * radius;
                const y = baseY + Math.sin(angle) * radius;

                return (
                  <motion.div
                    key={task.id}
                    className="absolute cursor-pointer group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: weekIdx * 0.2 + idx * 0.05 }}
                    whileHover={{ scale: 1.5 }}
                    onClick={() => setSelectedTask(task)}
                  >
                    <Star className="w-4 h-4 text-green-500/80 fill-green-500/50" />
                    {/* Constellation lines */}
                    {idx < weekTasks.length - 1 && (
                      <motion.div
                        className="absolute left-2 top-2 w-12 h-px bg-green-500/20"
                        style={{
                          transform: `rotate(${(angle * 180) / Math.PI}deg)`,
                          transformOrigin: 'left center',
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: weekIdx * 0.2 + idx * 0.05 + 0.1 }}
                      />
                    )}
                    <div className="absolute left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap border border-border">
                      {task.title}
                    </div>
                  </motion.div>
                );
              })}
            </motion.g>
          );
        })}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {selectedTask?.context && (
              <p className="text-muted-foreground">{selectedTask.context}</p>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Created: {selectedTask && format(new Date(selectedTask.created_at), 'MMM d, yyyy')}</span>
              {selectedTask?.completed && selectedTask.completed_at && (
                <span className="text-green-600">
                  Completed: {format(new Date(selectedTask.completed_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
