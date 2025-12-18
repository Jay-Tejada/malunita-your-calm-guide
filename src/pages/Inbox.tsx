import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Briefcase, Home, Moon, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSwipeable } from 'react-swipeable';
import { CaptureInput } from '@/ui/CaptureInput';
import { colors } from '@/ui/tokens';
import { AppLayout } from '@/ui/AppLayout';
import { hapticSwipe } from '@/utils/haptics';

interface SwipeableTaskRowProps {
  task: any;
  isExpanded: boolean;
  isEditing: boolean;
  editValue: string;
  onToggleExpand: () => void;
  onComplete: () => void;
  onMove: (destination: string) => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

const SwipeableTaskRow = ({
  task,
  isExpanded,
  isEditing,
  editValue,
  onToggleExpand,
  onComplete,
  onMove,
  onDelete,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}: SwipeableTaskRowProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeferring, setIsDeferring] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === 'Left' && !isEditing) {
        setSwipeOffset(Math.min(Math.abs(e.deltaX), 100));
      }
    },
    onSwipedLeft: (e) => {
      if (Math.abs(e.deltaX) > 80 && !isEditing) {
        hapticSwipe();
        setIsDeferring(true);
        setTimeout(() => onMove('someday'), 200);
      } else {
        setSwipeOffset(0);
      }
    },
    onSwipedRight: () => {
      setSwipeOffset(0);
    },
    onTouchEndOrOnMouseUp: () => {
      if (swipeOffset < 80) {
        setSwipeOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  return (
    <div className={`relative overflow-hidden transition-all duration-200 ${isDeferring ? 'h-0 opacity-0' : ''}`}>
      {/* Defer background */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-primary/10 transition-all"
        style={{ width: swipeOffset > 0 ? '100%' : 0 }}
      >
        <div className="px-4 flex items-center gap-2 text-primary/70">
          <Moon className="w-4 h-4" />
          <span className="text-xs font-mono">Someday</span>
        </div>
      </div>

      {/* Task content */}
      <div
        {...handlers}
        className="relative bg-background"
        style={{ transform: `translateX(-${swipeOffset}px)` }}
      >
        <div 
          className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            if (!isEditing) {
              onToggleExpand();
            }
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="w-5 h-5 mt-0.5 rounded-full border border-muted-foreground hover:border-foreground hover:bg-muted flex-shrink-0 transition-colors"
          />
          {isEditing ? (
            <input
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              onBlur={onSaveEdit}
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
        {isExpanded && (
          <div className="flex items-center gap-1 px-4 py-2 pl-12 bg-muted/30 border-t border-border">
            <button
              onClick={() => onMove('today')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              Today
            </button>
            <button
              onClick={() => onMove('someday')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <Moon className="w-3.5 h-3.5" />
              Someday
            </button>
            <button
              onClick={() => onMove('work')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Work
            </button>
            <button
              onClick={() => onMove('home')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </button>
            <button
              onClick={onStartEdit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors ml-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
    
    // Set scheduled_bucket for special destinations
    if (destination === 'today') {
      updates.scheduled_bucket = 'today';
    } else if (destination === 'someday') {
      updates.scheduled_bucket = 'someday';
      updates.category = 'inbox'; // Keep category as inbox, use bucket for deferred state
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
          <SwipeableTaskRow
            key={task.id}
            task={task}
            isExpanded={expandedTask === task.id}
            isEditing={editingTask === task.id}
            editValue={editValue}
            onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            onComplete={() => completeTask(task.id)}
            onMove={(destination) => moveTask(task.id, destination)}
            onDelete={() => deleteTask(task.id)}
            onStartEdit={() => startEditing(task)}
            onEditChange={setEditValue}
            onSaveEdit={() => saveEdit(task.id)}
            onCancelEdit={() => setEditingTask(null)}
          />
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
