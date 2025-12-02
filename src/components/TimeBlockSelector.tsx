import { Target, MessageSquare, ClipboardList, Zap } from 'lucide-react';
import { TaskType } from '@/utils/taskCategorizer';

interface TimeBlockSelectorProps {
  onSelectBlock: (type: TaskType | 'all') => void;
  activeBlock: TaskType | 'all';
  taskCounts: Record<TaskType, number>;
}

const TimeBlockSelector = ({ onSelectBlock, activeBlock, taskCounts }: TimeBlockSelectorProps) => {
  const blocks = [
    { type: 'all' as const, label: 'All', icon: null },
    { type: 'deep_work' as const, label: 'Focus', icon: Target },
    { type: 'communication' as const, label: 'Comms', icon: MessageSquare },
    { type: 'admin' as const, label: 'Admin', icon: ClipboardList },
    { type: 'quick_task' as const, label: 'Quick', icon: Zap },
  ];

  return (
    <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
      {blocks.map(({ type, label, icon: Icon }) => {
        const count = type === 'all' 
          ? Object.values(taskCounts).reduce((a, b) => a + b, 0)
          : taskCounts[type] || 0;
          
        if (type !== 'all' && count === 0) return null;
        
        return (
          <button
            key={type}
            onClick={() => onSelectBlock(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
              activeBlock === type
                ? 'bg-foreground/10 text-foreground/70'
                : 'text-foreground/40 hover:bg-foreground/5'
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {label}
            {count > 0 && (
              <span className="text-foreground/30">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TimeBlockSelector;
