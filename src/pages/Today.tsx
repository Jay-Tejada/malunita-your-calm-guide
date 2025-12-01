import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';

const Today = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  
  const todayTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'today' && !t.completed
  ) || [];
  
  const completedTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'today' && t.completed
  ) || [];

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        <button onClick={() => navigate('/')} className="text-foreground/30 hover:text-foreground/50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground/80">Today</span>
        <div className="w-5" />
      </div>

      <div className="px-4 pt-4">
        {/* Date */}
        <p className="text-xs text-muted-foreground/40 text-center mb-6">{today}</p>

        {/* Task list */}
        {todayTasks.length === 0 ? (
          <p className="text-muted-foreground/30 text-center py-12">Nothing scheduled for today</p>
        ) : (
          <div className="space-y-2">
            {todayTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 py-3">
                <button
                  onClick={() => updateTask({ id: task.id, updates: { completed: true } })}
                  className="w-5 h-5 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0 mt-0.5"
                />
                <span className="font-mono text-sm text-foreground/80">{task.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Show completed toggle */}
        {completedTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full text-center text-xs text-muted-foreground/30 hover:text-muted-foreground/50 py-4"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default Today;
