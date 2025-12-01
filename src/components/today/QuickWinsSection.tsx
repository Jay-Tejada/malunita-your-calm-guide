import { Check } from "lucide-react";
import { useDailyIntelligence } from "@/hooks/useDailyIntelligence";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

export const QuickWinsSection = () => {
  const { data: intelligence } = useDailyIntelligence();
  const { createTasks } = useTasks();
  const { toast } = useToast();

  const handleQuickWinClick = async (quickWin: { id: string; title: string }) => {
    try {
      await createTasks([{
        title: quickWin.title,
        scheduled_bucket: 'today',
        is_tiny_task: true,
      }]);
      
      toast({
        description: "Added to today",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        description: "Failed to add task",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  if (!intelligence?.quick_wins || intelligence.quick_wins.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-4">
        Quick Wins
      </h3>
      <div className="space-y-2">
        {intelligence.quick_wins.slice(0, 5).map((win) => (
          <button
            key={win.id}
            onClick={() => handleQuickWinClick(win)}
            className="w-full flex items-center gap-3 py-2.5 px-3 hover:bg-muted/20 rounded-md transition-colors group text-left"
          >
            <div className="w-4 h-4 rounded-full border border-foreground/20 group-hover:border-primary transition-colors flex items-center justify-center">
              <Check className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="flex-1 font-mono text-[14px] text-foreground/70 group-hover:text-foreground transition-colors">
              {win.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
