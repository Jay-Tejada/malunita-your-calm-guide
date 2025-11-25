import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  reason: string;
  tiny?: boolean;
  priority?: 'must' | 'should' | 'could';
}

interface Chapter {
  chapter_title: string;
  chapter_summary: string;
  steps: Step[];
}

interface TaskPlanPanelProps {
  questTitle: string;
  questSummary: string;
  chapters: Chapter[];
  motivationBoost: string;
  onTaskClick?: (taskId: string) => void;
  onClose?: () => void;
}

export function TaskPlanPanel({
  questTitle,
  questSummary,
  chapters,
  motivationBoost,
  onTaskClick,
  onClose
}: TaskPlanPanelProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]));

  const toggleChapter = (index: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'must':
        return 'text-destructive';
      case 'should':
        return 'text-primary';
      case 'could':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            {questTitle}
          </h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="shrink-0"
            >
              Close
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {questSummary}
        </p>
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-primary">
            {motivationBoost}
          </p>
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {chapters.map((chapter, chapterIndex) => {
          const isExpanded = expandedChapters.has(chapterIndex);
          
          return (
            <Card key={chapterIndex} className="overflow-hidden">
              <button
                onClick={() => toggleChapter(chapterIndex)}
                className="w-full p-4 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">
                    {chapter.chapter_title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {chapter.chapter_summary}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {chapter.steps.length} {chapter.steps.length === 1 ? 'step' : 'steps'}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {chapter.steps.map((step) => (
                        <motion.div
                          key={step.id}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className={cn(
                            "p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group",
                            step.tiny && "border-primary/30"
                          )}
                          onClick={() => onTaskClick?.(step.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              {step.tiny ? (
                                <Clock className="w-4 h-4 text-primary" />
                              ) : (
                                <Check className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className={cn(
                                "text-sm font-medium",
                                getPriorityColor(step.priority)
                              )}>
                                {step.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {step.reason}
                              </p>
                              {step.tiny && (
                                <span className="inline-flex items-center gap-1 text-xs text-primary">
                                  <Clock className="w-3 h-3" />
                                  Quick win
                                </span>
                              )}
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
        })}
      </div>
    </div>
  );
}
