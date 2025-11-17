import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useFiestaSessions } from "@/hooks/useFiestaSessions";
import { shouldSuggestFiesta } from "@/lib/tinyTaskDetector";
import { format } from "date-fns";

export const FiestaHomeCard = () => {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { sessions, activeSession } = useFiestaSessions();

  // Check if user had a fiesta today
  const hadFiestaToday = sessions?.some(session => 
    format(new Date(session.started_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  // Only show if: has enough tiny tasks, no active session, and hasn't done a fiesta today
  const shouldShow = tasks && shouldSuggestFiesta(tasks, 5) && !activeSession && !hadFiestaToday;

  if (!shouldShow) return null;

  const tinyTaskCount = tasks.filter(t => !t.completed).length;

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold">Tiny Task Fiesta?</h3>
          <p className="text-sm text-muted-foreground">
            You have {tinyTaskCount} tiny tasks ready to clear. Want to start a fiesta?
          </p>
          <Button
            onClick={() => navigate('/tiny-task-fiesta')}
            size="sm"
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Fiesta
          </Button>
        </div>
      </div>
    </Card>
  );
};
