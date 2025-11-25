import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/hooks/useTasks';
import { motion } from 'framer-motion';

interface PlanQuestGroupProps {
  planId: string;
  planTitle: string;
  tasks: Task[];
  questProgress?: {
    current: number;
    total: number;
    completed: boolean;
  };
  children: React.ReactNode;
}

export function PlanQuestGroup({ 
  planId, 
  planTitle, 
  tasks, 
  questProgress,
  children 
}: PlanQuestGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5">
      {/* Plan header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-sm">{planTitle}</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {questProgress?.completed && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              Completed! 🎉
            </Badge>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
            <Badge variant="outline" className="text-xs">
              Quest
            </Badge>
          </div>
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-muted relative overflow-hidden">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0",
            questProgress?.completed 
              ? "bg-green-500" 
              : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Task list */}
      {isExpanded && (
        <div className="p-4 pt-2 space-y-2">
          {children}
        </div>
      )}
    </Card>
  );
}
