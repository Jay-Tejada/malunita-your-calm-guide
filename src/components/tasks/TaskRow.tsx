import { memo } from "react";
import { Clock, Check, Circle, ChevronRight, Star, Lightbulb, MoreVertical, Edit2, Trash2, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskRowProps {
  id: string;
  title: string;
  completed?: boolean;
  category?: string | null;
  onClick?: () => void;
  isPrimaryFocus?: boolean;
  onPlanThis?: (title: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveToToday?: () => void;
}

export const TaskRow = memo(({ id, title, completed, category, onClick, isPrimaryFocus, onPlanThis, onEdit, onDelete, onMoveToToday }: TaskRowProps) => {
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

      {/* Overflow Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onEdit && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          
          {onPlanThis && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onPlanThis(title);
              }}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Plan This
            </DropdownMenuItem>
          )}

          {onMoveToToday && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onMoveToToday();
              }}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Move to Today
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              // Toggle star/focus
            }}
          >
            <Star className={cn("w-4 h-4 mr-2", isPrimaryFocus && "fill-primary text-primary")} />
            {isPrimaryFocus ? "Unstar" : "Star"}
          </DropdownMenuItem>

          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this task?')) {
                    onDelete();
                  }
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </button>
  );
});

TaskRow.displayName = 'TaskRow';
