import { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { X, Moon } from 'lucide-react';
import { isToday, isTomorrow, addDays } from 'date-fns';

interface EveningSummaryProps {
  isOpen: boolean;
  onClose: () => void;
}

const EveningSummary = ({ isOpen, onClose }: EveningSummaryProps) => {
  const { tasks, updateTask } = useTasks();
  const [summary, setSummary] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [incompleteCount, setIncompleteCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    generateSummary();
  }, [isOpen, tasks]);

  const generateSummary = async () => {
    setIsLoading(true);
    
    // Gather context
    const completedToday = tasks?.filter(t => 
      t.completed && 
      t.completed_at && 
      isToday(new Date(t.completed_at))
    ) || [];
    
    const incompleteToday = tasks?.filter(t => 
      !t.completed && 
      t.scheduled_bucket === 'today'
    ) || [];
    
    setIncompleteCount(incompleteToday.length);
    
    const tomorrowTasks = tasks?.filter(t => 
      !t.completed && 
      t.scheduled_bucket === 'tomorrow'
    ) || [];
    
    const upcomingDeadlines = tasks?.filter(t => {
      if (t.completed || !t.reminder_time) return false;
      const due = new Date(t.reminder_time);
      const threeDaysFromNow = addDays(new Date(), 3);
      return due <= threeDaysFromNow;
    }) || [];
    
    const inboxCount = tasks?.filter(t => 
      !t.completed && (!t.category || t.category === 'inbox')
    ).length || 0;

    // Build smart summary bullets
    const bullets: string[] = [];
    
    // Celebrate completions
    if (completedToday.length > 0) {
      bullets.push(`✓ You completed ${completedToday.length} task${completedToday.length > 1 ? 's' : ''} today`);
    }
    
    // Incomplete tasks - carry over?
    if (incompleteToday.length > 0) {
      bullets.push(`${incompleteToday.length} task${incompleteToday.length > 1 ? 's' : ''} didn't get done — move to tomorrow?`);
    }
    
    // Tomorrow preview
    if (tomorrowTasks.length > 0) {
      bullets.push(`Tomorrow: ${tomorrowTasks.length} task${tomorrowTasks.length > 1 ? 's' : ''} waiting`);
      // Show top 2-3 tasks
      tomorrowTasks.slice(0, 3).forEach(t => {
        bullets.push(`  → ${t.title.slice(0, 50)}${t.title.length > 50 ? '...' : ''}`);
      });
    }
    
    // Deadlines warning
    if (upcomingDeadlines.length > 0) {
      bullets.push(`⚠️ ${upcomingDeadlines.length} deadline${upcomingDeadlines.length > 1 ? 's' : ''} in the next 3 days`);
    }
    
    // Inbox nudge
    if (inboxCount > 5) {
      bullets.push(`${inboxCount} items in inbox — consider processing tomorrow morning`);
    }
    
    // Closing thought
    if (completedToday.length >= 3) {
      bullets.push(`Great momentum today. Rest well.`);
    } else if (completedToday.length === 0 && incompleteToday.length > 0) {
      bullets.push(`Tomorrow's a fresh start.`);
    } else {
      bullets.push(`See you tomorrow.`);
    }
    
    setSummary(bullets);
    setIsLoading(false);
  };

  const handleMoveIncompleteToTomorrow = async () => {
    const incompleteToday = tasks?.filter(t => 
      !t.completed && t.scheduled_bucket === 'today'
    ) || [];
    
    for (const task of incompleteToday) {
      await updateTask({ 
        id: task.id, 
        updates: { scheduled_bucket: 'tomorrow' } 
      });
    }
    
    // Refresh summary
    generateSummary();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-xl max-w-md w-full p-6 border border-foreground/5">
        {/* Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/30 hover:text-foreground/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Moon className="w-5 h-5 text-foreground/50" />
          <h2 className="font-mono text-lg text-foreground/80">Tonight's Wind Down</h2>
        </div>
        
        {/* Summary */}
        {isLoading ? (
          <p className="text-sm text-foreground/50">Reviewing your day...</p>
        ) : (
          <div className="space-y-3">
            {summary.map((bullet, i) => (
              <p 
                key={i} 
                className={`text-sm leading-relaxed ${
                  bullet.startsWith('  →') 
                    ? 'text-foreground/50 pl-4' 
                    : bullet.startsWith('✓') 
                    ? 'text-green-600/70'
                    : bullet.startsWith('⚠️')
                    ? 'text-amber-600/70'
                    : 'text-foreground/70'
                }`}
              >
                {bullet}
              </p>
            ))}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-foreground/5">
          {incompleteCount > 0 && (
            <button
              onClick={handleMoveIncompleteToTomorrow}
              className="flex-1 py-2 text-sm text-foreground/60 hover:text-foreground/80 border border-foreground/10 rounded-lg transition-colors"
            >
              Move undone → Tomorrow
            </button>
          )}
          <button
            onClick={onClose}
            className={`${incompleteCount > 0 ? 'flex-1' : 'w-full'} py-2 text-sm bg-foreground/5 text-foreground/70 hover:bg-foreground/10 rounded-lg transition-colors`}
          >
            Good night
          </button>
        </div>
      </div>
    </div>
  );
};

export default EveningSummary;
