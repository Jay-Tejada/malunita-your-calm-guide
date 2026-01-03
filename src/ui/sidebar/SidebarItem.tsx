// src/ui/sidebar/SidebarItem.tsx

import { cn } from "@/lib/utils";

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
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
        active 
          ? "bg-accent/10 border-l-2 border-primary" 
          : "border-l-2 border-transparent hover:bg-accent/5"
      )}
    >
      {icon && <span className="text-sm w-5 text-center">{icon}</span>}
      <span
        className={cn(
          "font-mono text-sm flex-1 text-left",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      {badge !== undefined && (
        <span className="font-mono text-xs text-muted-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}
