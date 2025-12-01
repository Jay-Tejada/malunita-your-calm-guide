import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

export const OneThingSection = () => {
  const { tasks, createTasks } = useTasks();
  const { toast } = useToast();
  const [oneThingInput, setOneThingInput] = useState("");

  const todayDate = new Date().toISOString().split('T')[0];
  const oneThing = tasks?.find(t => t.is_focus && t.focus_date === todayDate && !t.completed);

  const handleSetOneThing = async () => {
    if (!oneThingInput.trim()) return;

    try {
      await createTasks([{
        title: oneThingInput.trim(),
        is_focus: true,
        focus_date: todayDate,
        scheduled_bucket: 'today',
        priority: 'MUST',
      }]);

      setOneThingInput("");
      toast({
        description: "ONE thing set for today",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error setting ONE thing:', error);
      toast({
        description: "Failed to set ONE thing",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <div className="mb-12">
      {oneThing ? (
        <div className="space-y-4">
          <h2 className="text-lg font-mono text-center text-foreground/70">
            Your ONE thing today
          </h2>
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 text-center">
            <p className="text-xl font-mono text-foreground">
              {oneThing.title}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-mono text-center text-foreground/70">
            What's the ONE thing that would make today a success?
          </h2>
          <div className="relative">
            <input
              type="text"
              value={oneThingInput}
              onChange={(e) => setOneThingInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSetOneThing();
                }
              }}
              placeholder="Type and press enter..."
              className="w-full bg-transparent border-0 border-b border-border/30 focus:border-foreground/40 transition-all font-mono text-base py-3 px-0 placeholder:text-muted-foreground/40 outline-none text-center"
            />
          </div>
        </div>
      )}
    </div>
  );
};
