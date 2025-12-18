import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import VirtualizedTaskList from '@/components/VirtualizedTaskList';

const Someday = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  
  const somedayTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'someday' && !t.completed
  ) || [];
  
  const completedTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'someday' && t.completed
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground font-medium">Someday</span>
        <div className="w-5" /> {/* Spacer */}
      </div>

      <div className="px-4 pt-6 pb-24 md:pb-6">
        {/* Task list */}
        {somedayTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Nothing deferred yet</p>
        ) : (
          <VirtualizedTaskList
            tasks={somedayTasks}
            estimatedItemHeight={52}
            renderTask={(task: Task) => (
              <div key={task.id} className="flex items-start gap-3 py-3 border-b border-border">
                <button
                  onClick={() => updateTask({ id: task.id, updates: { completed: true } })}
                  className="w-5 h-5 rounded-full border border-muted-foreground hover:border-foreground flex-shrink-0 mt-0.5 transition-colors"
                />
                <span className="font-mono text-sm text-foreground">{task.title}</span>
              </div>
            )}
          />
        )}

        {/* Show completed toggle */}
        {completedTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-4 transition-colors"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default Someday;
