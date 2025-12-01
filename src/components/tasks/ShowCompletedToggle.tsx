import { ChevronDown, ChevronUp } from "lucide-react";

interface ShowCompletedToggleProps {
  completedCount: number;
  showCompleted: boolean;
  onToggle: () => void;
}

export const ShowCompletedToggle = ({ 
  completedCount, 
  showCompleted, 
  onToggle 
}: ShowCompletedToggleProps) => {
  if (completedCount === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-border/20">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        {showCompleted ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <span>
          {showCompleted ? 'Hide' : 'Show'} completed ({completedCount})
        </span>
      </button>
    </div>
  );
};
