import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Clock } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useFiestaSessions } from "@/hooks/useFiestaSessions";
import { findTinyTasks, classifyTask } from "@/lib/tinyTaskDetector";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const TinyTaskFiestaStart = () => {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { createSession, activeSession } = useFiestaSessions();
  const [duration, setDuration] = useState<string>("45");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  const tinyTasks = tasks ? findTinyTasks(tasks) : [];

  // Auto-select all tiny tasks on mount
  useEffect(() => {
    if (tinyTasks.length > 0 && selectedTaskIds.length === 0) {
      setSelectedTaskIds(tinyTasks.map(t => t.id));
    }
  }, [tinyTasks.length]);

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
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto p-4 py-12">
          <Card className="p-8 text-center space-y-6 bg-card border-border/50">
            <Sparkles className="w-16 h-16 mx-auto text-primary" />
            <div className="space-y-2">
              <h2 className="text-3xl font-light font-mono">Fiesta in Progress</h2>
              <p className="text-muted-foreground font-light">
                You have an active Tiny Task Fiesta session.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="gap-2 font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="gap-2 font-mono"
              >
                Continue Fiesta
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto p-4 space-y-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="gap-2 font-mono text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        {/* Hero Section */}
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-light tracking-tight font-mono">
                Tiny Task Fiesta
              </h1>
            </div>
            <p className="text-lg text-muted-foreground font-light leading-relaxed">
              Clear your tiny tasks in a fun, focused sprint. Perfect for quick admin tasks that take less than 5 minutes each.
            </p>
          </div>
        </Card>

        {tinyTasks.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-card border-border/50">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg text-muted-foreground font-light">
                No tiny tasks detected right now
              </p>
              <p className="text-sm text-muted-foreground font-light">
                Add some quick tasks to start a fiesta
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="gap-2 font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </Card>
        ) : (
          <>
            {/* Duration Selection */}
            <Card className="p-6 space-y-4 bg-card border-border/50">
              <h3 className="text-lg font-light font-mono">Choose Your Sprint Duration</h3>
              <RadioGroup value={duration} onValueChange={setDuration}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors cursor-pointer">
                    <RadioGroupItem value="25" id="duration-25" />
                    <Label htmlFor="duration-25" className="flex-1 cursor-pointer font-light">
                      <div className="flex justify-between items-center">
                        <span>Quick Sprint</span>
                        <span className="text-sm text-muted-foreground font-mono">25 min</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                    <RadioGroupItem value="45" id="duration-45" />
                    <Label htmlFor="duration-45" className="flex-1 cursor-pointer font-light">
                      <div className="flex justify-between items-center">
                        <span>Standard Fiesta</span>
                        <span className="text-sm text-muted-foreground font-mono">45 min</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors cursor-pointer">
                    <RadioGroupItem value="60" id="duration-60" />
                    <Label htmlFor="duration-60" className="flex-1 cursor-pointer font-light">
                      <div className="flex justify-between items-center">
                        <span>Power Hour</span>
                        <span className="text-sm text-muted-foreground font-mono">60 min</span>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Task Selection */}
            <Card className="p-6 space-y-4 bg-card border-border/50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-light font-mono">Select Tasks for Your Fiesta</h3>
                <span className="text-sm text-muted-foreground font-mono">
                  {selectedTaskIds.length} selected
                </span>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tinyTasks.map((task) => {
                  const classification = classifyTask(task);
                  const isSelected = selectedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                          : 'bg-background border-border/50 hover:bg-accent/5 hover:border-border'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        className="mt-1 pointer-events-none"
                      />
                      <div className="flex-1 space-y-1">
                        <p className="font-light leading-relaxed">{task.title}</p>
                        {task.context && (
                          <p className="text-sm text-muted-foreground font-light line-clamp-2">
                            {task.context}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground italic font-light">
                          {classification.reason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Start Button */}
            <Button
              onClick={handleStartFiesta}
              disabled={selectedTaskIds.length === 0 || isStarting}
              size="lg"
              className="w-full gap-2 font-mono text-lg py-6"
            >
              <Sparkles className="w-5 h-5" />
              {isStarting ? 'Starting Fiesta...' : 'Start Fiesta'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
