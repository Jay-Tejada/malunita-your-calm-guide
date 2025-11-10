import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  time?: string;
  context?: string;
  completed?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
}

export const TaskCard = ({ title, time, context, completed, onToggle, onEdit }: TaskCardProps) => {
  return (
    <div
      onClick={onEdit}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
        completed
          ? "bg-success/10 border-success/30 hover:border-success/50"
          : "bg-card border-secondary hover:border-accent hover:shadow-md"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
      >
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "text-sm font-normal transition-all",
            completed ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {title}
        </h3>
        {(time || context) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {time}
              </span>
            )}
            {context && <span className="text-muted-foreground/70">• {context}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
