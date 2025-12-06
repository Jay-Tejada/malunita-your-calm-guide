import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MobileTaskCapture } from '@/components/shared/MobileTaskCapture';
import { DesktopTaskCapture } from '@/components/shared/DesktopTaskCapture';
import FlowTimeline from '@/components/FlowTimeline';
import { useFlowSessions } from '@/hooks/useFlowSessions';
import { generateFlowSessions } from '@/utils/taskCategorizer';
import { useHabits } from '@/hooks/useHabits';
import { HabitQuickToggle } from '@/components/habits/HabitQuickToggle';
import VirtualizedTaskList from '@/components/VirtualizedTaskList';

const Today = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { toast } = useToast();
  const { sessions, startSession, createSession } = useFlowSessions();
  const { habits, toggleCompletion, isCompletedToday } = useHabits();
  const [focusInput, setFocusInput] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());

  // Show habits in the morning (before noon)
  const isMorning = new Date().getHours() < 12;
  
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

  // Suggest a flow session if none exist
  const suggestedSession = useMemo(() => {
    if (!tasks || sessions.length > 0) return null;
    const availableTasks = tasks.filter(t => !t.completed);
    const generated = generateFlowSessions(availableTasks);
    return generated[0] || null;
  }, [tasks, sessions]);

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

  const handleQuickAdd = async (text: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: text,
      scheduled_bucket: 'today'
    });
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
    setCompletingTasks(prev => new Set(prev).add(taskId));
    
    setTimeout(async () => {
      await updateTask({ 
        id: taskId, 
        updates: { completed: true } 
      });
      toast({
        description: "Completed",
      });
      setCompletingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <button 
          onClick={() => navigate('/')} 
          className="text-muted-foreground hover:text-foreground p-3 -ml-3 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-mono text-foreground font-medium">Today</span>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      <div className="px-4 pt-4 pb-24 md:pb-20">
        {/* Date */}
        <p className="text-xs text-muted-foreground text-center mb-6">{today}</p>

        {/* Daily Habits (morning only) */}
        {isMorning && habits.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-2">
              Daily Habits
            </p>
            <div className="space-y-1.5">
              {habits.slice(0, 3).map(habit => (
                <HabitQuickToggle
                  key={habit.id}
                  habit={habit}
                  isCompleted={isCompletedToday(habit.id)}
                  onToggle={() => toggleCompletion.mutate({ habitId: habit.id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Flow Timeline */}
        <FlowTimeline 
          sessions={sessions}
          suggestedSession={suggestedSession}
          onStartSession={(id) => {
            startSession(id);
          }}
          onViewSession={(id) => {
            console.log('View session:', id);
          }}
          onCreateSuggested={async () => {
            if (suggestedSession) {
              await createSession(suggestedSession);
            }
          }}
        />
        {(sessions.length > 0 || suggestedSession) && (
          <div className="h-px bg-border mx-0 my-4" />
        )}

        {/* Desktop quick add */}
        {todayTasks.length > 0 && (
          <DesktopTaskCapture 
            placeholder="Add to today..." 
            onCapture={handleQuickAdd} 
          />
        )}

        {/* TODAY'S FOCUS SECTION */}
        <div className="mb-8">
          <h3 className="text-[10px] uppercase tracking-widest text-accent font-medium mb-3">
            Today's Focus
          </h3>
          {focusTask ? (
            // Show focus task
            <div className={`flex items-start gap-3 py-4 px-3 rounded-lg bg-card border border-border ${completingTasks.has(focusTask.id) ? 'task-completing' : ''}`}>
              <button
                onClick={() => handleCompleteTask(focusTask.id)}
                className="w-6 h-6 rounded-full border-2 border-accent hover:border-foreground flex-shrink-0 mt-0.5 transition-colors"
              />
              <span className="font-mono text-base text-foreground font-medium">{focusTask.title}</span>
            </div>
          ) : (
            // Show focus input
            <div className="text-center py-4">
              <p className="text-base font-light text-muted-foreground mb-4">
                What's the ONE thing that would make today a success?
              </p>
              <input
                type="text"
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                onKeyDown={handleSetFocus}
                placeholder="Type your main focus..."
                className="w-full max-w-md mx-auto bg-transparent border-b-2 border-border py-3 font-mono text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}
        </div>

        {/* TODAY'S TASKS SECTION */}
        {regularTasks.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-accent font-medium mb-3">
              Other Tasks
            </h3>
            <VirtualizedTaskList
              tasks={regularTasks}
              estimatedItemHeight={52}
              renderTask={(task: Task) => (
                <div key={task.id} className={`flex items-start gap-3 py-3 border-b border-border ${completingTasks.has(task.id) ? 'task-completing' : ''}`}>
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="w-5 h-5 rounded-full border border-muted-foreground hover:border-foreground flex-shrink-0 mt-0.5 transition-colors"
                  />
                  <span className="font-mono text-sm text-foreground">{task.title}</span>
                </div>
              )}
            />
          </div>
        )}

        {/* FROM YOUR INBOX SECTION */}
        {inboxTasks.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
              From your inbox
            </h3>
            <div className="rounded-lg bg-card border border-border overflow-hidden">
              <VirtualizedTaskList
                tasks={inboxTasks}
                estimatedItemHeight={44}
                renderTask={(task: Task) => (
                  <div key={task.id} className="flex items-center gap-3 py-3 px-3 border-b border-border last:border-b-0">
                    <button 
                      onClick={() => handleMoveToToday(task.id)} 
                      className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <span className="flex-1 font-mono text-sm text-muted-foreground">{task.title}</span>
                    <button 
                      onClick={() => handleCompleteTask(task.id)} 
                      className="w-5 h-5 rounded-full border border-muted-foreground hover:border-foreground flex-shrink-0 transition-colors" 
                    />
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* Show completed toggle */}
        {completedTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-4 mt-6 transition-colors"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
          </button>
        )}

        {/* Completed tasks */}
        {showCompleted && completedTasks.length > 0 && (
          <VirtualizedTaskList
            tasks={completedTasks}
            estimatedItemHeight={44}
            className="mb-6"
            renderTask={(task: Task) => (
              <div key={task.id} className="flex items-start gap-3 py-2 opacity-50 border-b border-border">
                <div className="w-5 h-5 rounded-full border border-muted-foreground flex-shrink-0 mt-0.5 bg-muted" />
                <span className="font-mono text-sm text-muted-foreground line-through">{task.title}</span>
              </div>
            )}
          />
        )}
      </div>

      {/* Mobile quick add at bottom */}
      {todayTasks.length > 0 && (
        <MobileTaskCapture 
          placeholder="Add to today..." 
          onCapture={handleQuickAdd} 
        />
      )}
    </div>
  );
};

export default Today;
