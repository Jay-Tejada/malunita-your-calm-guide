import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useFiestaSessions } from "@/hooks/useFiestaSessions";
import { shouldSuggestFiesta } from "@/lib/tinyTaskDetector";
import { format } from "date-fns";

export const FloatingReminder = () => {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { sessions, activeSession } = useFiestaSessions();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user had a fiesta today
  const hadFiestaToday = sessions?.some(session => 
    format(new Date(session.started_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  // Check if reminder was shown recently (within last 6 hours)
  const wasShownRecently = () => {
    const lastShown = localStorage.getItem('fiestaReminderLastShown');
    if (!lastShown) return false;
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    return parseInt(lastShown) > sixHoursAgo;
  };

  const shouldShow = tasks && shouldSuggestFiesta(tasks, 5) && !activeSession && !hadFiestaToday && !isDismissed && !wasShownRecently();

  useEffect(() => {
    if (!shouldShow) return;

    // Mark as shown and store timestamp
    localStorage.setItem('fiestaReminderLastShown', Date.now().toString());

    // Show after 5 seconds
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    // Auto-hide after 10 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 15000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [shouldShow]);

  if (!shouldShow || !isVisible) return null;

  const tinyTaskCount = tasks.filter(t => !t.completed).length;

  return (
    <Card 
      className="fixed top-20 right-4 z-50 p-4 w-80 bg-background/95 backdrop-blur-sm border-primary/20 shadow-lg animate-slide-in-from-right"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-semibold">Tiny Task Fiesta?</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={() => {
                setIsVisible(false);
                setIsDismissed(true);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {tinyTaskCount} tiny tasks ready to clear
          </p>
          <Button
            onClick={() => {
              navigate('/tiny-task-fiesta');
              setIsVisible(false);
            }}
            size="sm"
            className="w-full gap-2 text-xs h-8"
          >
            <Sparkles className="w-3 h-3" />
            Start Fiesta
          </Button>
        </div>
      </div>
    </Card>
  );
};
