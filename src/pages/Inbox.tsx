import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Briefcase, Home, Moon, Trash2, Pencil, ChevronLeft as SwipeIcon, CheckSquare, X, Check, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSwipeable } from 'react-swipeable';
import { CaptureInput } from '@/ui/CaptureInput';
import { colors } from '@/ui/tokens';
import { AppLayout } from '@/ui/AppLayout';
import { hapticSwipe, hapticHint, hapticLight, hapticMedium, hapticCompleteInbox } from '@/utils/haptics';
import { getDualLayerDisplay } from '@/hooks/useDualLayerDisplay';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const SWIPE_HINT_KEY = 'malunita_inbox_swipe_hint_seen';

interface SwipeableTaskRowProps {
  task: any;
  isExpanded: boolean;
  isEditing: boolean;
  editValue: string;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onComplete: () => void;
  onMove: (destination: string) => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleSelect: () => void;
}

// Threshold for collapsing long entries
const COLLAPSE_CHAR_THRESHOLD = 100;

// Thresholds for dynamic spacing based on content length
const SHORT_THRESHOLD = 50;
const MEDIUM_THRESHOLD = 150;

// Get spacing class based on content length for visual rhythm
const getSpacingClass = (length: number): string => {
  if (length < SHORT_THRESHOLD) {
    return 'mt-2'; // Compact: 8px
  } else if (length < MEDIUM_THRESHOLD) {
    return 'mt-4'; // Standard: 16px
  } else {
    return 'mt-5'; // Breathing room: 20px
  }
};

