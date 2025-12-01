import { useProgressStats } from '@/hooks/useProgressStats';

const ProgressIndicator = () => {
  const { completedToday, totalToday, streak, weeklyCompleted } = useProgressStats();
  
  // Calculate max for scaling
  const maxDaily = Math.max(...weeklyCompleted, 1);
  
  // Don't show if no activity at all
  const hasActivity = weeklyCompleted.some(c => c > 0) || totalToday > 0;
  if (!hasActivity) return null;
  
  return (
    <div className="flex flex-col items-center gap-3">
      
      {/* Weekly mini bars */}
      <div className="flex items-end gap-1 h-4">
        {weeklyCompleted.map((count, i) => {
          const height = count > 0 ? Math.max((count / maxDaily) * 16, 3) : 2;
          const isToday = i === 6;
          
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                count > 0 
                  ? isToday 
                    ? 'bg-foreground/50' 
                    : 'bg-foreground/25'
                  : 'bg-foreground/10'
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
      
      {/* Text summary */}
      <p className="text-[10px] text-muted-foreground/25 tracking-wide">
        {completedToday > 0 && `${completedToday} today`}
        {completedToday > 0 && streak > 1 && ' · '}
        {streak > 1 && `${streak} day streak`}
      </p>
      
    </div>
  );
};

export default ProgressIndicator;
