import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useProgressStats } from '@/hooks/useProgressStats';
import { X, Moon, ArrowRight } from 'lucide-react';

interface EveningRitualProps {
  onComplete: () => void;
  onDismiss: () => void;
}

const EveningRitual = ({ onComplete, onDismiss }: EveningRitualProps) => {
  const [step, setStep] = useState(1);
  const { tasks, updateTask } = useTasks();
  const { completedToday, streak } = useProgressStats();
  
  // Incomplete today tasks
  const incomplete = tasks?.filter(t => 
    t.scheduled_bucket === 'today' && !t.completed
  ) || [];
  
  const handleMoveToTomorrow = async (taskId: string) => {
    // For simplicity, move to "today" but it'll show tomorrow
    // Or create a "tomorrow" bucket
    await updateTask({ 
      id: taskId, 
      updates: { scheduled_bucket: 'tomorrow' } 
    });
  };
  
  const handleMoveToSomeday = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { scheduled_bucket: 'someday' } 
    });
  };
  
  const handleMoveAllToTomorrow = async () => {
    for (const task of incomplete) {
      await handleMoveToTomorrow(task.id);
    }
    setStep(2);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 text-foreground/50">
          <Moon className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Evening</span>
        </div>
        <button 
          onClick={onDismiss}
          className="text-foreground/30 hover:text-foreground/50 p-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        
        {/* Step 1: Review the day */}
        {step === 1 && (
          <div className="w-full max-w-md text-center">
            {/* Celebration or acknowledgment */}
            {completedToday > 0 ? (
              <>
                <p className="text-4xl font-light text-foreground/70 mb-2">
                  {completedToday}
                </p>
                <p className="text-sm text-muted-foreground/50 mb-2">
                  task{completedToday > 1 ? 's' : ''} completed today
                </p>
                {streak > 1 && (
                  <p className="text-xs text-muted-foreground/40">
                    {streak} day streak
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-light text-foreground/60 mb-2">
                  Slow day. That's okay.
                </p>
                <p className="text-sm text-muted-foreground/40">
                  Tomorrow is a fresh start.
                </p>
              </>
            )}
            
            <button
              onClick={() => setStep(incomplete.length > 0 ? 2 : 3)}
              className="mt-8 text-sm text-foreground/50 hover:text-foreground/70"
            >
              Continue →
            </button>
          </div>
        )}
        
        {/* Step 2: Handle incomplete tasks */}
        {step === 2 && incomplete.length > 0 && (
          <div className="w-full max-w-md">
            <h1 className="text-lg font-light text-foreground/70 text-center mb-2">
              {incomplete.length} thing{incomplete.length > 1 ? 's' : ''} didn't get done
            </h1>
            <p className="text-xs text-muted-foreground/40 text-center mb-8">
              What should we do with them?
            </p>
            
            <div className="space-y-3 mb-8">
              {incomplete.map(task => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-foreground/5">
                  <span className="text-sm text-foreground/60 font-mono truncate flex-1 mr-4">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMoveToTomorrow(task.id)}
                      className="text-[10px] text-foreground/40 hover:text-foreground/60 px-2 py-1 border border-foreground/10 rounded"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => handleMoveToSomeday(task.id)}
                      className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/50"
                    >
                      Someday
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleMoveAllToTomorrow}
                className="flex-1 py-3 text-sm text-foreground/60 border border-foreground/10 rounded-lg hover:border-foreground/20"
              >
                All → Tomorrow
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 text-sm text-foreground/50 hover:text-foreground/70"
              >
                Leave as is
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Closing */}
        {step === 3 && (
          <div className="w-full max-w-md text-center">
            <p className="text-lg font-light text-foreground/60 mb-4">
              Rest well.
            </p>
            <p className="text-sm text-muted-foreground/40 mb-8">
              Tomorrow is waiting.
            </p>
            
            <button
              onClick={onComplete}
              className="py-3 px-8 text-sm text-foreground/60 hover:text-foreground/80 border border-foreground/10 rounded-lg"
            >
              Good night
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default EveningRitual;
