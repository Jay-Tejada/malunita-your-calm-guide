// src/ui/sidebar/SidebarSection.tsx

import { colors, typography } from "@/ui/tokens";

interface SidebarSectionProps {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}

export function SidebarSection({ title, action, children }: SidebarSectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-3 py-2">
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.labelS.size,
            fontWeight: typography.labelS.weight,
            color: colors.text.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </span>
        {action && (
          <button
            onClick={action.onClick}
            style={{ color: colors.text.muted, fontSize: 14 }}
          >
            {action.label}
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
