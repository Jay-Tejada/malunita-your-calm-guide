// src/ui/tasks/TaskRow.tsx

import { motion } from "framer-motion";
import { colors, typography } from "@/ui/tokens";
import { haptics } from "@/hooks/useHaptics";

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
      className="flex items-start gap-4 px-5 py-4 cursor-pointer"
      style={{
        minHeight: 64,
        borderBottom: `1px solid ${colors.border.subtle}`,
      }}
      whileTap={{ backgroundColor: colors.bg.elevated }}
      onClick={onPress}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isCompleted) {
            haptics.success(); // Satisfying click when completing
          } else {
            haptics.lightTap(); // Light tap when uncompleting
          }
          onToggleComplete?.();
        }}
        className="flex-shrink-0 mt-1"
      >
        <div
          className="rounded-full flex items-center justify-center transition-all"
          style={{
            width: 22,
            height: 22,
            border: `1.5px solid ${isCompleted ? colors.accent.primary : colors.border.strong}`,
            backgroundColor: isCompleted ? colors.accent.primary : "transparent",
          }}
        >
          {isCompleted && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke={colors.bg.base}
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
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.bodyM.size,
            lineHeight: typography.bodyM.lineHeight,
            color: isCompleted ? colors.text.muted : colors.text.primary,
            textDecoration: isCompleted ? "line-through" : "none",
          }}
        >
          {title}
        </p>
        
        {metadata && (
          <p
            style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.bodyS.size,
              lineHeight: typography.bodyS.lineHeight,
              color: colors.text.secondary,
              marginTop: 4,
            }}
          >
            {metadata}
          </p>
        )}
      </div>
    </motion.div>
  );
}
