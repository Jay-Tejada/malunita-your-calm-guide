import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RelatedTaskSuggestion {
  task_id: string;
  task_title: string;
  shared_keywords: string[];
  suggested_bucket: 'today' | 'this_week';
}

interface RelatedTaskSuggestionsProps {
  suggestions: RelatedTaskSuggestion[];
  isProcessing: boolean;
  onAccept: (suggestion: RelatedTaskSuggestion) => void;
  onDecline: (taskId: string) => void;
}

export const RelatedTaskSuggestions = ({
  suggestions,
  isProcessing,
  onAccept,
  onDecline,
}: RelatedTaskSuggestionsProps) => {
  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">Related tasks found:</span>
        </div>
        
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion.task_id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-3 bg-muted/50 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {suggestion.task_title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {suggestion.suggested_bucket === 'today' ? (
                      <Calendar className="w-3 h-3" />
                    ) : (
                      <CalendarDays className="w-3 h-3" />
                    )}
                    <span>
                      Move to{' '}
                      <span className="font-medium text-foreground">
                        {suggestion.suggested_bucket === 'today' ? 'Today' : 'This Week'}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {suggestion.shared_keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    onClick={() => onAccept(suggestion)}
                    disabled={isProcessing}
                    title="Accept suggestion"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-muted"
                    onClick={() => onDecline(suggestion.task_id)}
                    disabled={isProcessing}
                    title="Decline suggestion"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
