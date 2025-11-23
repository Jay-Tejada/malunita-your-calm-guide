import { motion, AnimatePresence } from "framer-motion";
import { 
  Inbox, 
  Calendar, 
  CalendarDays, 
  Briefcase, 
  Home, 
  Dumbbell, 
  Target, 
  TrendingUp, 
  Network, 
  BookOpen,
  Sparkles,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
}

interface LeftDrawerProps {
  isOpen: boolean;
  activeView: string;
  onSelectView: (view: string) => void;
}

const navigationItems: DrawerItem[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "today", label: "Today", icon: Calendar },
  { id: "upcoming", label: "Upcoming", icon: CalendarDays },
];

const spaceItems: DrawerItem[] = [
  { id: "work", label: "Work", icon: Briefcase, section: "Spaces" },
  { id: "home", label: "Home", icon: Home, section: "Spaces" },
  { id: "gym", label: "Gym", icon: Dumbbell, section: "Spaces" },
];

const projectItems: DrawerItem[] = [
  { id: "goals", label: "Goals", icon: Target, section: "Projects" },
  { id: "insights", label: "Insights", icon: TrendingUp, section: "Projects" },
  { id: "clusters", label: "Clusters", icon: Network, section: "Projects" },
  { id: "journal", label: "Journal", icon: BookOpen, section: "Projects" },
];

const bottomItems: DrawerItem[] = [
  { id: "companion", label: "Companion", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings },
];

export const LeftDrawer = ({ isOpen, activeView, onSelectView }: LeftDrawerProps) => {
  const renderSection = (items: DrawerItem[], showHeader?: string) => (
    <div className="space-y-1">
      {showHeader && (
        <div className="px-4 py-2 text-xs font-mono text-foreground/40 uppercase tracking-wider">
          {showHeader}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onSelectView(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-colors",
              "hover:bg-foreground/5",
              activeView === item.id && "bg-foreground/8 text-primary font-medium"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );

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
            onClick={() => onSelectView(activeView)}
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
              {/* Main Navigation */}
              <div className="flex-1 overflow-y-auto space-y-6">
                {renderSection(navigationItems)}
                {renderSection(spaceItems, "Spaces")}
                {renderSection(projectItems, "Projects")}
              </div>

              {/* Bottom Items */}
              <div className="border-t border-border/30 pt-4">
                {renderSection(bottomItems)}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