const SwipeableTaskRow = ({
  task,
  isExpanded,
  isEditing,
  editValue,
  isSelectionMode,
  isSelected,
  onToggleExpand,
  onComplete,
  onMove,
  onDelete,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onToggleSelect,
}: SwipeableTaskRowProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  
  // Use shared dual-layer display logic
  const {
    displayText,
    rawContent,
    hasDualLayer,
    isLongEntry,
    lowConfidence,
    hasAiSummary,
    showExpandIndicator,
  } = getDualLayerDisplay(task);
  
  // Reset text expansion when actions panel closes
  useEffect(() => {
    if (!isExpanded) {
      setIsTextExpanded(false);
    }
  }, [isExpanded]);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (isSelectionMode) return; // Disable swipe in selection mode
      // Only treat as horizontal swipe if clearly horizontal (2:1 ratio minimum)
      // and we've moved enough to be intentional
      if (!isHorizontalSwipe && Math.abs(e.deltaX) > 15 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2) {
        setIsHorizontalSwipe(true);
      }
      
      // Only apply swipe offset for confirmed horizontal swipes
      if (isHorizontalSwipe && !isEditing) {
        if (e.dir === 'Left') {
          setSwipeDirection('left');
          setSwipeOffset(Math.min(Math.abs(e.deltaX), 100));
        } else if (e.dir === 'Right') {
          setSwipeDirection('right');
          setSwipeOffset(Math.min(Math.abs(e.deltaX), 100));
        }
      }
    },
    onSwipedLeft: (e) => {
      if (isSelectionMode) return;
      if (isHorizontalSwipe && Math.abs(e.deltaX) > 80 && !isEditing) {
        hapticSwipe();
        setIsExiting(true);
        setTimeout(() => onMove('someday'), 200);
      } else {
        setSwipeOffset(0);
        setSwipeDirection(null);
      }
      setIsHorizontalSwipe(false);
    },
    onSwipedRight: (e) => {
      if (isSelectionMode) return;
      if (isHorizontalSwipe && Math.abs(e.deltaX) > 80 && !isEditing) {
        hapticCompleteInbox();
        // Trigger completion animation sequence
        setIsCompleting(true);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => onComplete(), 180);
        }, 120);
      } else {
        setSwipeOffset(0);
        setSwipeDirection(null);
      }
      setIsHorizontalSwipe(false);
    },
    onTouchEndOrOnMouseUp: () => {
      if (swipeOffset < 80) {
        setSwipeOffset(0);
        setSwipeDirection(null);
      }
      setIsHorizontalSwipe(false);
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 15, // Higher threshold to avoid capturing scroll gestures
    swipeDuration: 500,
  });

  const handleRowClick = () => {
    if (isEditing) return;
    
    if (isSelectionMode) {
      onToggleSelect();
      return;
    }
    
    // If long entry, toggle text expansion first
    if (isLongEntry && !isTextExpanded) {
      setIsTextExpanded(true);
    } else {
      onToggleExpand();
    }
  };

  // INBOX context: Softest animation - fade only, no slide, quick collapse
  // Timing: 80ms exit delay, 120ms total before complete
  const handleCheckboxComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelectionMode) {
      onToggleSelect();
      return;
    }
    // INBOX: Ultra-light haptic - acknowledges without celebrating
    hapticCompleteInbox();
    setIsCompleting(true);
    // Inbox uses minimal timing - quick fade and collapse
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onComplete(), 120);
    }, 80);
  };

  // INBOX: No slide movement (translate-y stays 0), just fade and collapse
  return (
    <div 
      className={cn(
        "relative overflow-hidden transition-all ease-out",
        isExiting ? "max-h-0 opacity-0" : "max-h-[500px]",
        isSelected && "bg-bg-surface-2 border-l-2 border-l-accent-color"
      )}
      style={{ 
        transitionDuration: isExiting ? '150ms' : '300ms',
        transitionProperty: 'max-height, opacity',
      }}
    >
      {/* Complete background (swipe right) */}
      {swipeOffset > 0 && swipeDirection === 'right' && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center justify-start bg-success/10 transition-all"
          style={{ width: '100%' }}
        >
          <div className="px-4 flex items-center gap-2 text-success/70">
            <Check className="w-4 h-4" />
            <span className="text-xs font-mono opacity-70">Done</span>
          </div>
        </div>
      )}
      
      {/* Defer background (swipe left) */}
      {swipeOffset > 0 && swipeDirection === 'left' && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end bg-bg-surface-2 transition-all"
          style={{ width: '100%' }}
        >
          <div className="px-4 flex items-center gap-2 text-text-muted">
            <Moon className="w-4 h-4" />
            <span className="text-xs font-mono opacity-70">Someday</span>
          </div>
        </div>
      )}

      {/* Task content */}
      <div
        {...handlers}
        className="relative bg-bg-surface border-b border-border-subtle"
        style={{ 
          transform: `translateX(${swipeDirection === 'right' ? swipeOffset : -swipeOffset}px)`,
          touchAction: isHorizontalSwipe ? 'pan-x' : 'pan-y',
        }}
      >
        {/* INBOX: Softer fade (opacity 50%), no slide movement */}
        <div 
          className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-all ease-out ${
            isCompleting ? 'opacity-50' : ''
          }`}
          style={{ transitionDuration: '100ms' }}
          onClick={handleRowClick}
        >
          {/* INBOX Checkbox: Subtle scale (1.08), NO ripple, quick fill */}
          <button
            onClick={handleCheckboxComplete}
            className={cn(
              "relative w-4 h-4 mt-1 flex-shrink-0 flex items-center justify-center transition-all ease-out border",
              isSelectionMode 
                ? isSelected 
                  ? "rounded bg-primary border-primary scale-110" 
                  : "rounded border-border-strong hover:border-accent-muted"
                : isCompleting
                  ? "rounded-full bg-success border-success scale-[1.08]"
                  : "rounded-full border-border-strong hover:border-accent-muted active:scale-95"
            )}
            style={{ transitionDuration: '100ms' }}
          >
            {/* NO ripple in Inbox - keep it calm */}
            {isSelectionMode && isSelected && (
              <Check className="w-3 h-3 text-primary-foreground animate-scale-in" />
            )}
            {!isSelectionMode && isCompleting && (
              <Check className="w-3 h-3 text-success-foreground animate-scale-in" />
            )}
          </button>
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
              className="flex-1 font-mono text-sm text-text-primary leading-relaxed bg-transparent border-b border-border-subtle focus:outline-none focus:border-accent-muted"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex-1 relative">
              {/* Primary display: AI summary or title */}
              <p 
                className={cn(
                  "text-sm leading-relaxed tracking-wide whitespace-pre-wrap transition-all ease-out",
                  isLongEntry && !isTextExpanded && "line-clamp-2",
                  isCompleting ? "text-text-muted" : "text-text-secondary"
                )}
                style={{ transitionDuration: '100ms' }}
              >
                {displayText}
              </p>
              
              {/* Expand indicator */}
              {showExpandIndicator && !isTextExpanded && !isCompleting && (
                <div className="flex items-center gap-1 mt-1.5">
                  <ChevronDown className="w-3 h-3 text-text-muted" />
                  <span className="text-xs text-text-muted">
                    {hasDualLayer ? 'Show original' : 'Show more'}
                  </span>
                </div>
              )}
              
              {/* Expanded view: Show raw content below summary */}
              {isTextExpanded && hasDualLayer && (
                <div 
                  className="mt-3 pt-3 border-t border-border-subtle animate-fade-in"
                  style={{ animationDuration: '150ms' }}
                >
                  <p className="text-xs text-text-muted mb-1.5 uppercase tracking-wide">Original</p>
                  <p className="text-sm text-text-secondary leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {rawContent}
                  </p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsTextExpanded(false); }}
                    className="flex items-center gap-1 mt-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <ChevronDown className="w-3 h-3 rotate-180" />
                    Collapse
                  </button>
                </div>
              )}
              
              {/* Expanded view for long entries without dual layer */}
              {isTextExpanded && !hasDualLayer && isLongEntry && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsTextExpanded(false); }}
                  className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
                >
                  <ChevronDown className="w-3 h-3 rotate-180" />
                  Collapse
                </button>
              )}
              
              {/* Low confidence indicator */}
              {hasAiSummary && lowConfidence && !isTextExpanded && (
                <p className="text-xs text-text-muted mt-1">Low confidence summary</p>
              )}
              
              {/* Fade gradient for collapsed long entries */}
              {isLongEntry && !isTextExpanded && (
                <div 
                  className="absolute bottom-6 left-0 right-0 h-6 pointer-events-none bg-gradient-to-b from-transparent to-bg-surface"
                />
              )}
            </div>
          )}
        </div>

        {/* Expanded actions - softer styling */}
        {isExpanded && !isSelectionMode && (
          <div className="flex items-center gap-1 px-5 py-3 pl-14 bg-bg-surface-2">
            <button
              onClick={() => onMove('today')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-muted hover:text-text-secondary rounded transition-colors"
            >
              <Star className="w-3 h-3" />
              Today
            </button>
            <button
              onClick={() => onMove('someday')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-muted hover:text-text-secondary rounded transition-colors"
            >
              <Moon className="w-3 h-3" />
              Someday
            </button>
            <button
              onClick={() => onMove('work')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-muted hover:text-text-secondary rounded transition-colors"
            >
              <Briefcase className="w-3 h-3" />
              Work
            </button>
            <button
              onClick={() => onMove('home')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-muted hover:text-text-secondary rounded transition-colors"
            >
              <Home className="w-3 h-3" />
              Home
            </button>
            <button
              onClick={onStartEdit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-text-muted hover:text-text-secondary rounded transition-colors ml-auto"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-destructive/70 hover:text-destructive rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
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
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  
  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Forensic: log which element is actually at the very bottom of the viewport
  useEffect(() => {
    const log = () => {
      const x = Math.floor(window.innerWidth / 2);
      const ys = [window.innerHeight - 2, window.innerHeight - 40, window.innerHeight - 80];
      const snapshot = ys.map((y) => {
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        if (!el) return { y, el: null };
        const cs = window.getComputedStyle(el);
        return {
          y,
          tag: el.tagName,
          id: el.id || undefined,
          className: el.className || undefined,
          bg: cs.backgroundColor,
          position: cs.position,
          bottom: cs.bottom,
          height: cs.height,
        };
      });
      console.log('[white-bar-debug] elementFromPoint snapshots', snapshot);
    };

    // Run once after paint, and keep logging on scroll/resize (capture scroll events too)
    const raf = requestAnimationFrame(() => requestAnimationFrame(log));
    window.addEventListener('resize', log);
    document.addEventListener('scroll', log, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', log);
      document.removeEventListener('scroll', log, true);
    };
  }, []);

  // Check if swipe hint should be shown
  useEffect(() => {
    const hintSeen = localStorage.getItem(SWIPE_HINT_KEY);
    if (!hintSeen) {
      setShowSwipeHint(true);
    }
  }, []);

  // Dismiss hint after user interacts or after delay
  const dismissSwipeHint = () => {
    setShowSwipeHint(false);
    localStorage.setItem(SWIPE_HINT_KEY, 'true');
  };

  // Auto-dismiss hint after 5 seconds, trigger haptic when shown
  useEffect(() => {
    if (showSwipeHint && tasks.length > 0) {
      hapticHint(); // Gentle double-tap to draw attention
      const timer = setTimeout(dismissSwipeHint, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint, tasks.length]);

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

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
    setExpandedTask(null);
  };

  const toggleSelect = (taskId: string) => {
    hapticLight(); // Tactile feedback on selection toggle
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(tasks.map(t => t.id)));
  };

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

  // Batch actions
  const batchMove = async (destination: string) => {
    const idsToMove = Array.from(selectedIds);
    if (idsToMove.length === 0) return;

    // Optimistically update UI
    setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    setIsSelectionMode(false);

    const updates: any = { category: destination };
    if (destination === 'today') {
      updates.scheduled_bucket = 'today';
    } else if (destination === 'someday') {
      updates.scheduled_bucket = 'someday';
      updates.category = 'inbox';
    }

    await supabase
      .from('tasks')
      .update(updates)
      .in('id', idsToMove);
  };

  const batchDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    // Optimistically update UI
    setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setShowDeleteConfirm(false);

    await supabase
      .from('tasks')
      .delete()
      .in('id', idsToDelete);
  };

  const handleDeleteClick = () => {
    hapticMedium();
    setShowDeleteConfirm(true);
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
      rightAction={
        <button 
          onClick={toggleSelectionMode}
          className={`text-sm transition-colors ${isSelectionMode ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
        >
          {isSelectionMode ? 'Done' : tasks.length > 0 ? <CheckSquare className="w-4 h-4" /> : tasks.length}
        </button>
      }
    >

      {/* Header subtitle */}
      <div className="px-5 pt-2 pb-4">
        <p className="text-xs text-muted-foreground/40 tracking-wide">
          {isSelectionMode 
            ? `${selectedIds.size} selected` 
            : 'Just intake. Nothing here needs action yet.'
          }
        </p>
        {isSelectionMode && tasks.length > 0 && (
          <button 
            onClick={selectAll}
            className="text-xs text-primary/60 hover:text-primary mt-1"
          >
            Select all
          </button>
        )}
      </div>

      {/* Quick capture - animated hide in selection mode */}
      <div 
        className={`px-5 overflow-hidden transition-all duration-300 ease-out ${
          isSelectionMode ? 'max-h-0 opacity-0 pb-0' : 'max-h-20 opacity-100 pb-5'
        }`}
      >
        <CaptureInput
          placeholder="Capture a thought..."
          onSubmit={(value) => addTask(value)}
        />
      </div>

      {/* Task list - dynamic spacing based on content length */}
      <div className="px-1 pb-4">
      {tasks.map((task, index) => (
          <div 
            key={task.id} 
            className={`relative ${index === 0 ? '' : getSpacingClass(task.title.length)}`}
          >
            {/* Swipe hint on first task */}
            {showSwipeHint && index === 0 && !isSelectionMode && (
              <div 
                className="absolute inset-0 z-10 flex items-center justify-end pointer-events-none animate-pulse"
                onClick={dismissSwipeHint}
              >
                <div className="flex items-center gap-1 pr-6 text-primary/40">
                  <SwipeIcon className="w-4 h-4 animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDirection: 'alternate' }} />
                  <span className="text-xs opacity-70">swipe to defer</span>
                </div>
              </div>
            )}
            <div onClick={showSwipeHint && index === 0 ? dismissSwipeHint : undefined}>
              <SwipeableTaskRow
                task={task}
                isExpanded={expandedTask === task.id}
                isEditing={editingTask === task.id}
                editValue={editValue}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(task.id)}
                onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                onComplete={() => completeTask(task.id)}
                onMove={(destination) => {
                  if (showSwipeHint) dismissSwipeHint();
                  moveTask(task.id, destination);
                }}
                onDelete={() => deleteTask(task.id)}
                onStartEdit={() => startEditing(task)}
                onEditChange={setEditValue}
                onSaveEdit={() => saveEdit(task.id)}
                onCancelEdit={() => setEditingTask(null)}
                onToggleSelect={() => toggleSelect(task.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom fade gradient to indicate scrollable content */}
      {tasks.length > 5 && (
        <div 
          className="pointer-events-none fixed bottom-0 left-0 right-0 h-16 z-40 bg-gradient-to-t from-bg-app to-transparent"
          style={{
            opacity: isSelectionMode && selectedIds.size > 0 ? 0 : 1,
            transition: 'opacity 0.3s ease-out',
          }}
        />
      )}

      {/* Batch action bar - animated slide up */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/30 px-4 py-3 safe-area-pb z-50 transition-all duration-300 ease-out ${
          isSelectionMode && selectedIds.size > 0 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => batchMove('today')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Star className="w-5 h-5" />
            <span className="text-xs">Today</span>
          </button>
          <button
            onClick={() => batchMove('someday')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs">Someday</span>
          </button>
          <button
            onClick={() => batchMove('work')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-xs">Work</span>
          </button>
          <button
            onClick={() => batchMove('home')}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex flex-col items-center gap-1 px-4 py-2 text-destructive/60 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-xs">Delete</span>
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={batchDelete}
              className="flex-1 sm:flex-none"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <div className="px-5 py-20 text-center">
          <p className="text-sm text-muted-foreground/60 mb-2">Nothing captured yet</p>
          <p className="text-xs text-muted-foreground/30">
            Write a thought above. No pressure.
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
