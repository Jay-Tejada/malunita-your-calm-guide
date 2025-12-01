import { useState } from 'react';
import { useTasks, Task } from '@/hooks/useTasks';
import { X, ArrowRight, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MorningRitualProps {
  onComplete: () => void;
  onDismiss: () => void;
}

const getSmartInboxPicks = (tasks: Task[] | undefined) => {
  const inbox = tasks?.filter(t => 
    (t.category === 'inbox' || !t.category) && !t.completed
  ) || [];
  
  const now = new Date();
  
  // Score each task
  const scored = inbox.map(task => {
    let score = 0;
    let reason = '';
    
    // Age: older items get higher priority (been waiting)
    const ageInDays = Math.floor((now.getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays > 7) {
      score += 3;
      reason = `Waiting ${ageInDays} days`;
    } else if (ageInDays > 3) {
      score += 2;
      reason = `Added ${ageInDays} days ago`;
    }
    
    // Keywords suggesting urgency
    const title = task.title.toLowerCase();
    if (title.includes('today') || title.includes('asap') || title.includes('urgent')) {
      score += 4;
      reason = 'Marked urgent';
    }
    if (title.includes('by ') || title.includes('deadline') || title.includes('due')) {
      score += 3;
      reason = 'Has a deadline';
    }
    
    // Time-specific mentions
    if (title.includes('10am') || title.includes('morning') || title.includes('am')) {
      score += 2;
      reason = 'Time-sensitive';
    }
    
    // Work-related (assuming weekday morning)
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    if (isWeekday && (title.includes('client') || title.includes('meeting') || title.includes('email') || title.includes('pro'))) {
      score += 2;
      reason = reason || 'Work-related';
    }
    
    // Short tasks (likely quick wins)
    if (task.title.length < 40) {
      score += 1;
      reason = reason || 'Quick task';
    }
    
    // Default reason if none found
    if (!reason) {
      reason = 'From your inbox';
    }
    
    return { ...task, score, reason };
  });
  
  // Sort by score, take top 3
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

const MorningRitual = ({ onComplete, onDismiss }: MorningRitualProps) => {
  const [step, setStep] = useState(1);
  const [focusInput, setFocusInput] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { tasks, updateTask } = useTasks();
  
  // Get smart inbox picks with reasoning
  const smartPicks = getSmartInboxPicks(tasks);
  
  // Get all inbox items
  const allInbox = tasks?.filter(t => (t.category === 'inbox' || !t.category) && !t.completed) || [];
  
  // Determine which tasks to display
  const displayedTasks = showAll ? allInbox : smartPicks;
  
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
            
            {/* Smart inbox picks with reasoning */}
            {displayedTasks.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-3">
                  From your inbox
                </p>
                {displayedTasks.map(task => (
                  <div key={task.id} className="py-3 border-b border-foreground/5">
                    {/* Task text */}
                    <p className="text-sm text-foreground/60 font-mono mb-1">
                      {task.title}
                    </p>
                    
                    {/* Reason tag + action */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/40">
                        {showAll ? 'From your inbox' : (task as any).reason}
                      </span>
                      <button
                        onClick={() => handleMoveToToday(task.id)}
                        className="text-xs text-foreground/40 hover:text-foreground/60"
                      >
                        + Today
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Toggle to show all inbox items */}
                {allInbox.length > 3 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full text-center text-xs text-muted-foreground/40 hover:text-muted-foreground/60 py-2 mt-2"
                  >
                    {showAll ? 'Show less' : `View all ${allInbox.length} inbox items`}
                  </button>
                )}
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
