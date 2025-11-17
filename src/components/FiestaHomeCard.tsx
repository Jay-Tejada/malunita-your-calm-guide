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
    <Card className="p-5 bg-[hsl(var(--primary)/0.04)] border-[hsl(var(--primary)/0.15)] rounded-xl animate-fade-in font-mono">
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div className="p-2.5 rounded-lg bg-[hsl(var(--primary)/0.1)] flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-3">
          <h3 className="text-base font-semibold text-foreground">
            Tiny Task Fiesta?
          </h3>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            You have {tinyTaskCount} tiny tasks ready to clear.
          </p>
          <Button
            onClick={() => navigate('/tiny-task-fiesta')}
            size="sm"
            className="w-full mt-2 gap-2 font-mono"
          >
            <Sparkles className="w-4 h-4" />
            Start Fiesta
          </Button>
        </div>
      </div>
    </Card>
  );
};
