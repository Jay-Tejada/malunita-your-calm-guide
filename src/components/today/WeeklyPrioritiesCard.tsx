import { Target, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCurrentWeekPriorities } from '@/hooks/useCurrentWeekPriorities';
import { useNavigate } from 'react-router-dom';

const WeeklyPrioritiesCard = () => {
  const { data: priorities, isLoading } = useCurrentWeekPriorities();
  const navigate = useNavigate();

  const priorityList = [
    priorities?.priorityOne,
    priorities?.priorityTwo,
    priorities?.priorityThree,
  ].filter(Boolean) as string[];

  if (isLoading) return null;
  
  // Show empty state if no priorities set
  if (priorityList.length === 0) {
    return (
      <button
        onClick={() => navigate('/weekly-review')}
        className="w-full text-left"
      >
        <Card className="p-3 bg-foreground/[0.02] border-foreground/5 border-dashed hover:bg-foreground/[0.04] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-foreground/30" />
              <p className="text-sm text-foreground/40">Set weekly priorities</p>
            </div>
            <ChevronRight className="w-4 h-4 text-foreground/20" />
          </div>
        </Card>
      </button>
    );
  }

  return (
    <Card className="p-3 bg-foreground/[0.02] border-foreground/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary/60" />
          <p className="text-[10px] uppercase tracking-widest text-foreground/40">
            This Week
          </p>
        </div>
        <button
          onClick={() => navigate('/weekly-review')}
          className="text-[10px] text-foreground/40 hover:text-foreground/60 transition-colors"
        >
          Edit
        </button>
      </div>
      <ul className="space-y-1">
        {priorityList.map((priority, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-xs text-foreground/20 mt-0.5">{index + 1}.</span>
            <span className="text-sm text-foreground/70">{priority}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default WeeklyPrioritiesCard;
