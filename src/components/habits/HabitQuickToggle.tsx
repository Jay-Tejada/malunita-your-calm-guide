import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticSuccess } from '@/utils/haptics';
import type { Habit } from '@/hooks/useHabits';

interface HabitQuickToggleProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
}

export function HabitQuickToggle({ habit, isCompleted, onToggle }: HabitQuickToggleProps) {
  const handleToggle = () => {
    hapticSuccess();
    onToggle();
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all",
        isCompleted
          ? "bg-green-500/10 text-green-600"
          : "bg-foreground/[0.03] hover:bg-foreground/[0.05] text-foreground/60"
      )}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
          isCompleted
            ? "bg-success border-success text-success-foreground"
            : "border-foreground/20"
        )}
      >
        {isCompleted && <Check className="w-3 h-3" />}
      </div>
      <span className="font-mono text-xs truncate">
        {habit.icon && <span className="mr-1">{habit.icon}</span>}
        {habit.title}
      </span>
    </button>
  );
}
