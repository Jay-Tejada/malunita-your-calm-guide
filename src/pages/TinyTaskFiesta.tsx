import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFiestaSessions } from "@/hooks/useFiestaSessions";
import { useTasks } from "@/hooks/useTasks";
import { useCompanionGrowth } from "@/hooks/useCompanionGrowth";
import { TinyTaskFiestaStart } from "@/components/TinyTaskFiestaStart";
import { TinyTaskFiestaTimer } from "@/components/TinyTaskFiestaTimer";
import { TinyTaskFiestaTaskList } from "@/components/TinyTaskFiestaTaskList";
import { TinyTaskFiestaSummary } from "@/components/TinyTaskFiestaSummary";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { bondingMeter, BONDING_INCREMENTS } from "@/state/bondingMeter";

const TinyTaskFiesta = () => {
  const navigate = useNavigate();
  const { activeSession, updateSession, endSession } = useFiestaSessions();
  const { tasks, updateTask, deleteTask } = useTasks();
  const growth = useCompanionGrowth();
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);

  const sessionTasks = tasks?.filter(t => 
    activeSession?.tasks_included.includes(t.id)
  ) || [];

  const handleToggleTask = async (taskId: string) => {
    if (!activeSession) return;

    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;

    // Update task completion status
    await updateTask({ id: taskId, updates: { completed: !task.completed } });

    // Update session's completed tasks
    const isCurrentlyCompleted = activeSession.tasks_completed.includes(taskId);
    const newCompletedTasks = isCurrentlyCompleted
      ? activeSession.tasks_completed.filter(id => id !== taskId)
      : [...activeSession.tasks_completed, taskId];

    await updateSession({
      id: activeSession.id,
      updates: { tasks_completed: newCompletedTasks }
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeSession) return;
    await deleteTask(taskId);
  };

  const handleTimerComplete = async () => {
    if (!activeSession) return;
    await endSession(activeSession.id);
    // Award XP for completing a fiesta session
    await growth.addXp(2, 'Tiny Task Fiesta completed');
    // Increment bonding for fiesta completion
    bondingMeter.incrementBonding(
      BONDING_INCREMENTS.FIESTA_COMPLETED,
      "Fiesta fun! Malunita had a blast"
    );
    // TODO: Call useOrbRituals().onTinyTaskFiestaComplete(completedTasksCount) here
  };

  const handleEndEarly = async () => {
    if (!activeSession) return;
    if (confirm('End your fiesta early?')) {
      await endSession(activeSession.id);
      // Award XP even for early completion
      await growth.addXp(2, 'Tiny Task Fiesta completed');
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      // Resume
      const now = Date.now();
      if (pausedAt) {
        setTotalPausedTime(prev => prev + (now - pausedAt));
      }
      setPausedAt(null);
    } else {
      // Pause
      setPausedAt(Date.now());
    }
    setIsPaused(!isPaused);
  };

  // If session just ended, show summary
  if (activeSession?.ended_at) {
    return (
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <TinyTaskFiestaSummary session={activeSession} />
      </div>
    );
  }

  // If no active session, show start screen
  if (!activeSession) {
    return (
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        <TinyTaskFiestaStart />
      </div>
    );
  }

  // Active session view
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light tracking-tight font-mono">
              Tiny Task Fiesta
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndEarly}
              className="text-muted-foreground hover:text-foreground"
            >
              End Session
            </Button>
          </div>
          <p className="text-sm text-muted-foreground font-light">
            Clear your tiny tasks in a focused sprint
          </p>
        </div>

        {/* Timer Section */}
        <TinyTaskFiestaTimer
          durationMinutes={activeSession.duration_minutes}
          startedAt={activeSession.started_at}
          onComplete={handleTimerComplete}
          isPaused={isPaused}
          totalPausedTime={totalPausedTime}
        />

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleTogglePause}
            className="gap-2 font-mono"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            )}
          </Button>
        </div>

        {/* Task List */}
        <TinyTaskFiestaTaskList
          tasks={sessionTasks}
          completedTaskIds={activeSession.tasks_completed}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
};

export default TinyTaskFiesta;
