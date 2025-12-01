import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Today = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { toast } = useToast();
  const [focusInput, setFocusInput] = useState('');
  const [quickAddInput, setQuickAddInput] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  
  const todayTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'today' && !t.completed
  ) || [];

  const focusTask = todayTasks.find(t => t.is_focus);
  const regularTasks = todayTasks.filter(t => !t.is_focus);
  
  const completedTasks = tasks?.filter(t => 
    t.scheduled_bucket === 'today' && t.completed
  ) || [];

  const inboxTasks = tasks?.filter(t => 
    (t.category === 'inbox' || !t.scheduled_bucket) && !t.completed
  ).slice(0, 5) || [];

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleSetFocus = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && focusInput.trim()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from('tasks').insert({
        user_id: user.id,
        title: focusInput.trim(),
        scheduled_bucket: 'today',
        is_focus: true
      });
      
      setFocusInput('');
    }
  };

  const handleQuickAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickAddInput.trim()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from('tasks').insert({
        user_id: user.id,
        title: quickAddInput.trim(),
        scheduled_bucket: 'today'
      });
      
      setQuickAddInput('');
    }
  };

  const handleMoveToToday = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { scheduled_bucket: 'today' } 
    });
    toast({
      description: "Added to today",
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { completed: true } 
    });
    toast({
      description: "Completed",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        <button onClick={() => navigate('/')} className="text-foreground/30 hover:text-foreground/50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground/80">Today</span>
        <div className="w-5" /> {/* Spacer for alignment */}
      </div>

      <div className="px-4 pt-4 pb-20">
        {/* Date */}
        <p className="text-xs text-muted-foreground/40 text-center mb-6">{today}</p>

        {/* TODAY'S FOCUS SECTION */}
        <div className="mb-8">
          {focusTask ? (
            // Show focus task
            <div className="flex items-start gap-3 py-4">
              <button
                onClick={() => updateTask({ id: focusTask.id, updates: { completed: true } })}
                className="w-6 h-6 rounded-full border-2 border-foreground/30 hover:border-foreground/50 flex-shrink-0 mt-0.5"
              />
              <span className="font-mono text-base text-foreground/90 font-medium">{focusTask.title}</span>
            </div>
          ) : (
            // Show focus input
            <div className="text-center">
              <p className="text-lg font-light text-foreground/60 mb-4">
                What's the ONE thing that would make today a success?
              </p>
              <input
                type="text"
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                onKeyDown={handleSetFocus}
                placeholder="Type your main focus..."
                className="w-full max-w-md mx-auto bg-transparent border-b border-foreground/10 py-3 font-mono text-sm text-center text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20"
              />
            </div>
          )}
        </div>

        {/* TODAY'S TASKS SECTION */}
        {regularTasks.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/30 mb-3">
              Today
            </h3>
            <div className="space-y-2">
              {regularTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 py-3">
                  <button
                    onClick={() => updateTask({ id: task.id, updates: { completed: true } })}
                    className="w-5 h-5 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0 mt-0.5"
                  />
                  <span className="font-mono text-sm text-foreground/80">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FROM YOUR INBOX SECTION */}
        {inboxTasks.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/30 mb-3">
              From your inbox
            </h3>
            <div className="space-y-2">
              {inboxTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 py-2">
                  <button 
                    onClick={() => handleMoveToToday(task.id)} 
                    className="text-foreground/30 hover:text-foreground/50 flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="flex-1 font-mono text-sm text-foreground/60">{task.title}</span>
                  <button 
                    onClick={() => handleCompleteTask(task.id)} 
                    className="w-5 h-5 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0" 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show completed toggle */}
        {completedTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full text-center text-xs text-muted-foreground/30 hover:text-muted-foreground/50 py-4 mt-6"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
          </button>
        )}

        {/* Completed tasks */}
        {showCompleted && completedTasks.length > 0 && (
          <div className="space-y-2 mb-6">
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 py-2 opacity-40">
                <div className="w-5 h-5 rounded-full border border-foreground/20 flex-shrink-0 mt-0.5 bg-foreground/10" />
                <span className="font-mono text-sm text-foreground/60 line-through">{task.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick add at bottom */}
        {todayTasks.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-foreground/5 p-4">
            <input
              type="text"
              value={quickAddInput}
              onChange={(e) => setQuickAddInput(e.target.value)}
              onKeyDown={handleQuickAdd}
              placeholder="Add to today..."
              className="w-full bg-transparent border-b border-foreground/10 py-2 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/20"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Today;
