import { useState, useEffect } from "react";
import { Task } from "@/hooks/useTasks";
import { classifyTaskWithAI } from "@/lib/tinyTaskDetector";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";

interface TinyTaskClassificationBadgeProps {
  task: Task;
}

export const TinyTaskClassificationBadge = ({ task }: TinyTaskClassificationBadgeProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [classification, setClassification] = useState<{
    isTiny: boolean;
    reason: string;
  } | null>(null);

  useEffect(() => {
    const classify = async () => {
      setIsLoading(true);
      const result = await classifyTaskWithAI(task);
      setClassification({
        isTiny: result.isTiny,
        reason: result.reason
      });
      setIsLoading(false);
    };

    classify();
  }, [task.id, task.title, task.context]);

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1 font-light">
        <Loader2 className="w-3 h-3 animate-spin" />
        Analyzing...
      </Badge>
    );
  }

  if (!classification) return null;

  if (classification.isTiny) {
    return (
      <Badge variant="secondary" className="gap-1 font-light bg-primary/10 text-primary border-primary/20">
        <Sparkles className="w-3 h-3" />
        Tiny Task
      </Badge>
    );
  }

  return null;
};
