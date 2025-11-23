import { motion, AnimatePresence } from "framer-motion";
import { 
  Inbox, 
  FolderKanban,
  Briefcase, 
  Home, 
  Dumbbell, 
  Calendar,
  TrendingUp,
  Image,
  Zap,
  Target,
  Bell,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface LeftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const drawerItems: DrawerItem[] = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "inbox", label: "Inbox", icon: Inbox, path: "/inbox" },
  { id: "projects", label: "Projects", icon: FolderKanban, path: "/" },
  { id: "work", label: "Work", icon: Briefcase, path: "/" },
  { id: "gym", label: "Gym", icon: Dumbbell, path: "/" },
  { id: "daily-session", label: "Daily Session", icon: Calendar, path: "/daily-session" },
  { id: "weekly-insights", label: "Weekly Insights", icon: TrendingUp, path: "/weekly-insights" },
  { id: "hatching-memories", label: "Hatching Memories", icon: Image, path: "/hatching-gallery" },
  { id: "tiny-task-fiesta", label: "Tiny Task Fiesta", icon: Zap, path: "/tiny-task-fiesta" },
  { id: "goals", label: "Goals", icon: Target, path: "/goals" },
  { id: "reminders", label: "Reminders", icon: Bell, path: "/reminders" },
  { id: "all-tasks", label: "All Tasks", icon: CheckSquare, path: "/" },
];

export const LeftDrawer = ({ isOpen, onClose, onNavigate }: LeftDrawerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-background/95 backdrop-blur-md border-r border-border/50 shadow-2xl z-50"
          >
            <div className="h-full flex flex-col py-8">
              <div className="flex-1 overflow-y-auto">
                {drawerItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.path);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-6 py-3 text-sm font-mono transition-colors",
                        "hover:bg-foreground/5"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
