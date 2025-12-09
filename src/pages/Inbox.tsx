import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Briefcase, Home, Moon, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TaskRow } from '@/ui/tasks/TaskRow';
import { CaptureInput } from '@/ui/CaptureInput';
import { colors } from '@/ui/tokens';
import { AppLayout } from '@/ui/AppLayout';

const Inbox = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
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

  const addTask = async (title?: string) => {
    const taskTitle = title || inputValue.trim();
    if (!taskTitle) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: taskTitle,
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

  const startEditing = (task: any) => {
    setEditingTask(task.id);
    setEditValue(task.title);
  };

  const saveEdit = async (taskId: string) => {
    if (!editValue.trim()) return;
    
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, title: editValue.trim() } : t
    ));
    setEditingTask(null);

    await supabase
      .from('tasks')
      .update({ title: editValue.trim() })
      .eq('id', taskId);
  };

  return (
    <AppLayout 
      title="Inbox" 
      showBack 
      rightAction={<span style={{ color: colors.text.muted }}>{tasks.length}</span>}
    >

      {/* Quick capture */}
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
        <CaptureInput
          placeholder="Capture a thought..."
          onSubmit={(value) => addTask(value)}
        />
      </div>

      {/* Task list */}
      <div className="divide-y divide-border">
        {tasks.map(task => (
          <div key={task.id}>
            {/* Task row */}
            <div 
              className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                if (editingTask !== task.id) {
                  setExpandedTask(expandedTask === task.id ? null : task.id);
                }
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  completeTask(task.id);
                }}
                className="w-5 h-5 mt-0.5 rounded-full border border-muted-foreground hover:border-foreground hover:bg-muted flex-shrink-0 transition-colors"
              />
              {editingTask === task.id ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(task.id);
                    if (e.key === 'Escape') setEditingTask(null);
                  }}
                  onBlur={() => saveEdit(task.id)}
                  autoFocus
                  className="flex-1 font-mono text-sm text-foreground leading-relaxed bg-transparent border-b border-border focus:outline-none focus:border-accent"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="flex-1 font-mono text-sm text-foreground leading-relaxed">
                  {task.title}
                </p>
              )}
            </div>

            {/* Expanded actions */}
            {expandedTask === task.id && (
              <div className="flex items-center gap-1 px-4 py-2 pl-12 bg-muted/30 border-t border-border">
                <button
                  onClick={() => moveTask(task.id, 'today')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                >
                  <Star className="w-3.5 h-3.5" />
                  Today
                </button>
                <button
                  onClick={() => moveTask(task.id, 'someday')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                >
                  <Moon className="w-3.5 h-3.5" />
                  Someday
                </button>
                <button
                  onClick={() => moveTask(task.id, 'work')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Work
                </button>
                <button
                  onClick={() => moveTask(task.id, 'home')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  Home
                </button>
                <button
                  onClick={() => startEditing(task)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors ml-auto"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
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
          <p className="text-sm text-muted-foreground mb-1">Inbox empty</p>
          <p className="text-xs text-muted-foreground/70">
            Capture thoughts above, organize later
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}
    </AppLayout>
  );
};

export default Inbox;
