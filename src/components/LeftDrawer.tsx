import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListTodo, ChevronLeft, Circle, Check } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { hapticLight, hapticMedium, hapticSuccess, hapticSwipe } from "@/utils/haptics";

type DrawerMode = "root" | "inbox" | "projects" | "work" | "home" | "gym" | "goals";

interface LeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const categories = [
  { id: "inbox", label: "Inbox", filter: (task: any) => !task.category || task.category === "inbox" },
  { id: "projects", label: "Projects", filter: (task: any) => task.category === "project" },
  { id: "work", label: "Work", filter: (task: any) => task.category === "work" },
  { id: "home", label: "Home", filter: (task: any) => task.category === "home" },
  { id: "gym", label: "Gym", filter: (task: any) => task.category === "gym" },
  { id: "goals", label: "Goals", filter: (task: any) => task.goal_aligned === true },
];

export const LeftDrawer = ({ isOpen, onClose, onNavigate }: LeftDrawerProps) => {
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("root");
  const { tasks, updateTask } = useTasks();

  const handleCategoryClick = (categoryId: DrawerMode) => {
    hapticLight();
    setDrawerMode(categoryId);
  };

  const handleBack = () => {
    hapticLight();
    setDrawerMode("root");
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      // Haptic feedback on toggle
      if (!completed) {
        hapticSuccess(); // Success pattern when completing
      } else {
        hapticLight(); // Light tap when uncompleting
      }
      
      await updateTask({
        id: taskId,
        updates: {
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
        }
      });
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  // Filter tasks for current category
  const getCurrentCategoryTasks = () => {
    if (drawerMode === "root") return [];
    const category = categories.find(c => c.id === drawerMode);
    if (!category) return [];
    return tasks?.filter(t => !t.completed && category.filter(t)) || [];
  };

  const categoryTasks = getCurrentCategoryTasks();
  const currentCategory = categories.find(c => c.id === drawerMode);

  // Swipe handlers
  const drawerSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isOpen) {
        hapticSwipe();
        onClose();
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  const categorySwipeHandlers = useSwipeable({
    onSwipedRight: () => {
      if (drawerMode !== "root") {
        hapticSwipe();
        handleBack();
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

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
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-[14px] z-40"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              {...drawerSwipeHandlers}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className={cn(
                "fixed left-0 top-0 bottom-0 z-50",
                "w-full md:w-[380px]",
                "overflow-y-auto",
                "bg-background shadow-lg"
              )}
            >
              <AnimatePresence mode="wait">
                {drawerMode === "root" ? (
                  <motion.div
                    key="root"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.14 }}
                    className="h-full flex flex-col p-6 md:p-8 pt-16"
                  >
                    {/* Prompt Card */}
                    <div className="w-full rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 p-4 flex items-center gap-3 mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 flex-shrink-0" />
                      <p className="font-mono text-[15px] text-foreground/90">
                        What matters most today?
                      </p>
                    </div>

                    {/* Add New Task Button */}
                    <button
                      onClick={() => {
                        hapticMedium();
                        onNavigate("/");
                        onClose();
                      }}
                      className="w-full h-14 rounded-full bg-[#111111] hover:bg-[#1a1a1a] text-white font-mono text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 mb-5"
                    >
                      <Plus className="w-4 h-4" />
                      Add new task
                    </button>

                    {/* View All Tasks Button */}
                    <button
                      onClick={() => {
                        hapticMedium();
                        onNavigate("/");
                        onClose();
                      }}
                      className="w-full h-14 rounded-full bg-transparent border border-border hover:border-foreground/30 hover:bg-muted/20 text-foreground font-mono text-[15px] flex items-center justify-center gap-2 transition-all mb-8"
                    >
                      <ListTodo className="w-4 h-4" />
                      View All Tasks
                    </button>

                    {/* Category Links */}
                    <div className="flex flex-col gap-1">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryClick(category.id as DrawerMode)}
                          className="text-left py-2 px-3 font-mono text-[14px] text-foreground/60 hover:text-foreground/90 hover:bg-muted/30 rounded-md transition-colors"
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1" />
                  </motion.div>
                ) : (
                  <motion.div
                    {...categorySwipeHandlers}
                    key={drawerMode}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.14 }}
                    className="h-full flex flex-col p-6 md:p-8 pt-16"
                  >
                    {/* Back Button */}
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 mb-6 text-foreground/70 hover:text-foreground font-mono text-[14px] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>

                    {/* Category Title */}
                    <h2 className="font-mono text-[18px] font-medium text-foreground mb-6">
                      {currentCategory?.label}
                    </h2>

                    {/* Task List */}
                    <div className="flex-1 space-y-2">
                      {categoryTasks.length === 0 ? (
                        <p className="font-mono text-[14px] text-foreground/40 text-center py-8">
                          No tasks in {currentCategory?.label}
                        </p>
                      ) : (
                        categoryTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 py-2.5 px-3 hover:bg-muted/20 rounded-md transition-colors group"
                          >
                            <button
                              onClick={() => handleTaskToggle(task.id, task.completed || false)}
                              className="flex-shrink-0 w-5 h-5 rounded border border-foreground/20 hover:border-foreground/40 flex items-center justify-center mt-0.5 transition-colors"
                            >
                              {task.completed && <Check className="w-3 h-3 text-foreground/60" />}
                              {!task.completed && <Circle className="w-2 h-2 text-foreground/20" />}
                            </button>
                            <span className={cn(
                              "flex-1 font-mono text-[14px] leading-snug",
                              task.completed ? "text-foreground/40 line-through" : "text-foreground/90"
                            )}>
                              {task.title}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
