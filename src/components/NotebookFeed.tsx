import { useState, useEffect } from 'react';
import { format, isToday, isYesterday, isThisWeek, startOfDay } from 'date-fns';
import { CheckCircle2, Circle, Trash2, Clock, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTasksQuery } from '@/hooks/useTasksQuery';
import { useTasks } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SwipeableEntry } from '@/components/mobile/SwipeableEntry';

interface NotebookFeedProps {
  onEntryClick?: (entry: Entry) => void;
  onEntryComplete?: (entryId: string) => void;
  onEntryDelete?: (entryId: string) => void;
}

interface Entry {
  id: string;
  created_at: string;
  title: string;
  context?: string | null;
  category?: string | null;
  completed?: boolean;
  type: 'task' | 'thought' | 'journal';
}

const categoryColors: Record<string, string> = {
  work: 'border-l-blue-400',
  home: 'border-l-green-400',
  personal: 'border-l-purple-400',
  errands: 'border-l-amber-400',
  inbox: 'border-l-muted',
};

const groupByDay = (entries: Entry[]) => {
  const groups: Record<string, Entry[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  entries.forEach((entry) => {
    const date = new Date(entry.created_at);
    if (isToday(date)) {
      groups.today.push(entry);
    } else if (isYesterday(date)) {
      groups.yesterday.push(entry);
    } else if (isThisWeek(date, { weekStartsOn: 0 })) {
      groups.thisWeek.push(entry);
    } else {
      groups.earlier.push(entry);
    }
  });

  return groups;
};

export function NotebookFeed({ onEntryClick, onEntryComplete, onEntryDelete }: NotebookFeedProps) {
  const { tasks, isLoading } = useTasksQuery();
  const { updateTask, deleteTask } = useTasks();
  const isMobile = useIsMobile();
  const [visibleCount, setVisibleCount] = useState(20);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    today: true,
    yesterday: false,
    thisWeek: false,
    earlier: false,
  });

  // Convert tasks to entries
  const entries: Entry[] = tasks?.slice(0, visibleCount).map(task => ({
    id: task.id,
    created_at: task.created_at,
    title: task.title,
    context: task.context,
    category: task.category,
    completed: task.completed,
    type: 'task' as const,
  })) || [];

  const groupedEntries = groupByDay(entries);

  const handleComplete = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    
    await updateTask({
      id: entryId,
      updates: {
        completed: !entry.completed,
        completed_at: !entry.completed ? new Date().toISOString() : null,
      }
    });
    
    onEntryComplete?.(entryId);
  };

  const handleDelete = async (entryId: string) => {
    await deleteTask(entryId);
    onEntryDelete?.(entryId);
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        if (tasks && visibleCount < tasks.length) {
          loadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-foreground-soft">Loading entries...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <style>{`
        .entry-card {
          transition: all 0.2s ease;
        }
        .entry-card:hover {
          transform: translateX(4px);
        }
        .entry-actions {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .entry-card:hover .entry-actions {
          opacity: 1;
        }
      `}</style>

      {/* Today Section - Always visible */}
      {groupedEntries.today.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-foreground mb-3 px-4">Today</h2>
          <div className="space-y-2">
            {groupedEntries.today.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onClick={onEntryClick}
                isMobile={isMobile}
              />
            ))}
          </div>
        </section>
      )}

      {/* Yesterday Section - Collapsible */}
      {groupedEntries.yesterday.length > 0 && (
        <Collapsible
          open={expandedSections.yesterday}
          onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, yesterday: open }))}
        >
          <CollapsibleTrigger className="text-sm font-medium text-foreground-soft hover:text-foreground px-4 py-2 w-full text-left transition-colors">
            Yesterday ({groupedEntries.yesterday.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {groupedEntries.yesterday.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onClick={onEntryClick}
                isMobile={isMobile}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* This Week Section - Collapsible */}
      {groupedEntries.thisWeek.length > 0 && (
        <Collapsible
          open={expandedSections.thisWeek}
          onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, thisWeek: open }))}
        >
          <CollapsibleTrigger className="text-sm font-medium text-foreground-soft hover:text-foreground px-4 py-2 w-full text-left transition-colors">
            This Week ({groupedEntries.thisWeek.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {groupedEntries.thisWeek.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onClick={onEntryClick}
                isMobile={isMobile}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Earlier Section - Collapsible */}
      {groupedEntries.earlier.length > 0 && (
        <Collapsible
          open={expandedSections.earlier}
          onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, earlier: open }))}
        >
          <CollapsibleTrigger className="text-sm font-medium text-foreground-soft hover:text-foreground px-4 py-2 w-full text-left transition-colors">
            Earlier ({groupedEntries.earlier.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {groupedEntries.earlier.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onClick={onEntryClick}
                isMobile={isMobile}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {tasks && visibleCount < tasks.length && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            className="text-sm text-foreground-soft hover:text-foreground transition-colors"
          >
            Load more...
          </button>
        </div>
      )}
    </div>
  );
}

function EntryCard({ 
  entry, 
  onComplete, 
  onDelete, 
  onClick,
  isMobile = false,
}: { 
  entry: Entry; 
  onComplete: (id: string) => void; 
  onDelete: (id: string) => void;
  onClick?: (entry: Entry) => void;
  isMobile?: boolean;
}) {
  const borderColor = entry.category 
    ? categoryColors[entry.category.toLowerCase()] || 'border-l-muted'
    : 'border-l-muted';

  const cardContent = (
    <div
      className={cn(
        "entry-card bg-card border-l-4 rounded-r-card shadow-sm p-4",
        "hover:shadow-malunita-card cursor-pointer",
        borderColor,
        entry.completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(entry.id);
          }}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all",
            entry.completed
              ? "bg-foreground/10 border border-foreground/20"
              : "bg-transparent border border-foreground/20 hover:border-foreground/40"
          )}
        >
          {entry.completed && (
            <Check className="w-3 h-3 text-foreground/60" />
          )}
        </button>

        <div className="flex-1 min-w-0" onClick={() => onClick?.(entry)}>
          <div className="flex items-center gap-2 mb-1">
            <button
              className="font-mono text-xs text-foreground-soft hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(entry);
              }}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              {format(new Date(entry.created_at), 'h:mm a')}
            </button>
            {entry.category && (
              <Badge variant="secondary" className="text-xs">
                {entry.category}
              </Badge>
            )}
          </div>

          <div className={cn(
            "text-foreground text-sm prose prose-sm dark:prose-invert max-w-none",
            entry.completed && "line-through"
          )}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
                h1: ({ children }) => <span className="font-semibold text-base">{children}</span>,
                h2: ({ children }) => <span className="font-semibold text-sm">{children}</span>,
                h3: ({ children }) => <span className="font-medium text-sm">{children}</span>,
                ul: ({ children }) => <ul className="list-disc list-inside my-0">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside my-0">{children}</ol>,
                li: ({ children }) => <li className="my-0">{children}</li>,
              }}
            >
              {entry.title}
            </ReactMarkdown>
          </div>

          {entry.context && (
            <div className="text-foreground-soft text-xs mt-1 prose prose-xs dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-medium">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded">{children}</code>,
                }}
              >
                {entry.context}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="entry-actions flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.id);
            }}
            className="p-1.5 text-foreground-soft hover:text-destructive transition-colors rounded-sm hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Wrap with SwipeableEntry on mobile
  if (isMobile) {
    return (
      <SwipeableEntry
        onComplete={() => onComplete(entry.id)}
        onDelete={() => onDelete(entry.id)}
        disabled={entry.completed}
      >
        {cardContent}
      </SwipeableEntry>
    );
  }

  return cardContent;
}
