import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/hooks/useTasks';
import { useWorkloadSuggestions, WorkloadSuggestion } from '@/ai/adaptiveWorkloadBalancer';
import { ArrowRight, X } from 'lucide-react';

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
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors font-mono"
      >
        💡 {activeSuggestions.length} suggestion{activeSuggestions.length !== 1 ? 's' : ''}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            <div className="space-y-6">
              {activeSuggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-foreground/80 mb-1">
                        {suggestion.taskTitle}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mb-2">
                        {suggestion.reason}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 font-mono">
                        <span>{getBucketLabel(suggestion.fromBucket)}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{getBucketLabel(suggestion.toBucket)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleApply(suggestion)}
                        disabled={applyingIds.has(suggestion.id)}
                        className="text-xs text-foreground/60 hover:text-foreground/90 transition-colors disabled:opacity-50 font-mono"
                      >
                        {applyingIds.has(suggestion.id) ? 'Moving...' : 'Apply'}
                      </button>
                      <button
                        onClick={() => handleDismiss(suggestion.id)}
                        className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
