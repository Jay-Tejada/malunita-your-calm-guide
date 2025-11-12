import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export const NotificationSnooze = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSnoozing, setIsSnoozing] = useState(false);

  const handleSnooze = async (duration: '30m' | '1h' | 'tomorrow') => {
    setIsSnoozing(true);
    try {
      const { data, error } = await supabase.functions.invoke('snooze-notifications', {
        body: { duration },
      });

      if (error) throw error;

      const durationText = 
        duration === '30m' ? '30 minutes' :
        duration === '1h' ? '1 hour' :
        'tomorrow morning';

      toast({
        title: "Notifications snoozed",
        description: `You won't receive focus task reminders for ${durationText}.`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Error snoozing notifications:', error);
      toast({
        title: "Error",
        description: "Failed to snooze notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSnoozing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Moon className="h-4 w-4" />
          Snooze Reminders
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Snooze Focus Task Reminders</DialogTitle>
          <DialogDescription>
            Temporarily pause your focus task notifications
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            variant="outline"
            className="justify-start gap-3"
            onClick={() => handleSnooze('30m')}
            disabled={isSnoozing}
          >
            <Clock className="h-4 w-4" />
            <span>Snooze for 30 minutes</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3"
            onClick={() => handleSnooze('1h')}
            disabled={isSnoozing}
          >
            <Clock className="h-4 w-4" />
            <span>Snooze for 1 hour</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-3"
            onClick={() => handleSnooze('tomorrow')}
            disabled={isSnoozing}
          >
            <Moon className="h-4 w-4" />
            <span>Snooze until tomorrow (8 AM)</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
