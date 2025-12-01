import { useProgressStats } from '@/hooks/useProgressStats';

const ProgressIndicator = () => {
  const { completedToday, totalToday, streak } = useProgressStats();
  
  // Don't show if nothing scheduled and no streak
  if (totalToday === 0 && streak === 0) return null;
  
  return (
    <div className="flex flex-col items-center gap-2">
      
      {/* Today's progress dots */}
      {totalToday > 0 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalToday, 7) }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i < completedToday 
                  ? 'bg-foreground/40' 
                  : 'bg-foreground/10'
              }`}
            />
          ))}
          {totalToday > 7 && (
            <span className="text-[9px] text-muted-foreground/30 ml-1">
              +{totalToday - 7}
            </span>
          )}
        </div>
      )}
      
      {/* Text summary */}
      <p className="text-[10px] text-muted-foreground/25 tracking-wide">
        {completedToday > 0 && `${completedToday} done`}
        {completedToday > 0 && streak > 1 && ' · '}
        {streak > 1 && `${streak} day streak`}
      </p>
      
    </div>
  );
};

export default ProgressIndicator;
