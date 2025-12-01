import { useState, useEffect } from 'react';
import { useProgressStats } from '@/hooks/useProgressStats';
import { useProgressVisibility } from '@/contexts/ProgressContext';

const ProgressIndicator = () => {
  const { completedToday, totalToday, streak, weeklyCompleted } = useProgressStats();
  const { isProgressVisible } = useProgressVisibility();
  const [isPeriodicVisible, setIsPeriodicVisible] = useState(false);

  // Show conditions:
  // 1. When task is completed (via context)
  // 2. Every 3 minutes for 8 seconds
  // 3. When streak hits a milestone
  // 4. On first load for 5 seconds, then fade out
  
  useEffect(() => {
    // Show on mount for 5 seconds
    setIsPeriodicVisible(true);
    const hideTimer = setTimeout(() => setIsPeriodicVisible(false), 5000);
    
    // Then show every 3 minutes for 8 seconds
    const interval = setInterval(() => {
      setIsPeriodicVisible(true);
      setTimeout(() => setIsPeriodicVisible(false), 8000);
    }, 3 * 60 * 1000); // every 3 minutes
    
    return () => {
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, []);

  // Always show if streak milestone
  const isStreakMilestone = [7, 14, 21, 30, 60, 90, 100].includes(streak);
  
  // Don't render if nothing to show
  if (totalToday === 0 && streak === 0) return null;
  
  // Show if triggered by task completion OR periodic timer OR milestone
  const shouldShow = isProgressVisible || isPeriodicVisible || isStreakMilestone;
  
  // Hide if not visible
  if (!shouldShow) return null;

  return (
    <div 
      className={`
        flex flex-col items-center gap-2 transition-opacity duration-1000
        ${shouldShow ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Weekly mini bars */}
      <div className="flex items-end gap-1 h-4">
        {weeklyCompleted.map((count, i) => {
          const maxDaily = Math.max(...weeklyCompleted, 1);
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
