import { useState, useMemo } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { InboxActions } from "@/components/InboxActions";
import { PlanningModePanel } from "@/components/planning/PlanningModePanel";
import { usePlanningBreakdown } from "@/hooks/usePlanningBreakdown";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PageHeader } from "@/components/shared/PageHeader";
import SmartTaskInput from "@/components/SmartTaskInput";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { categorizeTask, TaskType } from "@/utils/taskCategorizer";
import { GroupedTaskList } from "@/components/inbox/GroupedTaskList";
import { List, Layers, Sun, Moon, Trash2, Sparkles } from "lucide-react";
import VirtualizedTaskList from "@/components/VirtualizedTaskList";


interface TaskSuggestion {
  taskId: string;
  suggestion: 'today' | 'someday' | 'work' | 'home' | 'gym';
  confidence: number;
  reason?: string;
}

const Inbox = () => {
  const { tasks, isLoading, updateTask } = useTasks();
  const [planningMode, setPlanningMode] = useState(false);
  const [planningText, setPlanningText] = useState("");
  const { loading, error, result, runPlanningBreakdown } = usePlanningBreakdown();
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Filter inbox tasks
  const inboxTasks = useMemo(() => {
    return tasks?.filter(t => t.category === 'inbox' && !t.completed) || [];
  }, [tasks]);

  // Group tasks by detected type
  const groupedTasks = useMemo(() => {
    if (viewMode === 'flat' || inboxTasks.length === 0) return null;
    
    const groups: Record<TaskType, typeof inboxTasks> = {
      communication: [],
      deep_work: [],
      admin: [],
      errands: [],
      quick_task: [],
      general: [],
    };
    
    inboxTasks.forEach(task => {
      // Use custom category first, then auto-detect
      const type = categorizeTask(task.title);
      groups[type].push(task);
    });
    
    // Filter out empty groups and sort by count
    return Object.entries(groups)
      .filter(([_, tasks]) => tasks.length > 0)
      .sort((a, b) => b[1].length - a[1].length) as [TaskType, typeof inboxTasks][];
  }, [inboxTasks, viewMode]);

  const handleTaskCreate = async ({ 
    title, 
    scheduledDate, 
    scheduledTime, 
    hasReminder 
  }: { 
    title: string; 
    scheduledDate?: Date; 
    scheduledTime?: Date;
    hasReminder: boolean;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const taskData = {
      user_id: user.id,
      title,
      category: 'inbox',
      // If date detected, determine scheduled bucket
      ...(scheduledDate && {
        scheduled_bucket: determineBucket(scheduledDate),
      }),
      // If time detected, set reminder
      ...(scheduledTime && {
        reminder_time: scheduledTime.toISOString(),
        has_reminder: true,
      }),
    };

    const { error: insertError } = await supabase.from('tasks').insert(taskData);
    
    if (insertError) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      return;
    }
    
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const determineBucket = (date: Date): 'today' | 'tomorrow' | 'this_week' | 'upcoming' | 'someday' => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));

    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === today.getTime()) return 'today';
    if (targetDate.getTime() === tomorrow.getTime()) return 'tomorrow';
    if (targetDate <= endOfWeek) return 'this_week';
    if (targetDate <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)) return 'upcoming';
    return 'someday';
  };

  const handlePlanThis = (title: string) => {
    setPlanningText(title);
    setPlanningMode(true);
  };

  const handleApplyAllSuggestions = async () => {
    try {
      for (const suggestion of suggestions) {
        const updates: { scheduled_bucket?: 'today' | 'someday'; category?: string } = 
          suggestion.suggestion === 'today' || suggestion.suggestion === 'someday'
            ? { scheduled_bucket: suggestion.suggestion as 'today' | 'someday' }
            : { category: suggestion.suggestion };
        
        await updateTask({ id: suggestion.taskId, updates });
      }
      
      toast({
        title: "All moved",
        description: `Moved ${suggestions.length} tasks`,
      });
      
      setSuggestions([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply suggestions",
        variant: "destructive",
      });
    }
  };

  const handleApplySuggestion = async (taskId: string, destination: string) => {
    try {
      const updates: { scheduled_bucket?: 'today' | 'someday'; category?: string } = 
        destination === 'today' || destination === 'someday'
          ? { scheduled_bucket: destination as 'today' | 'someday' }
          : { category: destination };
      
      await updateTask({ id: taskId, updates });
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.taskId !== taskId));
      
      toast({
        title: "Moved",
        description: `Task moved to ${destination}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive",
      });
    }
  };

  const handleDismissSuggestion = (taskId: string) => {
    setSuggestions(prev => prev.filter(s => s.taskId !== taskId));
  };

  // Handlers for grouped view
  const handleToggleComplete = async (task: Task) => {
    await updateTask({
      id: task.id,
      updates: {
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      },
    });
  };

  const handleMoveToToday = async (taskId: string) => {
    await updateTask({
      id: taskId,
      updates: { scheduled_bucket: 'today' },
    });
    toast({ description: "Moved to today" });
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ description: "Deleted" });
    }
  };

  // View toggle component
  const ViewToggle = () => (
    <div className="flex items-center gap-1 bg-foreground/5 rounded-lg p-1">
      <button
        onClick={() => setViewMode('flat')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          viewMode === 'flat' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-foreground/50 hover:text-foreground/70'
        }`}
      >
        <List className="w-3.5 h-3.5" />
        List
      </button>
      <button
        onClick={() => setViewMode('grouped')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          viewMode === 'grouped' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'text-foreground/50 hover:text-foreground/70'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        Grouped
      </button>
    </div>
  );

  // Mobile layout: input at bottom
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PageHeader title="Inbox" />
        
        {/* Planning Mode Overlay */}
        {planningMode && (
          <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <PlanningModePanel 
              initialText={planningText}
              loading={loading}
              error={error}
              result={result}
              onRun={() => runPlanningBreakdown(planningText)}
              onClose={() => setPlanningMode(false)} 
            />
          </div>
        )}

        {/* Task list - scrollable, takes remaining space */}
        <div className="flex-1 overflow-y-auto px-4 pt-16 pb-24">
          {/* View Toggle & Inbox Actions */}
          <div className="flex items-center justify-between mb-4">
            <ViewToggle />
            {inboxTasks.length > 0 && (
              <span className="text-xs text-foreground/40">{inboxTasks.length} tasks</span>
            )}
          </div>

          {!isLoading && tasks && viewMode === 'flat' && (
            <InboxActions 
              tasks={tasks} 
              onSuggestionsGenerated={(newSuggestions) => setSuggestions(newSuggestions)}
              suggestions={suggestions}
              onApplyAll={handleApplyAllSuggestions}
            />
          )}
          
          {/* Task List - Flat or Grouped */}
          {viewMode === 'flat' ? (
            inboxTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground/40 text-sm">No tasks in inbox</p>
              </div>
            ) : (
              <VirtualizedTaskList
                tasks={inboxTasks}
                estimatedItemHeight={expandedTask ? 100 : 56}
                renderTask={(task: Task) => (
                  <div key={task.id}>
                    <div 
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-foreground/[0.02] transition-colors border-b border-foreground/5"
                    >
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleToggleComplete(task); 
                        }}
                        className="w-5 h-5 mt-0.5 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0"
                      />
                      <p className="flex-1 font-mono text-sm text-foreground/70 leading-relaxed">
                        {task.title}
                      </p>
                    </div>
                    
                    {expandedTask === task.id && (
                      <div className="flex items-center gap-4 px-4 py-2 pl-12 bg-foreground/[0.015] border-b border-foreground/5">
                        <button 
                          onClick={() => { handleMoveToToday(task.id); setExpandedTask(null); }}
                          className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                        >
                          <Sun className="w-3.5 h-3.5" />
                          Today
                        </button>
                        <button 
                          onClick={() => { updateTask({ id: task.id, updates: { scheduled_bucket: 'someday' } }); setExpandedTask(null); toast({ description: "Moved to someday" }); }}
                          className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                        >
                          <Moon className="w-3.5 h-3.5" />
                          Someday
                        </button>
                        <button 
                          onClick={() => handlePlanThis(task.title)}
                          className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Plan
                        </button>
                        <button 
                          onClick={() => { handleDeleteTask(task.id); setExpandedTask(null); }}
                          className="flex items-center gap-1.5 text-xs text-red-500/70 hover:text-red-500 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              />
            )
          ) : groupedTasks ? (
            <GroupedTaskList
              groups={groupedTasks}
              onToggleComplete={handleToggleComplete}
              onMoveToToday={handleMoveToToday}
              onDelete={handleDeleteTask}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground/40 text-sm">No tasks in inbox</p>
            </div>
          )}
        </div>
        
        {/* Capture input - fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-foreground/5 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <SmartTaskInput 
            placeholder="Capture a thought..." 
            onSubmit={handleTaskCreate}
          />
        </div>
      </div>
    );
  }

  // Desktop layout: input at top
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Inbox" />
      
      <div className="px-4 pt-16">
        <div className="mb-4">
          <SmartTaskInput 
            placeholder="Capture a thought..." 
            onSubmit={handleTaskCreate}
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <ViewToggle />
          {inboxTasks.length > 0 && (
            <span className="text-xs text-foreground/40">{inboxTasks.length} tasks</span>
          )}
        </div>

        {/* Planning Mode Overlay */}
        {planningMode && (
          <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <PlanningModePanel 
              initialText={planningText}
              loading={loading}
              error={error}
              result={result}
              onRun={() => runPlanningBreakdown(planningText)}
              onClose={() => setPlanningMode(false)} 
            />
          </div>
        )}

        {/* Inbox Actions - only in flat mode */}
        {!isLoading && tasks && viewMode === 'flat' && (
          <InboxActions 
            tasks={tasks} 
            onSuggestionsGenerated={(newSuggestions) => setSuggestions(newSuggestions)}
            suggestions={suggestions}
            onApplyAll={handleApplyAllSuggestions}
          />
        )}
      
        {/* Task List - Flat or Grouped */}
        {viewMode === 'flat' ? (
          inboxTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground/40 text-sm">No tasks in inbox</p>
            </div>
          ) : (
            <VirtualizedTaskList
              tasks={inboxTasks}
              estimatedItemHeight={expandedTask ? 100 : 56}
              renderTask={(task: Task) => (
                <div key={task.id}>
                  <div 
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-foreground/[0.02] transition-colors border-b border-foreground/5"
                  >
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleToggleComplete(task); 
                      }}
                      className="w-5 h-5 mt-0.5 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0"
                    />
                    <p className="flex-1 font-mono text-sm text-foreground/70 leading-relaxed">
                      {task.title}
                    </p>
                  </div>
                  
                  {expandedTask === task.id && (
                    <div className="flex items-center gap-4 px-4 py-2 pl-12 bg-foreground/[0.015] border-b border-foreground/5">
                      <button 
                        onClick={() => { handleMoveToToday(task.id); setExpandedTask(null); }}
                        className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                      >
                        <Sun className="w-3.5 h-3.5" />
                        Today
                      </button>
                      <button 
                        onClick={() => { updateTask({ id: task.id, updates: { scheduled_bucket: 'someday' } }); setExpandedTask(null); toast({ description: "Moved to someday" }); }}
                        className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                      >
                        <Moon className="w-3.5 h-3.5" />
                        Someday
                      </button>
                      <button 
                        onClick={() => handlePlanThis(task.title)}
                        className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Plan
                      </button>
                      <button 
                        onClick={() => { handleDeleteTask(task.id); setExpandedTask(null); }}
                        className="flex items-center gap-1.5 text-xs text-red-500/70 hover:text-red-500 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            />
          )
        ) : groupedTasks ? (
          <GroupedTaskList
            groups={groupedTasks}
            onToggleComplete={handleToggleComplete}
            onMoveToToday={handleMoveToToday}
            onDelete={handleDeleteTask}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground/40 text-sm">No tasks in inbox</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
