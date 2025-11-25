import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuickWin {
  id: string;
  title: string;
}

interface QuickWinsProps {
  data: QuickWin[];
  onTaskCreated?: () => void;
}

export function QuickWins({ data, onTaskCreated }: QuickWinsProps) {
  const { toast } = useToast();

  const handleConvertToTask = async (quickWin: QuickWin) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create tasks",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from('tasks').insert({
        title: quickWin.title,
        user_id: user.id,
        category: 'quick_win',
        completed: false,
      });

      if (error) throw error;

      toast({
        title: "Task created",
        description: `Added "${quickWin.title}" to your tasks`,
      });

      // Notify parent that task was created
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto mb-6 px-4">
      <div className="space-y-2">
        <h3 className="text-xs font-mono text-muted-foreground mb-3">Quick Wins</h3>
        <div className="space-y-2">
          {data.map((win) => (
            <button
              key={win.id}
              onClick={() => handleConvertToTask(win)}
              className="w-full flex items-center gap-2 p-3 rounded-lg bg-background/50 hover:bg-accent/50 transition-colors text-left group"
            >
              <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                <Check className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-mono text-foreground/80 group-hover:text-foreground transition-colors">
                {win.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
