import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { X, ArrowRight, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MorningRitualProps {
  onComplete: () => void;
  onDismiss: () => void;
}

const MorningRitual = ({ onComplete, onDismiss }: MorningRitualProps) => {
  const [step, setStep] = useState(1);
  const [focusInput, setFocusInput] = useState('');
  const { tasks, updateTask } = useTasks();
  
  // Get inbox items and yesterday's incomplete
  const inboxTasks = tasks?.filter(t => 
    (t.category === 'inbox' || !t.category) && !t.completed
  ).slice(0, 3) || [];
  
  const carryOver = tasks?.filter(t => 
    t.scheduled_bucket === 'today' && !t.completed
  ) || [];

  const handleSetFocus = async () => {
    if (!focusInput.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Create focus task
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: focusInput.trim(),
      scheduled_bucket: 'today',
      is_focus: true
    });
    
    setStep(2);
  };
  
  const handleMoveToToday = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { scheduled_bucket: 'today' } 
    });
  };
  
  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2 text-foreground/50">
          <Sun className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Morning</span>
        </div>
        <button 
          onClick={onDismiss}
          className="text-foreground/30 hover:text-foreground/50 p-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        
        {/* Step 1: Set focus */}
        {step === 1 && (
          <div className="w-full max-w-md text-center">
            <h1 className="text-xl font-light text-foreground/70 mb-8">
              What's the ONE thing that would make today a success?
            </h1>
            
            <input
              type="text"
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetFocus()}
              placeholder="Type your main focus..."
              autoFocus
              className="w-full bg-transparent border-b border-foreground/20 py-3 font-mono text-center text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40"
            />
            
            <button
              onClick={handleSetFocus}
              disabled={!focusInput.trim()}
              className="mt-8 text-sm text-foreground/50 hover:text-foreground/70 disabled:opacity-30"
            >
              Set focus →
            </button>
            
            <button
              onClick={() => setStep(2)}
              className="mt-4 block mx-auto text-xs text-muted-foreground/30 hover:text-muted-foreground/50"
            >
              Skip
            </button>
          </div>
        )}
        
        {/* Step 2: Review/pull from inbox */}
        {step === 2 && (
          <div className="w-full max-w-md">
            <h1 className="text-lg font-light text-foreground/70 text-center mb-8">
              Anything else for today?
            </h1>
            
            {/* Carry over from yesterday */}
            {carryOver.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-3">
                  Still on your plate
                </p>
                {carryOver.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-3 py-2 text-sm text-foreground/60 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                    {task.title}
                  </div>
                ))}
              </div>
            )}
            
            {/* Inbox items */}
            {inboxTasks.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-3">
                  From your inbox
                </p>
                {inboxTasks.map(task => (
                  <div key={task.id} className="py-3 border-b border-foreground/5">
                    {/* Full task text - wrap instead of truncate */}
                    <p className="text-sm text-foreground/60 font-mono mb-2">
                      {task.title}
                    </p>
                    
                    {/* Action button */}
                    <button
                      onClick={() => handleMoveToToday(task.id)}
                      className="text-xs text-foreground/40 hover:text-foreground/60"
                    >
                      + Add to today
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={handleFinish}
              className="w-full mt-8 py-3 text-sm text-foreground/60 hover:text-foreground/80 border border-foreground/10 rounded-lg"
            >
              Start my day
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default MorningRitual;
