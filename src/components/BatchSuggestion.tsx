import { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { categorizeTask, getTaskTypeLabel, estimateMinutes, TaskType } from '@/utils/taskCategorizer';
import { Zap, MessageSquare, Target, ClipboardList, Car } from 'lucide-react';

const BatchSuggestion = ({ onStartBatch }: { onStartBatch: (type: TaskType, tasks: any[]) => void }) => {
  const { tasks } = useTasks();
  
  const groupedTasks = useMemo(() => {
    if (!tasks) return {};
    
    const incomplete = tasks.filter(t => !t.completed && t.scheduled_bucket === 'today');
    
    return incomplete.reduce((acc, task) => {
      const type = categorizeTask(task.title);
      if (!acc[type]) acc[type] = [];
      acc[type].push(task);
      return acc;
    }, {} as Record<TaskType, any[]>);
  }, [tasks]);
  
  // Find best batch opportunity (3+ tasks of same type)
  const bestBatch = useMemo(() => {
    const entries = Object.entries(groupedTasks) as [TaskType, any[]][];
    const viable = entries
      .filter(([type, tasks]) => tasks.length >= 3 && type !== 'general')
      .sort((a, b) => b[1].length - a[1].length);
    
    return viable[0] || null;
  }, [groupedTasks]);
  
  if (!bestBatch) return null;
  
  const [type, batchTasks] = bestBatch;
  const totalMinutes = batchTasks.length * estimateMinutes(type);
  
  const icons: Record<TaskType, JSX.Element> = {
    communication: <MessageSquare className="w-4 h-4" />,
    deep_work: <Target className="w-4 h-4" />,
    admin: <ClipboardList className="w-4 h-4" />,
    errands: <Car className="w-4 h-4" />,
    quick_task: <Zap className="w-4 h-4" />,
    general: <></>,
  };

  return (
    <button
      onClick={() => onStartBatch(type, batchTasks)}
      className="w-full flex items-center gap-3 px-4 py-3 bg-foreground/[0.02] hover:bg-foreground/[0.04] rounded-lg border border-foreground/5 transition-colors"
    >
      <div className="p-2 bg-foreground/5 rounded-full text-foreground/50">
        {icons[type]}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-mono text-foreground/70">
          {batchTasks.length} {getTaskTypeLabel(type).toLowerCase()} tasks
        </p>
        <p className="text-xs text-foreground/40">
          Batch them? ~{totalMinutes} min
        </p>
      </div>
      <span className="text-xs text-foreground/30">Start →</span>
    </button>
  );
};

export default BatchSuggestion;
