import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useFiestaSessions } from "@/hooks/useFiestaSessions";
import { findTinyTasks, classifyTask } from "@/lib/tinyTaskDetector";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const TinyTaskFiestaStart = () => {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { createSession, activeSession } = useFiestaSessions();
  const [duration, setDuration] = useState<string>("45");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  const tinyTasks = tasks ? findTinyTasks(tasks) : [];

  // Auto-select all tiny tasks on mount
  useState(() => {
    if (tinyTasks.length > 0 && selectedTaskIds.length === 0) {
      setSelectedTaskIds(tinyTasks.map(t => t.id));
    }
  });

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleStartFiesta = async () => {
    if (selectedTaskIds.length === 0) return;
    
    setIsStarting(true);
    try {
      await createSession({
        tasks_included: selectedTaskIds,
        duration_minutes: parseInt(duration),
      });
      navigate('/tiny-task-fiesta');
    } catch (error) {
      console.error('Failed to start fiesta:', error);
    } finally {
      setIsStarting(false);
    }
  };

  if (activeSession) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Sparkles className="w-12 h-12 mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Fiesta in Progress!</h2>
          <p className="text-muted-foreground">
            You have an active Tiny Task Fiesta session.
          </p>
          <Button onClick={() => navigate('/tiny-task-fiesta')}>
            Continue Fiesta
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-background to-accent/5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Tiny Task Fiesta</h2>
          </div>
          <p className="text-muted-foreground">
            Clear your tiny tasks in a fun, focused sprint. Perfect for quick admin tasks that take less than 5 minutes each.
          </p>
        </div>
      </Card>

      {tinyTasks.length === 0 ? (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              No tiny tasks detected right now. Add some quick tasks to start a fiesta!
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Choose Your Duration</h3>
            <RadioGroup value={duration} onValueChange={setDuration}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="25" id="duration-25" />
                <Label htmlFor="duration-25" className="cursor-pointer">25 minutes (Quick Sprint)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="45" id="duration-45" />
                <Label htmlFor="duration-45" className="cursor-pointer">45 minutes (Standard Fiesta)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="60" id="duration-60" />
                <Label htmlFor="duration-60" className="cursor-pointer">60 minutes (Power Hour)</Label>
              </div>
            </RadioGroup>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Select Tasks for Fiesta</h3>
              <span className="text-sm text-muted-foreground">
                {selectedTaskIds.length} selected
              </span>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tinyTasks.map((task) => {
                const classification = classifyTask(task);
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <Checkbox
                      checked={selectedTaskIds.includes(task.id)}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{task.title}</p>
                      {task.context && (
                        <p className="text-sm text-muted-foreground">{task.context}</p>
                      )}
                      <p className="text-xs text-muted-foreground italic">
                        {classification.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Button
            onClick={handleStartFiesta}
            disabled={selectedTaskIds.length === 0 || isStarting}
            className="w-full"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isStarting ? 'Starting...' : 'Start Fiesta'}
          </Button>
        </>
      )}
    </div>
  );
};
