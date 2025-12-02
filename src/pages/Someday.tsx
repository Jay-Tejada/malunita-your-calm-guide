import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { MobileTaskCapture } from '@/components/shared/MobileTaskCapture';
import { DesktopTaskCapture } from '@/components/shared/DesktopTaskCapture';
import { supabase } from '@/integrations/supabase/client';
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

  const handleCapture = async (text: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: text,
      scheduled_bucket: 'someday'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        <button onClick={() => navigate('/')} className="text-foreground/30 hover:text-foreground/50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground/80">Someday</span>
        <div className="w-5" /> {/* Spacer */}
      </div>

      <div className="px-4 pt-6 pb-24 md:pb-0">
        {/* Desktop capture input */}
        <DesktopTaskCapture 
          placeholder="Save for someday..." 
          onCapture={handleCapture} 
        />

        {/* Intro text */}
        {somedayTasks.length > 0 && (
          <p className="text-sm text-muted-foreground/40 text-center mb-6">
            Ideas worth keeping, for when the time is right.
          </p>
        )}

        {/* Task list */}
        {somedayTasks.length === 0 ? (
          <p className="text-muted-foreground/30 text-center py-12">Nothing here yet</p>
        ) : (
          <VirtualizedTaskList
            tasks={somedayTasks}
            estimatedItemHeight={52}
            renderTask={(task: Task) => (
              <div key={task.id} className="flex items-start gap-3 py-3 border-b border-foreground/5">
                <button
                  onClick={() => updateTask({ id: task.id, updates: { completed: true } })}
                  className="w-5 h-5 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0 mt-0.5"
                />
                <span className="font-mono text-sm text-foreground/80">{task.title}</span>
              </div>
            )}
          />
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
      
      {/* Mobile capture input */}
      <MobileTaskCapture 
        placeholder="Save for someday..." 
        onCapture={handleCapture} 
      />
    </div>
  );
};

export default Someday;
