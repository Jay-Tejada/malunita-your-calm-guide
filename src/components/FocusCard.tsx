import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, MoreHorizontal } from "lucide-react";
import { Task } from "@/hooks/useTasks";

interface FocusCardProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onRemoveFromFocus: () => void;
}

export const FocusCard = ({ task, onToggle, onDelete, onRemoveFromFocus }: FocusCardProps) => {
  return (
    <Card className="p-6 transition-calm hover:shadow-lg border-2 hover:border-accent">
      <div className="flex items-start gap-4">
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          className="mt-1 h-6 w-6 rounded-full data-[state=checked]:bg-success data-[state=checked]:border-success transition-calm"
        />
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-normal mb-1 transition-calm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </h3>
          {task.context && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{task.context}</p>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemoveFromFocus}
            className="text-muted-foreground hover:text-foreground transition-calm"
            title="Remove from focus"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-calm"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
