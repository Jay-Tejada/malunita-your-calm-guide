import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/hooks/useTasks';
import { useWorkloadSuggestions, WorkloadSuggestion } from '@/ai/adaptiveWorkloadBalancer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, ArrowRight, TrendingDown, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkloadBalanceSuggestionsProps {
  tasks: Task[] | undefined;
  onApplySuggestion: (suggestion: WorkloadSuggestion) => Promise<void>;
}

export const WorkloadBalanceSuggestions = ({ 
  tasks, 
  onApplySuggestion 
}: WorkloadBalanceSuggestionsProps) => {
  const suggestions = useWorkloadSuggestions(tasks);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());

  const activeSuggestions = suggestions.filter(s => !dismissedIds.has(s.id));

  if (activeSuggestions.length === 0) return null;

  const handleApply = async (suggestion: WorkloadSuggestion) => {
    setApplyingIds(prev => new Set(prev).add(suggestion.id));
    try {
      await onApplySuggestion(suggestion);
      setDismissedIds(prev => new Set(prev).add(suggestion.id));
    } finally {
      setApplyingIds(prev => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const getBucketLabel = (bucket: string) => {
    const labels: Record<string, string> = {
      today: 'Today',
      thisWeek: 'This Week',
      soon: 'Someday',
    };
    return labels[bucket] || bucket;
  };

  return (
    <Card className="mb-4 overflow-hidden border-primary/20 bg-primary/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Workload Suggestions ({activeSuggestions.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {activeSuggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={cn(
                    "p-3 rounded-lg border bg-card",
                    suggestion.type === 'move_out' ? 'border-orange-500/30' : 'border-green-500/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      suggestion.type === 'move_out' ? 'bg-orange-500/10' : 'bg-green-500/10'
                    )}>
                      {suggestion.type === 'move_out' ? (
                        <TrendingDown className="w-4 h-4 text-orange-500" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground/90 mb-1">
                        {suggestion.taskTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {suggestion.reason}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{getBucketLabel(suggestion.fromBucket)}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium">{getBucketLabel(suggestion.toBucket)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApply(suggestion)}
                        disabled={applyingIds.has(suggestion.id)}
                        className="h-7 px-2 text-xs"
                      >
                        {applyingIds.has(suggestion.id) ? 'Moving...' : 'Apply'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(suggestion.id)}
                        className="h-7 px-2"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
