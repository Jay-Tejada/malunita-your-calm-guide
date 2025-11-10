import { CheckCircle2, Circle, Clock, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  id: string;
  title: string;
  time?: string;
  context?: string;
  completed?: boolean;
  onToggle?: () => void;
  onEdit?: () => void;
}

export const TaskCard = ({ id, title, time, context, completed, onToggle, onEdit }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300",
        completed
          ? "bg-success/10 border-success/30 hover:border-success/50"
          : "bg-card border-secondary hover:border-accent hover:shadow-md",
        isDragging && "opacity-50 shadow-xl scale-105"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
      </button>

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
      <div 
        onClick={onEdit}
        className="flex-1 min-w-0 cursor-pointer"
      >
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
