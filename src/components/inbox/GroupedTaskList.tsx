import { memo } from 'react';
import { Task } from '@/hooks/useTasks';
import { TaskType, getTaskTypeLabel, getTaskTypeIcon } from '@/utils/taskCategorizer';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GroupedTaskListProps {
  groups: [TaskType, Task[]][];
  onToggleComplete: (task: Task) => void;
  onMoveToToday: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const TaskRow = memo(({ 
  task, 
  onToggleComplete, 
  onMoveToToday,
  onDelete 
}: { 
  task: Task; 
  onToggleComplete: (task: Task) => void;
  onMoveToToday: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}) => (
  <div className="flex items-center gap-3 py-2.5 px-3 group hover:bg-foreground/[0.02] rounded-lg transition-colors">
    <Checkbox
      checked={task.completed || false}
      onCheckedChange={() => onToggleComplete(task)}
      className="flex-shrink-0"
    />
    <span className="font-mono text-sm flex-1 text-foreground/80">
      {task.title}
    </span>
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-foreground/30 hover:text-foreground/60"
        onClick={() => onMoveToToday(task.id)}
        title="Move to Today"
      >
        <ArrowRight className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-foreground/30 hover:text-destructive"
        onClick={() => onDelete(task.id)}
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
));

TaskRow.displayName = 'TaskRow';

export const GroupedTaskList = ({ 
  groups, 
  onToggleComplete, 
  onMoveToToday,
  onDelete 
}: GroupedTaskListProps) => {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/40 text-sm">No tasks in inbox</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([type, tasks]) => (
        <div key={type} className="space-y-1">
          {/* Group Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-foreground/10">
            <span className="text-base">{getTaskTypeIcon(type)}</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground/50">
              {getTaskTypeLabel(type)}
            </span>
            <span className="text-[11px] text-foreground/30">
              ({tasks.length})
            </span>
          </div>
          
          {/* Tasks */}
          <div className="space-y-0.5">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onMoveToToday={onMoveToToday}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupedTaskList;
