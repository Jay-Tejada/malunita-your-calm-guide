import { motion } from "framer-motion";
import { Clock, Check, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  id: string;
  title: string;
  completed?: boolean;
  category?: string | null;
  onClick?: () => void;
}

export const TaskRow = ({ title, completed, category, onClick }: TaskRowProps) => {
  const getStatusIcon = () => {
    if (completed) {
      return <Check className="w-3 h-3 text-primary/70" />;
    }
    if (category === "in-review") {
      return <Clock className="w-3 h-3 text-foreground/40" />;
    }
    return <Circle className="w-2 h-2 text-foreground/30" />;
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md group",
        "hover:bg-background/40 transition-all duration-200",
        "text-left"
      )}
      whileHover={{ y: -1, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {getStatusIcon()}
      </div>

      {/* Task title */}
      <div className={cn(
        "flex-1 font-mono text-sm",
        completed ? "text-foreground/50 line-through" : "text-foreground/90"
      )}>
        {title}
      </div>

      {/* Chevron */}
      <ChevronRight className="w-3 h-3 text-foreground/20 group-hover:text-foreground/40 transition-colors" />
    </motion.button>
  );
};
