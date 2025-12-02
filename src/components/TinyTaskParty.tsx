import { useState, useEffect } from 'react';
import { X, Zap, Check, PartyPopper } from 'lucide-react';

interface TinyTaskPartyProps {
  tasks: any[];
  onComplete: (taskId: string) => void;
  onClose: () => void;
}

const TinyTaskParty = ({ tasks, onComplete, onClose }: TinyTaskPartyProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };
  
  const remaining = tasks.filter(t => !completed.includes(t.id));
  const currentTask = remaining[0];
  const isFinished = remaining.length === 0;
  
  const handleComplete = () => {
    if (!currentTask) return;
    setCompleted([...completed, currentTask.id]);
    onComplete(currentTask.id);
  };
  
  const handleSkip = () => {
    // Move current to end
    setCurrentIndex(i => i + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="font-mono text-sm text-foreground/70">Tiny Task Party</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-foreground/40">{formatTime(timeElapsed)}</span>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground/50">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-foreground/40">
            {completed.length} of {tasks.length} done
          </span>
          <span className="text-xs text-foreground/40">
            {remaining.length} left
          </span>
        </div>
        <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500/70 transition-all duration-300"
            style={{ width: `${(completed.length / tasks.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {isFinished ? (
          <div className="text-center animate-fade-in">
            <PartyPopper className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="font-mono text-xl text-foreground/80 mb-2">
              All done!
            </h2>
            <p className="text-sm text-foreground/50 mb-1">
              {completed.length} tasks in {formatTime(timeElapsed)}
            </p>
            <p className="text-xs text-foreground/40">
              {Math.round(timeElapsed / completed.length)}s average per task
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-foreground/5 text-foreground/70 rounded-lg hover:bg-foreground/10"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="text-center w-full max-w-md animate-fade-in" key={currentTask?.id}>
            <p className="text-[10px] uppercase tracking-widest text-foreground/30 mb-4">
              Current Task
            </p>
            <h2 className="font-mono text-lg text-foreground/80 mb-8 leading-relaxed">
              {currentTask?.title}
            </h2>
            
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-foreground/40 hover:text-foreground/60"
              >
                Skip for now
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
      
      {/* Remaining tasks preview */}
      {!isFinished && remaining.length > 1 && (
        <div className="px-4 py-3 border-t border-foreground/5">
          <p className="text-[10px] uppercase tracking-widest text-foreground/30 mb-2">
            Up next
          </p>
          <div className="space-y-1">
            {remaining.slice(1, 4).map(task => (
              <p key={task.id} className="text-xs text-foreground/40 truncate">
                {task.title}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TinyTaskParty;
