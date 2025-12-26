import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { SomedayTaskRow } from '@/components/someday/SomedayTaskRow';
import { toast } from 'sonner';

const Someday = () => {
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  
  const somedayTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'someday' && !t.completed
  ) || [];
  
  const completedTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'someday' && t.completed
  ) || [];

  const handleActivate = async (id: string) => {
    await updateTask({
      id,
      updates: {
        scheduled_bucket: null, // Move out of Someday, back to Inbox (no bucket)
        category: 'inbox',
      }
    });
    toast.success('Moved to Inbox');
  };

  const handleSnooze = async (id: string) => {
    // Snooze for 7 days
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + 7);
    
    await updateTask({
      id,
      updates: {
        focus_date: snoozeDate.toISOString().split('T')[0],
      }
    });
    toast.success('Will revisit in 7 days');
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    toast.success('Idea removed');
  };

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
        {/* Subtitle - reinforcing calm tone */}
        <p className="text-[11px] text-muted-foreground/40 mb-6 text-center">
          Ideas waiting for the right moment
        </p>

        {/* Task list with relaxed spacing */}
        {somedayTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground/40">Nothing deferred yet</p>
            <p className="text-[11px] text-muted-foreground/30 mt-2">
              Swipe tasks to Someday from Inbox when they can wait
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {somedayTasks.map((task) => (
              <SomedayTaskRow
                key={task.id}
                task={task}
                onActivate={handleActivate}
                onSnooze={handleSnooze}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Show completed toggle */}
        {completedTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full text-center text-xs text-muted-foreground/30 hover:text-muted-foreground/50 py-6 transition-colors"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
          </button>
        )}

        {/* Completed tasks */}
        {showCompleted && completedTasks.length > 0 && (
          <div className="space-y-1 opacity-50">
            {completedTasks.map((task) => (
              <SomedayTaskRow
                key={task.id}
                task={task}
                onActivate={handleActivate}
                onSnooze={handleSnooze}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Someday;
