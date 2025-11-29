import { Clock, Check, Circle, ChevronRight, Star, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  id: string;
  title: string;
  completed?: boolean;
  category?: string | null;
  onClick?: () => void;
  isPrimaryFocus?: boolean;
  onPlanThis?: (title: string) => void;
}

export const TaskRow = ({ id, title, completed, category, onClick, isPrimaryFocus, onPlanThis }: TaskRowProps) => {
  const getStatusIcon = () => {
    if (completed) {
      return <Check className="w-3 h-3 text-primary/70" />;
    }
    if (isPrimaryFocus) {
      return <Star className="w-3 h-3 text-primary fill-primary" />;
    }
    if (category === "in-review") {
      return <Clock className="w-3 h-3 text-foreground/40" />;
    }
    return <Circle className="w-2 h-2 text-foreground/30" />;
  };

  return (
    <button
      data-task-id={id}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md group",
        "hover:bg-background/40 transition-all duration-200",
        "text-left",
        "hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]",
        isPrimaryFocus && "bg-primary/5 border border-primary/20"
      )}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
        {getStatusIcon()}
      </div>

      {/* Task title */}
      <div className={cn(
        "flex-1 font-mono text-sm",
        completed ? "text-foreground/50 line-through" : "text-foreground/90",
        isPrimaryFocus && "font-semibold text-primary"
      )}>
        {title}
        {isPrimaryFocus && (
          <span className="ml-2 text-[10px] font-medium text-primary/70 uppercase tracking-wide">
            Primary Focus
          </span>
        )}
      </div>

      {/* Plan This Button */}
      {onPlanThis && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlanThis(title);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Plan This"
        >
          <Lightbulb className="w-4 h-4 text-muted-foreground hover:text-accent" />
        </button>
      )}

      {/* Chevron */}
      <ChevronRight className="w-3 h-3 text-foreground/20 group-hover:text-foreground/40 transition-colors" />
    </button>
  );
};
