import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFiestaSessions } from "@/hooks/useFiestaSessions";
import { useTasks } from "@/hooks/useTasks";
import { TinyTaskFiestaStart } from "@/components/TinyTaskFiestaStart";
import { TinyTaskFiestaTimer } from "@/components/TinyTaskFiestaTimer";
import { TinyTaskFiestaTaskList } from "@/components/TinyTaskFiestaTaskList";
import { TinyTaskFiestaSummary } from "@/components/TinyTaskFiestaSummary";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TinyTaskFiesta = () => {
  const navigate = useNavigate();
  const { activeSession, updateSession, endSession } = useFiestaSessions();
  const { tasks, updateTask, deleteTask } = useTasks();

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
  };

  const handleEndEarly = async () => {
    if (!activeSession) return;
    if (confirm('End your fiesta early?')) {
      await endSession(activeSession.id);
    }
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
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fiesta Mode 🎉</h1>
        <Button
          variant="outline"
          onClick={handleEndEarly}
        >
          End Early
        </Button>
      </div>

      <TinyTaskFiestaTimer
        durationMinutes={activeSession.duration_minutes}
        startedAt={activeSession.started_at}
        onComplete={handleTimerComplete}
      />

      <TinyTaskFiestaTaskList
        tasks={sessionTasks}
        completedTaskIds={activeSession.tasks_completed}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};

export default TinyTaskFiesta;
