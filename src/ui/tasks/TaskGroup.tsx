// src/ui/tasks/TaskGroup.tsx

import { colors, typography } from "@/ui/tokens";

interface TaskGroupProps {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function TaskGroup({ title, count, icon, children }: TaskGroupProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 px-5 py-3">
        {icon}
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.labelS.size,
            fontWeight: typography.labelS.weight,
            color: colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </span>
        {count !== undefined && (
          <span style={{ color: colors.text.muted, fontSize: typography.labelS.size }}>
            {count}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
