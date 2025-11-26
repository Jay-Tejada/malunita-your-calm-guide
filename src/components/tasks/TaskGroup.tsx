import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { TaskRow } from "./TaskRow";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  completed?: boolean;
  category?: string | null;
}

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  defaultOpen?: boolean;
  onTaskClick?: (taskId: string) => void;
  onPlanThis?: (title: string) => void;
}

export const TaskGroup = ({ title, tasks, defaultOpen = true, onTaskClick, onPlanThis }: TaskGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Group header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-2 group"
      >
        <span className="font-mono text-xs uppercase tracking-wider text-foreground/50">
          {title} ({tasks.length})
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.18 }}
        >
          <ChevronDown className="w-3 h-3 text-foreground/40" />
        </motion.div>
      </button>

      {/* Divider */}
      <div className="h-px bg-foreground/5 mb-2" />

      {/* Task list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden space-y-0.5"
          >
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                id={task.id}
                title={task.title}
                completed={task.completed}
                category={task.category}
                onClick={() => onTaskClick?.(task.id)}
                onPlanThis={onPlanThis}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
