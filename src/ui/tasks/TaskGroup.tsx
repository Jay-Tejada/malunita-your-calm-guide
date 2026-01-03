// src/ui/tasks/TaskGroup.tsx

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
        <span className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        {count !== undefined && (
          <span className="font-mono text-xs text-muted-foreground/60">
            {count}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
