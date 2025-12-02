import { useState, memo } from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const TaskRow = memo(({ task, onComplete, onDelete, onEdit }: TaskRowProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    
    // Wait for animation
    setTimeout(async () => {
      await onComplete(task.id);
      setIsCompleting(false);
    }, 400);
  };

  return (
    <div
      className={`flex items-start py-3 group ${isCompleting ? 'task-completing' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left: Checkbox */}
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className="relative flex items-center justify-center w-5 h-5 border border-foreground/20 rounded-full bg-transparent hover:border-foreground/40 transition-colors flex-shrink-0"
        aria-label="Complete task"
      >
        {isCompleting && (
          <Check className="w-3 h-3 text-foreground/60 animate-in fade-in zoom-in duration-200" />
        )}
      </button>

      {/* Middle: Task text */}
      <div className="flex-1 ml-3">
        <p className="font-mono text-sm text-foreground/80">
          {task.title}
        </p>
      </div>

      {/* Right: Overflow menu (visible on hover) */}
      <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-foreground/20 hover:text-foreground/40 transition-colors p-1"
              aria-label="Task options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-background shadow-sm rounded-lg border border-foreground/10 z-50"
          >
            <DropdownMenuItem
              onClick={() => onEdit(task.id)}
              className="font-mono text-sm text-foreground/80 cursor-pointer hover:bg-foreground/5"
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="font-mono text-sm text-foreground/80 cursor-pointer hover:bg-foreground/5"
            >
              Move
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="font-mono text-sm text-foreground/80 cursor-pointer hover:bg-foreground/5"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

TaskRow.displayName = 'TaskRow';
