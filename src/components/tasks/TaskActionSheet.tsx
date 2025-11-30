import { useState } from "react";
import { MoreVertical, Home, Briefcase, Dumbbell, FolderKanban, Inbox, Star, Bell, Calendar, List, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Task } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TaskActionSheetProps {
  task: Task;
  onUpdate?: () => void;
  onDelete?: () => void;
  onBreakDown?: (e: React.MouseEvent) => void;
}

export function TaskActionSheet({ task, onUpdate, onDelete, onBreakDown }: TaskActionSheetProps) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  const moveToLocation = async (bucket: string, isFocus?: boolean) => {
    const updates: any = {
      scheduled_bucket: bucket,
    };

    if (bucket === 'today') {
      updates.is_focus = true;
      updates.focus_date = format(new Date(), 'yyyy-MM-dd');
    } else if (isFocus === false) {
      updates.is_focus = false;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to move task');
      console.error(error);
    } else {
      toast.success(`Moved to ${bucket}`);
      onUpdate?.();
      setOpen(false);
    }
  };

  const markAsFocusTask = async () => {
    const { error } = await supabase
      .from('tasks')
      .update({
        is_focus: true,
        focus_date: format(new Date(), 'yyyy-MM-dd'),
        focus_source: 'manual',
      })
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to mark as focus task');
      console.error(error);
    } else {
      toast.success('Marked as ONE Thing');
      onUpdate?.();
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to delete task');
      console.error(error);
    } else {
      toast.success('Task deleted');
      onDelete?.();
      setShowDeleteConfirm(false);
      setOpen(false);
    }
  };

  const handleBreakDown = () => {
    if (onBreakDown) {
      const syntheticEvent = {
        stopPropagation: () => {},
      } as React.MouseEvent;
      onBreakDown(syntheticEvent);
    }
    setOpen(false);
  };

  const addReminder = async (hours: number) => {
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + hours);

    const { error } = await supabase
      .from('tasks')
      .update({
        reminder_time: reminderTime.toISOString(),
        has_reminder: true,
      })
      .eq('id', task.id);

    if (error) {
      toast.error('Failed to add reminder');
      console.error(error);
    } else {
      toast.success(`Reminder set for ${format(reminderTime, 'h:mm a')}`);
      onUpdate?.();
      setShowReminderDialog(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Task Actions</SheetTitle>
            <SheetDescription className="text-sm font-mono line-clamp-2">
              {task.title}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => moveToLocation('today')}
            >
              <Star className="h-4 w-4" />
              Move to Today
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => moveToLocation('inbox', false)}
            >
              <Inbox className="h-4 w-4" />
              Move to Inbox
            </Button>
            <div className="h-px bg-border my-1" />
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => moveToLocation('work')}
            >
              <Briefcase className="h-4 w-4" />
              Move to Work
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => moveToLocation('home')}
            >
              <Home className="h-4 w-4" />
              Move to Home
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => moveToLocation('gym')}
            >
              <Dumbbell className="h-4 w-4" />
              Move to Gym
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => moveToLocation('projects')}
            >
              <FolderKanban className="h-4 w-4" />
              Move to Projects
            </Button>
            <div className="h-px bg-border my-1" />
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={markAsFocusTask}
            >
              <Star className="h-4 w-4 fill-primary text-primary" />
              Mark as Focus Task (ONE Thing)
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => setShowReminderDialog(true)}
            >
              <Bell className="h-4 w-4" />
              Add a Reminder
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => toast.info('Calendar integration coming soon')}
            >
              <Calendar className="h-4 w-4" />
              Add to Calendar
            </Button>
            {onBreakDown && (
              <Button
                variant="ghost"
                className="justify-start gap-3"
                onClick={handleBreakDown}
              >
                <List className="h-4 w-4" />
                Break Down into Steps
              </Button>
            )}
            <div className="h-px bg-border my-1" />
            <Button
              variant="ghost"
              className="justify-start gap-3 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Task
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              When would you like to be reminded?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-4">
            <Button variant="outline" onClick={() => addReminder(1)}>
              In 1 hour
            </Button>
            <Button variant="outline" onClick={() => addReminder(3)}>
              In 3 hours
            </Button>
            <Button variant="outline" onClick={() => addReminder(24)}>
              Tomorrow
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
