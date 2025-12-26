import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Task } from '@/hooks/useTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/useIsMobile';
import { DualLayerText } from '@/components/shared/DualLayerText';

interface VirtualizedTaskListProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  onLongPress?: (task: Task) => void;
  renderTask?: (task: Task, index: number) => React.ReactNode;
  estimateSize?: number;
  className?: string;
}

// Memoized task row with dual-layer display
const TaskRow = memo(({ 
  task, 
  onToggleComplete, 
  onTaskClick,
  style 
}: { 
  task: Task; 
  onToggleComplete: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  style: React.CSSProperties;
}) => (
  <div 
    style={style}
    className="flex items-start gap-3 px-2 py-3 border-b border-foreground/5 cursor-pointer hover:bg-foreground/[0.02] transition-colors"
    onClick={() => onTaskClick?.(task)}
  >
    <Checkbox
      checked={task.completed}
      onClick={(e) => {
        e.stopPropagation();
        onToggleComplete(task);
      }}
      className="flex-shrink-0 mt-0.5"
    />
    <DualLayerText 
      task={task} 
      isCompleting={task.completed || false}
    />
  </div>
));

TaskRow.displayName = 'TaskRow';

/**
 * Virtualized task list for rendering large lists efficiently.
 * Only renders visible items + a small overscan buffer.
 * Use for lists with 20+ items.
 */
export const VirtualizedTaskList = ({
  tasks,
  onToggleComplete,
  onTaskClick,
  onLongPress,
  renderTask,
  estimateSize = 52,
  className = '',
}: VirtualizedTaskListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: isMobile ? 3 : 5, // Less overscan on mobile for performance
  });

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/40 text-sm">No tasks</p>
      </div>
    );
  }

  // For small lists, render normally (no virtualization overhead)
  if (tasks.length < 20) {
    return (
      <div className={className}>
        {tasks.map((task, index) => 
          renderTask ? renderTask(task, index) : (
            <TaskRow
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onTaskClick={onTaskClick}
              style={{}}
            />
          )
        )}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ maxHeight: '60vh' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const task = tasks[virtualRow.index];
          return renderTask ? (
            <div
              key={task.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderTask(task, virtualRow.index)}
            </div>
          ) : (
            <TaskRow
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onTaskClick={onTaskClick}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedTaskList;
