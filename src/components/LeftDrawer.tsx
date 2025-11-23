import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { GuidanceBillboard } from "@/components/tasks/GuidanceBillboard";
import { TaskGroup } from "@/components/tasks/TaskGroup";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";

interface LeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const LeftDrawer = ({ isOpen, onClose, onNavigate }: LeftDrawerProps) => {
  const { tasks } = useTasks();

  // Filter tasks into groups
  const topPriorities = tasks?.filter(
    (t) => !t.completed && (t.category === "high-priority" || t.is_focus)
  ) || [];

  const followUps = tasks?.filter(
    (t) => !t.completed && t.category === "follow-up"
  ) || [];

  const quickWins = tasks?.filter(
    (t) => !t.completed && t.category === "quick-win"
  ) || [];

  const today = tasks?.filter(
    (t) => !t.completed && t.focus_date === new Date().toISOString().split('T')[0]
  ) || [];

  const upcoming = tasks?.filter(
    (t) => !t.completed && t.reminder_time && new Date(t.reminder_time) > new Date()
  ) || [];

  const handleTaskClick = (taskId: string) => {
    // Navigate to task detail or open edit dialog
    console.log("Task clicked:", taskId);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-[14px] z-40"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "fixed left-0 top-0 bottom-0 z-50",
                "w-full md:w-[380px] lg:w-[420px]",
                "overflow-y-auto"
              )}
              style={{ backgroundColor: "#FAF8F3" }}
            >
              <div className="h-full flex flex-col p-6 md:p-7">
                {/* AI Guidance Banner */}
                <div className="mb-6">
                  <GuidanceBillboard />
                </div>

                {/* Add New Task Button */}
                <Button
                  onClick={() => {
                    onNavigate("/");
                    onClose();
                  }}
                  className="w-full mb-6 rounded-full shadow-sm hover:shadow-md transition-shadow font-mono text-sm"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add new task
                </Button>

                {/* Task Groups */}
                <div className="flex-1 space-y-3">
                  <TaskGroup
                    title="Top Priorities"
                    tasks={topPriorities}
                    onTaskClick={handleTaskClick}
                  />
                  
                  <TaskGroup
                    title="Follow-Ups"
                    tasks={followUps}
                    onTaskClick={handleTaskClick}
                  />
                  
                  <TaskGroup
                    title="Quick Wins"
                    tasks={quickWins}
                    onTaskClick={handleTaskClick}
                  />
                  
                  <TaskGroup
                    title="Today"
                    tasks={today}
                    onTaskClick={handleTaskClick}
                  />
                  
                  <TaskGroup
                    title="Upcoming"
                    tasks={upcoming}
                    defaultOpen={false}
                    onTaskClick={handleTaskClick}
                  />

                  {/* All Tasks Link */}
                  <button
                    onClick={() => {
                      onNavigate("/");
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-6 rounded-lg border border-foreground/10 hover:bg-background/40 transition-colors font-mono text-sm text-foreground/70"
                  >
                    <ListTodo className="w-4 h-4" />
                    View All Tasks
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
