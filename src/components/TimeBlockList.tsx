import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { TimeBlock } from '@/hooks/useTimeBlocker';

interface TimeBlockListProps {
  blocks: TimeBlock[];
  onTaskClick?: (taskId: string) => void;
}

export const TimeBlockList = ({ blocks, onTaskClick }: TimeBlockListProps) => {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Today's Flow</h3>
      </div>
      
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
            onClick={() => block.tasks[0] && onTaskClick?.(block.tasks[0].id)}
          >
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                {block.start_time}–{block.end_time}
              </span>
              <span className="text-xs font-medium text-primary">
                {block.label}
              </span>
            </div>
            
            {block.tasks.length > 0 && (
              <div className="space-y-0.5">
                {block.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="text-sm text-foreground/80 group-hover:text-foreground transition-colors"
                  >
                    • {task.title}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
