import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, MoreHorizontal, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { TaskCategoryFeedback } from "@/components/TaskCategoryFeedback";
import { useFocusExplainer } from "@/hooks/useFocusExplainer";
import { motion, AnimatePresence } from "framer-motion";

interface FocusCardProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onRemoveFromFocus: () => void;
}

export const FocusCard = ({ task, onToggle, onDelete, onRemoveFromFocus }: FocusCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { generateExplanation, explanation, isLoading } = useFocusExplainer();

  // Generate explanation on mount or when task changes
  useEffect(() => {
    if (task.id && !explanation) {
      // Check if we already have an explanation in context
      const hasExplanation = task.context && task.context.includes("Here's why this matters");
      if (hasExplanation) {
        // Already has explanation, don't regenerate
        return;
      }
      
      // Extract cluster label and unlocks count if available
      let clusterLabel: string | undefined;
      let unlocksCount: number | undefined;
      
      // Note: primary_focus_alignment is stored in DB but not in Task type yet
      // For now, we'll just pass the basic info
      
      generateExplanation(task.id, task.title, clusterLabel, unlocksCount);
    }
  }, [task.id]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-0">
      <Card className="p-6 transition-calm hover:shadow-lg border-2 hover:border-accent">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={task.completed}
            onCheckedChange={onToggle}
            className="mt-1 h-6 w-6 rounded-full data-[state=checked]:bg-success data-[state=checked]:border-success transition-calm"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-normal mb-1 transition-calm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.title}
            </h3>
            
            {/* Always show explanation if available */}
            {(task.context || explanation?.explanation) && (
              <button
                onClick={handleToggleExpand}
                className="w-full text-left mt-2 group"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-primary/90 leading-relaxed flex-1 group-hover:text-primary transition-colors">
                    {task.context || explanation?.explanation || 'Loading explanation...'}
                  </p>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                </div>
              </button>
            )}

            {/* Expanded metadata */}
            <AnimatePresence>
              {isExpanded && explanation?.metadata && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    {explanation.metadata.clusterLabel && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Cluster:</span>
                        <span className="px-2 py-0.5 bg-primary/10 rounded-full text-primary">
                          {explanation.metadata.clusterLabel}
                        </span>
                      </div>
                    )}
                    {explanation.metadata.unlocksCount !== undefined && explanation.metadata.unlocksCount > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Unlocks:</span>
                        <span className="font-medium text-foreground">
                          {explanation.metadata.unlocksCount} {explanation.metadata.unlocksCount === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Burnout risk:</span>
                      <span className={`font-medium ${
                        parseInt(explanation.metadata.burnoutRisk) >= 60 ? 'text-orange-500' :
                        parseInt(explanation.metadata.burnoutRisk) >= 40 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {explanation.metadata.burnoutRisk}%
                      </span>
                    </div>
                    {explanation.metadata.hasUpcomingStorm && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-purple-500/10 rounded-full text-purple-500">
                          ⚡ Storm day incoming
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemoveFromFocus}
              className="text-muted-foreground hover:text-foreground transition-calm"
              title="Remove from focus"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive transition-calm"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Show feedback component for voice-created tasks */}
      {task.input_method === 'voice' && !task.completed && (
        <TaskCategoryFeedback
          taskId={task.id}
          taskTitle={task.title}
          currentCategory={task.category || 'inbox'}
          originalText={task.title}
        />
      )}
    </div>
  );
};
