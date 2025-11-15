import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface DailySessionStartProps {
  onStart: () => void;
}

export const DailySessionStart = ({ onStart }: DailySessionStartProps) => {
  const hour = new Date().getHours();
  const isEvening = hour >= 18 || hour < 6;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-xl w-full p-8 bg-card border-border/40 text-center space-y-6">
        <div className="flex justify-center">
          {isEvening ? (
            <Moon className="w-16 h-16 text-primary" />
          ) : (
            <Sun className="w-16 h-16 text-primary" />
          )}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-light text-foreground">
            {isEvening ? 'Evening Reflection' : 'Daily Session'}
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isEvening 
              ? 'Take a moment to reflect on your day and prepare for tomorrow.'
              : 'Start your day with clarity. Set your intentions, plan your time, and clear your mind.'
            }
          </p>
        </div>

        <Button 
          onClick={onStart}
          size="lg"
          className="w-full max-w-xs mx-auto"
        >
          Begin Session
        </Button>

        <p className="text-xs text-muted-foreground">
          Voice-first experience • 5-10 minutes
        </p>
      </Card>
    </div>
  );
};
