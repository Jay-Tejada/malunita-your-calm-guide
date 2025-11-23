import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/hooks/useTasks";
import { Circle, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "sonner";

interface FutureViewProps {
  tasks: Task[];
}

export const FutureView = ({ tasks }: FutureViewProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { updateTask } = useTasks();
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const now = new Date();

  const handleComplete = async (task: Task) => {
    setCompletingTaskId(task.id);
    
    await updateTask({
      id: task.id,
      updates: { completed: true, completed_at: new Date().toISOString() },
    });

    toast.success("Task completed!", {
      description: "✨ Future task transformed into a star",
    });

    setTimeout(() => {
      setCompletingTaskId(null);
      setSelectedTask(null);
    }, 1000);
  };

  return (
    <>
      <div className="relative h-full w-full">
        {tasks.map((task, idx) => {
          const targetDate = new Date(task.focus_date || task.reminder_time || '');
          const daysUntil = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const maxDays = 60;
          const isOverdue = targetDate < now && !task.completed;

          const position = {
            x: 10 + (daysUntil / maxDays) * 70,
            y: 20 + (idx % 5) * 15,
          };

          const isCompleting = completingTaskId === task.id;

          return (
            <AnimatePresence key={task.id}>
              <motion.div
                className="absolute cursor-pointer group"
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                initial={{ opacity: 0, scale: 0, y: -20 }}
                animate={
                  isCompleting
                    ? {
                        opacity: [1, 1, 0],
                        scale: [1, 1.5, 0.5],
                        rotate: [0, 180, 360],
                        y: [0, -30, -50],
                      }
                    : {
                        opacity: isOverdue ? [0.7, 1, 0.7] : 1,
                        scale: 1,
                        y: 0,
                      }
                }
                transition={
                  isCompleting
                    ? { duration: 1 }
                    : isOverdue
                    ? { duration: 1.5, repeat: Infinity }
                    : {}
                }
                whileHover={{ scale: 1.4 }}
                onClick={() => setSelectedTask(task)}
              >
                {isOverdue ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-destructive fill-destructive/50" />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-destructive/20 blur-md"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5 text-primary fill-primary/30" />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/10 blur-sm"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: idx * 0.1,
                      }}
                    />
                  </>
                )}
                <div className="absolute left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap border border-border z-10">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-muted-foreground text-[10px]">
                    {format(targetDate, 'MMM d, yyyy')}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          );
        })}

        {/* Floating ambient orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`ambient-${i}`}
            className="absolute w-2 h-2 rounded-full bg-primary/10"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
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
              {selectedTask?.focus_date && (
                <span>
                  Scheduled: {format(new Date(selectedTask.focus_date), 'MMM d, yyyy')}
                </span>
              )}
              {selectedTask?.reminder_time && (
                <span>
                  Reminder: {format(new Date(selectedTask.reminder_time), 'MMM d, yyyy h:mm a')}
                </span>
              )}
            </div>
            {selectedTask && new Date(selectedTask.focus_date || selectedTask.reminder_time || '') < new Date() && (
              <div className="text-destructive text-xs font-medium">⚠️ Overdue</div>
            )}
          </div>
          <DialogFooter>
            {selectedTask && !selectedTask.completed && (
              <Button onClick={() => handleComplete(selectedTask)}>
                Complete Task
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
