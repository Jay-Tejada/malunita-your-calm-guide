import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RotatingBillboard } from "./RotatingBillboard";
import { useNavigate } from "react-router-dom";

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TasksPanel = ({ isOpen, onClose }: TasksPanelProps) => {
  const { tasks, updateTask } = useTasks();
  const navigate = useNavigate();

  const todayTasks = tasks?.filter(t => !t.completed && t.is_focus) || [];
  const upcomingTasks = tasks?.filter(t => !t.completed && !t.is_focus && t.has_reminder) || [];
  const inboxTasks = tasks?.filter(t => !t.completed && !t.is_focus && !t.has_reminder) || [];

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    await updateTask({
      id: taskId,
      updates: {
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-0 top-0 bottom-0 w-full md:w-[70%] bg-background z-50 overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
              <h2 
                className="text-xl font-semibold text-foreground"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Tasks Universe
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Billboard */}
            <div className="p-4">
              <RotatingBillboard />
            </div>

            {/* Task Groups */}
            <div className="p-4 space-y-6">
              {/* Today */}
              <TaskGroup
                title="Today"
                tasks={todayTasks}
                onToggle={handleToggleTask}
                onViewAll={() => {
                  navigate("/inbox");
                  onClose();
                }}
              />

              {/* Upcoming */}
              <TaskGroup
                title="Upcoming"
                tasks={upcomingTasks}
                onToggle={handleToggleTask}
                onViewAll={() => {
                  navigate("/reminders");
                  onClose();
                }}
              />

              {/* Inbox */}
              <TaskGroup
                title="Inbox"
                tasks={inboxTasks}
                onToggle={handleToggleTask}
                onViewAll={() => {
                  navigate("/inbox");
                  onClose();
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface TaskGroupProps {
  title: string;
  tasks: any[];
  onToggle: (id: string, completed: boolean) => void;
  onViewAll: () => void;
}

const TaskGroup = ({ title, tasks, onToggle, onViewAll }: TaskGroupProps) => {
  const displayTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 
          className="text-sm font-medium text-foreground-soft"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {title} ({tasks.length})
        </h3>
        {tasks.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-xs text-foreground-soft hover:text-foreground transition-colors"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            View all
          </button>
        )}
      </div>

      {displayTasks.length === 0 ? (
        <p className="text-sm text-foreground-soft/70 italic py-2">No tasks</p>
      ) : (
        <div className="space-y-1">
          {displayTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task.id, task.completed)}
                className="shrink-0"
              />
              <span 
                className="text-sm text-foreground flex-1 line-clamp-1"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {task.title}
              </span>
              {task.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground-soft shrink-0">
                  {task.category}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
