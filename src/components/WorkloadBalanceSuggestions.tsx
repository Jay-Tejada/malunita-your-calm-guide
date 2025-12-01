import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '@/hooks/useTasks';
import { useWorkloadSuggestions, WorkloadSuggestion } from '@/ai/adaptiveWorkloadBalancer';
import { X } from 'lucide-react';

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

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
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
            className="mt-3 space-y-2"
          >
            {activeSuggestions.map((suggestion) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center justify-between gap-3"
              >
                <p className="text-sm font-mono text-foreground/80 flex-1">
                  {suggestion.taskTitle}
                </p>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => handleApply(suggestion)}
                    disabled={applyingIds.has(suggestion.id)}
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors disabled:opacity-50"
                  >
                    {applyingIds.has(suggestion.id) ? 'Applying...' : 'Apply'}
                  </button>
                  <button
                    onClick={() => handleDismiss(suggestion.id)}
                    className="text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
