import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Sparkles, Wind, Zap, AlertCircle } from "lucide-react";

interface MoodSelectorProps {
  onMoodSelect: (mood: string) => void;
  onSkip: () => void;
}

const moods = [
  { value: "focused", label: "Focused", icon: Brain, color: "text-blue-500" },
  { value: "calm", label: "Calm", icon: Wind, color: "text-green-500" },
  { value: "overwhelmed", label: "Overwhelmed", icon: AlertCircle, color: "text-orange-500" },
  { value: "energized", label: "Energized", icon: Zap, color: "text-yellow-500" },
  { value: "distracted", label: "Distracted", icon: Sparkles, color: "text-purple-500" },
];

export const MoodSelector = ({ onMoodSelect, onSkip }: MoodSelectorProps) => {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-secondary">
      <p className="text-sm text-muted-foreground mb-4 text-center">
        How are you feeling right now?
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {moods.map((mood) => {
          const Icon = mood.icon;
          return (
            <Button
              key={mood.value}
              variant="outline"
              className="flex flex-col gap-2 h-auto py-3"
              onClick={() => onMoodSelect(mood.value)}
            >
              <Icon className={`w-5 h-5 ${mood.color}`} />
              <span className="text-xs">{mood.label}</span>
            </Button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
        onClick={onSkip}
      >
        Skip
      </Button>
    </Card>
  );
};
