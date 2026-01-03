// src/ui/sidebar/SidebarSection.tsx

interface SidebarSectionProps {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}

export function SidebarSection({ title, action, children }: SidebarSectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
