import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedTaskListProps {
  tasks: any[];
  renderTask: (task: any, index: number) => React.ReactNode;
  estimatedItemHeight?: number;
  className?: string;
}

const VirtualizedTaskList = ({ 
  tasks, 
  renderTask,
  estimatedItemHeight = 60,
  className = '',
}: VirtualizedTaskListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan: 5, // Render 5 extra items above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();

  // For small lists, don't virtualize (overhead not worth it)
  if (tasks.length < 20) {
    return (
      <div className={`divide-y divide-foreground/5 ${className}`}>
        {tasks.map((task, index) => renderTask(task, index))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`h-full overflow-auto ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderTask(tasks[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedTaskList;
