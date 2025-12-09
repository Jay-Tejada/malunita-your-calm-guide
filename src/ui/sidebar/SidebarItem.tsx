// src/ui/sidebar/SidebarItem.tsx

import { colors, typography } from "@/ui/tokens";

interface SidebarItemProps {
  icon?: string;
  label: string;
  path: string;
  active?: boolean;
  badge?: number;
  onNavigate: (path: string) => void;
}

export function SidebarItem({ icon, label, path, active, badge, onNavigate }: SidebarItemProps) {
  return (
    <button
      onClick={() => onNavigate(path)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
      style={{
        backgroundColor: active ? colors.bg.surface : "transparent",
        borderLeft: active ? `2px solid ${colors.accent.primary}` : "2px solid transparent",
      }}
    >
      {icon && <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>}
      <span
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.bodyS.size,
          color: active ? colors.text.primary : colors.text.secondary,
          flex: 1,
          textAlign: "left",
        }}
      >
        {label}
      </span>
      {badge !== undefined && (
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.labelS.size,
            color: colors.text.muted,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
