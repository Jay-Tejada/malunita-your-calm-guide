import { useState, useMemo, useEffect } from 'react';
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
import { TodaySection } from '@/components/today/TodaySection';
import { TaskRow } from '@/ui/tasks/TaskRow';
import { TaskGroup } from '@/ui/tasks/TaskGroup';
import { AppLayout } from '@/ui/AppLayout';
import { TinyTaskPrompt } from '@/components/tasks/TinyTaskPrompt';
import { TinyTaskParty } from '@/components/tasks/TinyTaskParty';
import { deduplicateTasks } from '@/utils/duplicateDetection';
import { InboxPreviewRow } from '@/components/today/InboxPreviewRow';
import { TaskEditDialog } from '@/components/TaskEditDialog';

const Today = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { toast } = useToast();
  const { sessions, startSession, createSession } = useFlowSessions();
  const { habits, toggleCompletion, isCompletedToday } = useHabits();
  const [focusInput, setFocusInput] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Tiny Task Party state
  const [partyOpen, setPartyOpen] = useState(false);
  const [partyTasks, setPartyTasks] = useState<any[]>([]);
  const [partyMinutes, setPartyMinutes] = useState(0);
  
  // Fetch user ID for TinyTaskPrompt
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);
  
  const handleCreateFiesta = (fiestaTasks: any[], totalMinutes: number) => {
    setPartyTasks(fiestaTasks);
    setPartyMinutes(totalMinutes);
    setPartyOpen(true);
  };
  
  const handlePartyComplete = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { 
        completed: true,
        completed_at: new Date().toISOString()
      } 
    });
  };

  // Show habits in the morning (before noon)
  const isMorning = new Date().getHours() < 12;
  
  // Deduplicate all tasks first
  const deduplicatedTasks = useMemo(() => {
    if (!tasks) return [];
    return deduplicateTasks(tasks as any[], ['today', 'work', 'home', 'inbox', 'someday']);
  }, [tasks]);
  
  const todayTasks = deduplicatedTasks.filter(t => 
    t.scheduled_bucket === 'today' && !t.completed
  );

  const focusTask = todayTasks.find(t => t.is_focus);
  const regularTasks = todayTasks.filter(t => !t.is_focus);
  
  const completedTasks = deduplicatedTasks.filter(t => 
    t.scheduled_bucket === 'today' && t.completed
  );

  // Get today task IDs for exclusion from inbox
  const todayTaskIds = new Set(todayTasks.map(t => t.id));

  // Inbox tasks: exclude any already in Today section AND exclude duplicates
  const inboxTasks = deduplicatedTasks.filter(t => 
    (t.category === 'inbox' || !t.scheduled_bucket) && 
    !t.completed &&
    !todayTaskIds.has(t.id) // Exclude tasks already shown in Today
  ).slice(0, 5);

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

  const handleMoveToWork = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { category: 'work' } 
    });
    toast({
      description: "Moved to work",
    });
  };

  const handleMoveToSomeday = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { scheduled_bucket: 'someday' } 
    });
    toast({
      description: "Moved to someday",
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    toast({
      description: "Task deleted",
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTasks(prev => new Set(prev).add(taskId));
    
    setTimeout(async () => {
      await updateTask({ 
        id: taskId, 
        updates: { 
          completed: true,
          completed_at: new Date().toISOString()
        } 
      });
      setCompletingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }, 400);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (taskId: string, updates: Partial<Task>) => {
    await updateTask({ id: taskId, updates });
    toast({ description: "Task updated" });
  };

  return (
    <AppLayout title="Today" showBack>
      <div className="px-4 pt-4 pb-24 md:pb-20">
        {/* Date */}
        <p className="text-xs text-muted-foreground text-center mb-6">{today}</p>

        {/* Tiny Task Fiesta Prompt */}
        {userId && (
          <TinyTaskPrompt
            userId={userId}
            onCreateFiesta={handleCreateFiesta}
          />
        )}

        {isMorning && habits.length > 0 && (
          <TodaySection label="Daily Habits" icon="✨">
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
          </TodaySection>
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
          <div className="h-px bg-border mx-0 my-6" />
        )}

        {/* TODAY'S FOCUS SECTION */}
        {focusTask ? (
          <TaskGroup title="Focus" icon={<span>⭐</span>}>
            <TaskRow
              title={focusTask.title}
              isCompleted={focusTask.completed || false}
              onToggleComplete={() => handleCompleteTask(focusTask.id)}
              onPress={() => handleEditTask(focusTask)}
            />
          </TaskGroup>
        ) : (
          <TodaySection label="Focus" icon="⭐" variant="focus">
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
          </TodaySection>
        )}

        {/* TODAY'S TASKS SECTION */}
        {regularTasks.length > 0 && (
          <TaskGroup title="Today" icon={<span>📋</span>} count={regularTasks.length}>
            {regularTasks.map((task: Task) => (
              <TaskRow
                key={task.id}
                title={task.title}
                isCompleted={task.completed || false}
                onToggleComplete={() => handleCompleteTask(task.id)}
                onPress={() => handleEditTask(task)}
              />
            ))}
          </TaskGroup>
        )}

        {/* FROM YOUR INBOX SECTION - softer, uses dual-layer collapse */}
        {inboxTasks.length > 0 && (
          <TaskGroup title="From Inbox" icon={<span className="opacity-60">📥</span>} count={inboxTasks.length}>
            <p className="text-[11px] text-muted-foreground/60 mb-2 px-1">
              Tap to process or swipe to move
            </p>
            <div className="space-y-1.5">
              {inboxTasks.map((task: Task) => (
                <InboxPreviewRow
                  key={task.id}
                  task={task}
                  onMoveToToday={handleMoveToToday}
                  onComplete={handleCompleteTask}
                  onMoveToWork={handleMoveToWork}
                  onMoveToSomeday={handleMoveToSomeday}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </TaskGroup>
        )}

        {/* Desktop quick add - moved to bottom */}
        {todayTasks.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <DesktopTaskCapture 
              placeholder="Add to today..." 
              onCapture={handleQuickAdd} 
            />
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
          <TaskGroup title="Completed" count={completedTasks.length}>
            {completedTasks.map((task: Task) => (
              <TaskRow
                key={task.id}
                title={task.title}
                isCompleted={true}
                onToggleComplete={() => {}}
              />
            ))}
          </TaskGroup>
        )}

        {/* Desktop quick add - moved to bottom */}
        {todayTasks.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border hidden md:block">
            <DesktopTaskCapture 
              placeholder="Add to today..." 
              onCapture={handleQuickAdd} 
            />
          </div>
        )}
      </div>

      {/* Mobile quick add at bottom */}
      {todayTasks.length > 0 && (
        <MobileTaskCapture 
          placeholder="Add to today..." 
          onCapture={handleQuickAdd} 
        />
      )}
      
      {/* Tiny Task Party overlay */}
      <TinyTaskParty
        isOpen={partyOpen}
        tasks={partyTasks}
        totalMinutes={partyMinutes}
        onClose={() => setPartyOpen(false)}
        onComplete={handlePartyComplete}
      />
      
      {/* Task Edit Dialog */}
      <TaskEditDialog
        open={editDialogOpen}
        task={taskToEdit}
        onSave={handleSaveEdit}
        onClose={() => {
          setEditDialogOpen(false);
          setTaskToEdit(null);
        }}
      />
    </AppLayout>
  );
};

export default Today;
