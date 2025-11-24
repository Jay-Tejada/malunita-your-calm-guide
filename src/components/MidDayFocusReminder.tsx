import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { TaskEditDialog } from './TaskEditDialog';
import { Task } from '@/hooks/useTasks';

interface MidDayFocusReminderProps {
  focusTask: Task;
  onDismiss: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

export const MidDayFocusReminder = ({ focusTask, onDismiss, onSave }: MidDayFocusReminderProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    onDismiss();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full"
      >
        <button
          onClick={handleClick}
          className="w-full group relative flex items-center gap-3 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            Middle of the day check-in — want help getting your ONE thing moving?
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </button>
      </motion.div>

      <TaskEditDialog
        open={isEditDialogOpen}
        task={focusTask}
        onSave={onSave}
        onClose={handleEditClose}
      />
    </>
  );
};

