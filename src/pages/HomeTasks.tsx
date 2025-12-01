import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';

const HomeTasks = () => {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const [input, setInput] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  
  const homeTasks = tasks?.filter(t => 
    t.category === 'home' && !t.completed
  ) || [];
  
  const completedTasks = tasks?.filter(t => 
    t.category === 'home' && t.completed
  ) || [];

  const handleCapture = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from('tasks').insert({
        user_id: user.id,
        title: input.trim(),
        category: 'home'
      });
      
      setInput('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        <button onClick={() => navigate('/')} className="text-foreground/30 hover:text-foreground/50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground/80">Home</span>
        <div className="w-5" />
      </div>

      <div className="px-4 pt-4">
        {/* Capture input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCapture}
          placeholder="Add a home task..."
          className="w-full bg-transparent border-b border-foreground/10 py-3 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20"
        />

        {/* Task list */}
        <div className="mt-4">
          {homeTasks.length === 0 ? (
            <p className="text-muted-foreground/30 text-center py-12">No home tasks</p>
          ) : (
            <div className="space-y-2">
              {homeTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 py-3">
                  <button
                    onClick={() => updateTask({ id: task.id, updates: { completed: true } })}
                    className="w-5 h-5 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0 mt-0.5"
                  />
                  <span className="font-mono text-sm text-foreground/80">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Show completed toggle */}
        {completedTasks.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full text-center text-xs text-muted-foreground/30 hover:text-muted-foreground/50 py-4"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default HomeTasks;
