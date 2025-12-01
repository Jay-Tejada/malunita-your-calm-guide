import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { MobileTaskCapture } from '@/components/shared/MobileTaskCapture';
import { DesktopTaskCapture } from '@/components/shared/DesktopTaskCapture';

const Work = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  
  const workTasks = tasks?.filter(t => 
    t.category === 'work' && !t.completed
  ) || [];
  
  const completedTasks = tasks?.filter(t => 
    t.category === 'work' && t.completed
  ) || [];

  const handleCapture = async (text: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: text,
      category: 'work'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        <button onClick={() => navigate('/')} className="text-foreground/30 hover:text-foreground/50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground/80">Work</span>
        <div className="w-5" />
      </div>

      <div className="px-4 pt-4 pb-24 md:pb-0">
        {/* Desktop capture input */}
        <DesktopTaskCapture 
          placeholder="Add a work task..." 
          onCapture={handleCapture} 
        />

        {/* Task list */}
        <div className="mt-4 md:mt-0">
          {workTasks.length === 0 ? (
            <p className="text-muted-foreground/30 text-center py-12">No work tasks</p>
          ) : (
            <div className="space-y-2">
              {workTasks.map(task => (
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
        </div>

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
        placeholder="Add a work task..." 
        onCapture={handleCapture} 
      />
    </div>
  );
};

export default Work;
