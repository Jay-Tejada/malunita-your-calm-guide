import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Briefcase, Home, Moon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Inbox = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch inbox tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'inbox')
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (data) setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!inputValue.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: inputValue.trim(),
        category: 'inbox',
      })
      .select()
      .single();

    if (data) {
      setTasks(prev => [data, ...prev]);
      setInputValue('');
    }
  };

  const completeTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));

    await supabase
      .from('tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId);
  };

  const moveTask = async (taskId: string, destination: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setExpandedTask(null);

    const updates: any = { category: destination };
    
    // If moving to today, also set scheduled_bucket
    if (destination === 'today') {
      updates.scheduled_bucket = 'today';
    }

    await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setExpandedTask(null);

    await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-3 border-b border-foreground/5 relative">
        <button 
          onClick={() => navigate('/')} 
          className="absolute left-4 p-2 -ml-2"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/40" />
        </button>
        <h1 className="font-mono text-sm text-foreground/70">Inbox</h1>
        <span className="absolute right-4 text-xs text-foreground/30">
          {tasks.length}
        </span>
      </header>

      {/* Quick capture */}
      <div className="px-4 py-3 border-b border-foreground/5">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Capture a thought..."
          className="w-full bg-transparent font-mono text-sm text-foreground/70 placeholder:text-foreground/30 focus:outline-none"
        />
      </div>

      {/* Task list */}
      <div className="divide-y divide-foreground/5">
        {tasks.map(task => (
          <div key={task.id}>
            {/* Task row */}
            <div 
              className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-foreground/[0.01]"
              onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  completeTask(task.id);
                }}
                className="w-5 h-5 mt-0.5 rounded-full border border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 flex-shrink-0 transition-colors"
              />
              <p className="flex-1 font-mono text-sm text-foreground/70 leading-relaxed">
                {task.title}
              </p>
            </div>

            {/* Expanded actions */}
            {expandedTask === task.id && (
              <div className="flex items-center gap-1 px-4 py-2 pl-12 bg-foreground/[0.01] border-t border-foreground/5">
                <button
                  onClick={() => moveTask(task.id, 'today')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-foreground/50 hover:text-foreground/70 hover:bg-foreground/5 rounded transition-colors"
                >
                  <Star className="w-3.5 h-3.5" />
                  Today
                </button>
                <button
                  onClick={() => moveTask(task.id, 'someday')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-foreground/50 hover:text-foreground/70 hover:bg-foreground/5 rounded transition-colors"
                >
                  <Moon className="w-3.5 h-3.5" />
                  Someday
                </button>
                <button
                  onClick={() => moveTask(task.id, 'work')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-foreground/50 hover:text-foreground/70 hover:bg-foreground/5 rounded transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Work
                </button>
                <button
                  onClick={() => moveTask(task.id, 'home')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-foreground/50 hover:text-foreground/70 hover:bg-foreground/5 rounded transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  Home
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-400/5 rounded transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-foreground/40 mb-1">Inbox empty</p>
          <p className="text-xs text-foreground/30">
            Capture thoughts above, organize later
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-foreground/30">Loading...</p>
        </div>
      )}
    </div>
  );
};

export default Inbox;
