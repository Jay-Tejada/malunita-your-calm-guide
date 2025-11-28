import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Calendar, Archive, X, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { useStaleTasks } from "@/hooks/useStaleTasks";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const STORAGE_KEY = "last_stale_task_check";
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export function StaleTasksPopup() {
  const { staleTasks, loading, archiveTask, scheduleForToday, dismissForNow } = useStaleTasks();
  const [showPopup, setShowPopup] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  useEffect(() => {
    // Check if we should show the popup
    const lastCheck = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    
    if (!lastCheck || now - parseInt(lastCheck) >= CHECK_INTERVAL) {
      if (!loading && staleTasks.length > 0) {
        // Show after a short delay to feel more natural
        const timer = setTimeout(() => {
          setShowPopup(true);
          localStorage.setItem(STORAGE_KEY, now.toString());
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [loading, staleTasks]);

  const currentTask = staleTasks[currentTaskIndex];

  const handleArchive = async () => {
    try {
      await archiveTask(currentTask.id);
      toast.success("Task archived");
      moveToNextTask();
    } catch (error) {
      toast.error("Failed to archive task");
    }
  };

  const handleSchedule = () => {
    setShowReminderDialog(true);
  };

  const scheduleTaskWithReminder = async (hours?: number) => {
    try {
      await scheduleForToday(currentTask.id);
      
      // Add reminder if time specified
      if (hours !== undefined) {
        const reminderTime = new Date();
        reminderTime.setHours(reminderTime.getHours() + hours);

        const { error } = await supabase
          .from('tasks')
          .update({
            reminder_time: reminderTime.toISOString(),
            has_reminder: true,
          })
          .eq('id', currentTask.id);

        if (error) throw error;
        toast.success(`Task scheduled for today with reminder at ${format(reminderTime, 'h:mm a')}`);
      } else {
        toast.success("Task scheduled for today");
      }
      
      setShowReminderDialog(false);
      moveToNextTask();
    } catch (error) {
      toast.error("Failed to schedule task");
    }
  };

  const handleDismiss = async () => {
    try {
      await dismissForNow(currentTask.id);
      moveToNextTask();
    } catch (error) {
      toast.error("Failed to dismiss task");
    }
  };

  const moveToNextTask = () => {
    if (currentTaskIndex < staleTasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    } else {
      setShowPopup(false);
      setCurrentTaskIndex(0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expiring':
        return 'text-red-500';
      case 'decision_required':
        return 'text-orange-500';
      case 'stale':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'expiring':
        return 'Expiring soon';
      case 'decision_required':
        return 'Decision required';
      case 'stale':
        return 'Getting stale';
      default:
        return '';
    }
  };

  if (!showPopup || !currentTask) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${getStatusColor(currentTask.staleness_status)}`} />
                <span className={`text-sm font-medium ${getStatusColor(currentTask.staleness_status)}`}>
                  {getStatusText(currentTask.staleness_status)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPopup(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Task needs attention</h3>
              <p className="text-sm text-muted-foreground">
                This task has been in your inbox for {currentTask.days_old} days
              </p>
            </div>
          </div>

          {/* Task Card */}
          <div className="px-6 pb-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground">
                {currentTask.title}
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground">
              Want me to schedule it or archive it?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 space-y-2">
            <Button
              onClick={handleSchedule}
              className="w-full"
              variant="default"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule for Today
            </Button>
            <Button
              onClick={handleArchive}
              className="w-full"
              variant="outline"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button
              onClick={handleDismiss}
              className="w-full"
              variant="ghost"
            >
              Dismiss for Now
            </Button>
          </div>

          {/* Progress Indicator */}
          {staleTasks.length > 1 && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-center gap-1">
                {staleTasks.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentTaskIndex
                        ? 'w-8 bg-primary'
                        : 'w-1.5 bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                {currentTaskIndex + 1} of {staleTasks.length} tasks
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AlertDialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule for Today</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to add a reminder for this task?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-4">
            <Button 
              variant="outline" 
              onClick={() => scheduleTaskWithReminder(1)}
              className="justify-start gap-3"
            >
              <Clock className="h-4 w-4" />
              In 1 hour
            </Button>
            <Button 
              variant="outline" 
              onClick={() => scheduleTaskWithReminder(3)}
              className="justify-start gap-3"
            >
              <Clock className="h-4 w-4" />
              In 3 hours
            </Button>
            <Button 
              variant="outline" 
              onClick={() => scheduleTaskWithReminder(6)}
              className="justify-start gap-3"
            >
              <Clock className="h-4 w-4" />
              In 6 hours
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => scheduleTaskWithReminder()}>
              Schedule without reminder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
}