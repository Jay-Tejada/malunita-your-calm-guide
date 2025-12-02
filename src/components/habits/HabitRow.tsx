import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticSuccess } from '@/utils/haptics';
import type { Habit } from '@/hooks/useHabits';

interface HabitRowProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  weekCompletions: boolean[];
  onToggle: () => void;
}

export function HabitRow({ habit, isCompleted, streak, weekCompletions, onToggle }: HabitRowProps) {
  const handleToggle = () => {
    hapticSuccess();
    onToggle();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.02] transition-colors">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          isCompleted
            ? "bg-green-500 border-green-500 text-white scale-110"
            : "border-foreground/20 hover:border-foreground/40"
        )}
      >
        {isCompleted && <Check className="w-4 h-4" />}
      </button>

      {/* Title */}
      <span className={cn(
        "flex-1 font-mono text-sm transition-colors",
        isCompleted ? "text-foreground/40" : "text-foreground/70"
      )}>
        {habit.icon && <span className="mr-2">{habit.icon}</span>}
        {habit.title}
      </span>

      {/* Week mini-calendar */}
      <div className="flex items-center gap-1 mr-3">
        {weekCompletions.map((completed, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              completed ? "bg-green-500" : "bg-foreground/10"
            )}
          />
        ))}
      </div>

      {/* Streak */}
      {streak > 0 && (
        <span className="text-xs text-foreground/40 tabular-nums">
          {streak}d
        </span>
      )}
    </div>
  );
}
