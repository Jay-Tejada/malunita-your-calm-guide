import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface SortableTaskItemProps {
  task: Task;
  onToggleTask: (taskId: string) => void;
}

export const SortableTaskItem = ({ task, onToggleTask }: SortableTaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 py-2 group relative ${
        isDragging 
          ? 'opacity-50 bg-primary/5 rounded-md shadow-sm z-10' 
          : 'hover:bg-foreground/[0.02]'
      }`}
    >
      {/* Drop indicator line */}
      {!isDragging && (
        <div className="absolute -top-px left-0 right-0 h-0.5 bg-primary/50 opacity-0 transition-opacity pointer-events-none" />
      )}
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 -ml-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-foreground/50 transition-opacity touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onToggleTask(task.id)}
        className="w-4 h-4 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0 mt-0.5"
      />
      <span className="font-mono text-sm text-foreground/70">{task.title}</span>
    </div>
  );
};
