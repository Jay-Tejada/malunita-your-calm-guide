// src/ui/tasks/TaskRow.tsx

import { motion } from "framer-motion";
import { haptics } from "@/hooks/useHaptics";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  title: string;
  isCompleted?: boolean;
  metadata?: string;
  onToggleComplete?: () => void;
  onPress?: () => void;
}

export function TaskRow({
  title,
  isCompleted = false,
  metadata,
  onToggleComplete,
  onPress,
}: TaskRowProps) {
  return (
    <motion.div
      className={cn(
        "flex gap-4 px-5 py-4 cursor-pointer bg-card hover:bg-accent/5 transition-colors border-b border-border",
        metadata ? "items-start" : "items-center"
      )}
      style={{ minHeight: 64 }}
      onClick={onPress}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isCompleted) {
            haptics.success();
          } else {
            haptics.lightTap();
          }
          onToggleComplete?.();
        }}
        className={cn("flex-shrink-0", metadata && "mt-1")}
      >
        <div
          className={cn(
            "w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all border-[1.5px]",
            isCompleted 
              ? "bg-primary border-primary" 
              : "bg-transparent border-border hover:border-primary/50"
          )}
        >
          {isCompleted && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                className="text-primary-foreground"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-mono text-base leading-relaxed",
            isCompleted ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {title}
        </p>
        
        {metadata && (
          <p className="font-mono text-sm leading-tight text-muted-foreground mt-1">
            {metadata}
          </p>
        )}
      </div>
    </motion.div>
  );
}
