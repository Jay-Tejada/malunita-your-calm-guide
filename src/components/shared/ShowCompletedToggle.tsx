interface ShowCompletedToggleProps {
  count: number;
  isVisible: boolean;
  onToggle: () => void;
}

export const ShowCompletedToggle = ({ 
  count, 
  isVisible, 
  onToggle 
}: ShowCompletedToggleProps) => {
  // Only render if there are completed tasks
  if (count === 0) return null;

  return (
    <div className="flex justify-center py-4">
      <button
        onClick={onToggle}
        className="text-xs text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors cursor-pointer"
      >
        {isVisible ? 'Hide completed' : `Show completed (${count})`}
      </button>
    </div>
  );
};
