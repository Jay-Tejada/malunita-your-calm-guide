import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticSuccess } from '@/utils/haptics';
import { useOrbTriggers } from '@/hooks/useOrbTriggers';

interface HabitCardProps {
  habit: {
    id: string;
    title: string;
    icon?: string | null;
    completed: boolean;
    streak: number;
  };
  onToggle: (id: string, completed: boolean) => void;
}

export function HabitCard({ habit, onToggle }: HabitCardProps) {
  const { onTaskComplete } = useOrbTriggers();

  const handleToggle = () => {
    hapticSuccess();
    if (!habit.completed) {
      onTaskComplete(); // Trigger orb celebration
    }
    onToggle(habit.id, !habit.completed);
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
        "bg-card/50 hover:bg-card border border-border/30",
        habit.completed && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <div 
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          habit.completed 
            ? "border-success bg-success scale-110" 
            : "border-muted-foreground/30 hover:border-muted-foreground/50"
        )}
      >
        {habit.completed && <Check className="w-4 h-4 text-success-foreground" />}
      </div>
      
      {/* Icon */}
      {habit.icon && (
        <span className="text-lg">{habit.icon}</span>
      )}
      
      {/* Title */}
      <span 
        className={cn(
          "flex-1 text-left text-sm font-medium transition-colors",
          habit.completed ? "line-through text-muted-foreground" : "text-foreground"
        )}
      >
        {habit.title}
      </span>
      
      {/* Streak dots */}
      {habit.streak > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(habit.streak, 7) }).map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            ))}
          </div>
          {habit.streak > 7 && (
            <span className="text-xs text-muted-foreground ml-1">
              {habit.streak}d
            </span>
          )}
        </div>
      )}
    </button>
  );
}
