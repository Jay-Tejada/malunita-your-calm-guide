import { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { X, Sun } from 'lucide-react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';

interface MorningSummaryProps {
  isOpen: boolean;
  onClose: () => void;
}

const MorningSummary = ({ isOpen, onClose }: MorningSummaryProps) => {
  const { tasks, updateTask } = useTasks();
  const navigate = useNavigate();
  const [focusInput, setFocusInput] = useState('');
  const [summary, setSummary] = useState<string[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    generateSummary();
  }, [isOpen, tasks]);

  const generateSummary = async () => {
    setIsLoading(true);
    
    const now = new Date();
    const today = startOfDay(now);
    
    // Gather context
    const todayTasks = tasks?.filter(t => 
      !t.completed && t.scheduled_bucket === 'today'
    ) || [];
    
    const overdueTasks = tasks?.filter(t => 
      !t.completed && 
      t.reminder_time && 
      isBefore(new Date(t.reminder_time), today)
    ) || [];
    
    const upcomingEvents = tasks?.filter(t => 
      !t.completed && 
      t.reminder_time && 
      isToday(new Date(t.reminder_time))
    ) || [];
    
    const inboxCount = tasks?.filter(t => 
      !t.completed && (!t.category || t.category === 'inbox')
    ).length || 0;
    
    // Get high-priority inbox items to suggest
    const inboxTasks = tasks?.filter(t => 
      !t.completed && (!t.category || t.category === 'inbox')
    ) || [];
    
    // Score and pick top suggestions
    const scored = inboxTasks.map(task => {
      let score = 0;
      const title = task.title.toLowerCase();
      const ageInDays = Math.floor((now.getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (ageInDays > 7) score += 3;
      if (title.includes('urgent') || title.includes('asap') || title.includes('today')) score += 4;
      if (title.includes('deadline') || title.includes('due') || title.includes('by ')) score += 3;
      if (title.includes('meeting') || title.includes('call') || title.includes('email')) score += 2;
      
      return { ...task, score };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    
    setSuggestedTasks(scored);

    // Build summary bullets
    const bullets: string[] = [];
    
    // Today's load
    if (todayTasks.length > 0) {
      bullets.push(`${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} on your plate today`);
    } else {
      bullets.push(`No tasks scheduled yet — what's the ONE thing?`);
    }
    
    // Overdue warning
    if (overdueTasks.length > 0) {
      bullets.push(`⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} need attention`);
    }
    
    // Scheduled events
    if (upcomingEvents.length > 0) {
      bullets.push(`📅 ${upcomingEvents.length} time-blocked item${upcomingEvents.length > 1 ? 's' : ''} today`);
      upcomingEvents.slice(0, 2).forEach(e => {
        if (e.reminder_time) {
          const time = format(new Date(e.reminder_time), 'h:mm a');
          bullets.push(`  → ${time}: ${e.title.slice(0, 40)}${e.title.length > 40 ? '...' : ''}`);
        }
      });
    }
    
    // Inbox status
    if (inboxCount > 5) {
      bullets.push(`${inboxCount} items in inbox`);
    }
    
    // Encouragement
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 1) {
      bullets.push(`New week. Make it count.`);
    } else if (dayOfWeek === 5) {
      bullets.push(`Friday — finish strong.`);
    } else {
      bullets.push(`Let's do this.`);
    }
    
    setSummary(bullets);
    setIsLoading(false);
  };

  const handleSetFocus = async () => {
    if (!focusInput.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('tasks').insert({
      user_id: user.id,
      title: focusInput.trim(),
      scheduled_bucket: 'today',
      is_focus: true
    });
    
    setFocusInput('');
    onClose();
  };

  const handleAddToToday = async (taskId: string) => {
    await updateTask({ 
      id: taskId, 
      updates: { scheduled_bucket: 'today' } 
    });
    setSuggestedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto">
        {/* Close */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/30 hover:text-foreground/50"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Sun className="w-5 h-5 text-amber-500/70" />
          <h2 className="font-mono text-lg text-foreground/80">Good Morning</h2>
        </div>
        
        {/* Summary */}
        {isLoading ? (
          <p className="text-sm text-foreground/50">Preparing your day...</p>
        ) : (
          <div className="space-y-2 mb-6">
            {summary.map((bullet, i) => (
              <p 
                key={i} 
                className={`text-sm leading-relaxed ${
                  bullet.startsWith('  →') 
                    ? 'text-foreground/50 pl-4' 
                    : bullet.startsWith('⚠️')
                    ? 'text-amber-600/70'
                    : bullet.startsWith('📅')
                    ? 'text-blue-600/70'
                    : 'text-foreground/70'
                }`}
              >
                {bullet}
              </p>
            ))}
          </div>
        )}
        
        {/* Set focus */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-foreground/40 mb-2">
            Your ONE thing today
          </p>
          <input
            type="text"
            value={focusInput}
            onChange={(e) => setFocusInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetFocus()}
            placeholder="What would make today a success?"
            className="w-full bg-transparent border border-foreground/10 rounded-lg py-2 px-3 font-mono text-sm text-foreground/80 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20"
          />
        </div>
        
        {/* Suggested tasks from inbox */}
        {suggestedTasks.length > 0 && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-foreground/40 mb-2">
              From your inbox
            </p>
            <div className="space-y-2">
              {suggestedTasks.map(task => (
                <div 
                  key={task.id}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <p className="text-sm text-foreground/60 font-mono flex-1">
                    {task.title.slice(0, 60)}{task.title.length > 60 ? '...' : ''}
                  </p>
                  <button
                    onClick={() => handleAddToToday(task.id)}
                    className="text-xs text-foreground/40 hover:text-foreground/60 whitespace-nowrap"
                  >
                    + Today
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-foreground/5">
          <button
            onClick={() => { navigate('/inbox'); onClose(); }}
            className="flex-1 py-2 text-sm text-foreground/60 hover:text-foreground/80 border border-foreground/10 rounded-lg"
          >
            Open Inbox
          </button>
          <button
            onClick={focusInput ? handleSetFocus : onClose}
            className="flex-1 py-2 text-sm bg-foreground/5 text-foreground/70 hover:bg-foreground/10 rounded-lg"
          >
            {focusInput ? 'Set Focus & Start' : 'Start my day'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MorningSummary;
