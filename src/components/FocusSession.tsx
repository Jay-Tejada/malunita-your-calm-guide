import { useState, useEffect } from 'react';
import { X, Check, SkipForward, Pause, Play } from 'lucide-react';
import { FlowSession } from '@/utils/taskCategorizer';

interface FocusSessionProps {
  session: FlowSession;
  onComplete: (taskId: string) => void;
  onClose: () => void;
}

const FocusSession = ({ session, onComplete, onClose }: FocusSessionProps) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentTask = session.tasks.filter(t => !completedIds.includes(t.id))[0];
  const isFinished = !currentTask;
  
  // Timer
  useEffect(() => {
    if (isPaused || isFinished) return;
    
    const interval = setInterval(() => {
      setSecondsElapsed(s => s + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPaused, isFinished]);
  
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const handleComplete = () => {
    if (!currentTask) return;
    setCompletedIds([...completedIds, currentTask.id]);
    onComplete(currentTask.id);
  };
  
  const handleSkip = () => {
    setCurrentTaskIndex(i => i + 1);
  };
  
  // Progress
  const progress = completedIds.length / session.tasks.length;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Minimal header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-foreground/30 uppercase tracking-widest">
          {session.label}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-foreground/50">
            {formatTime(secondsElapsed)}
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 text-foreground/30 hover:text-foreground/50"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-foreground/30 hover:text-foreground/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-0.5 bg-foreground/5">
        <div 
          className="h-full bg-foreground/20 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-[70vh]">
        {isFinished ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-foreground/50" />
            </div>
            <h2 className="font-mono text-xl text-foreground/80 mb-2">
              Session Complete
            </h2>
            <p className="text-sm text-foreground/50 mb-1">
              {completedIds.length} tasks · {formatTime(secondsElapsed)}
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-foreground/5 text-foreground/70 rounded-lg hover:bg-foreground/10"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="text-center w-full max-w-lg animate-fade-in" key={currentTask.id}>
            {/* Task number */}
            <p className="text-xs text-foreground/30 mb-4">
              {completedIds.length + 1} of {session.tasks.length}
            </p>
            
            {/* Current task */}
            <h2 className="font-mono text-xl text-foreground/80 mb-2 leading-relaxed">
              {currentTask.title}
            </h2>
            
            {/* Cognitive load indicator */}
            {currentTask.analysis?.cognitiveLoad === 'high' && (
              <p className="text-xs text-foreground/40 mb-8">
                Deep focus task — take your time
              </p>
            )}
            
            {/* Actions */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={handleSkip}
                className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/40 hover:text-foreground/60"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-3 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-foreground/70 transition-colors"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Upcoming tasks */}
      {!isFinished && session.tasks.filter(t => !completedIds.includes(t.id)).length > 1 && (
        <div className="px-6 py-4 border-t border-foreground/5">
          <p className="text-[10px] uppercase tracking-widest text-foreground/30 mb-2">
            Up next
          </p>
          {session.tasks
            .filter(t => !completedIds.includes(t.id))
            .slice(1, 3)
            .map(task => (
              <p key={task.id} className="text-xs text-foreground/40 truncate mb-1">
                {task.title}
              </p>
            ))}
        </div>
      )}
    </div>
  );
};

export default FocusSession;
