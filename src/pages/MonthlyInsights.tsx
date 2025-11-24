import { MonthlyInsights as MonthlyInsightsComponent } from '@/features/insights/MonthlyInsights';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Flame } from 'lucide-react';
import { hapticLight } from '@/utils/haptics';
import { useFocusStreak } from '@/hooks/useFocusStreak';

const MonthlyInsights = () => {
  const navigate = useNavigate();
  const { streak, isLoading: isLoadingStreak } = useFocusStreak();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hapticLight();
            navigate('/');
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Monthly Insights</h1>
          <p className="text-muted-foreground">
            Your personalized monthly summary powered by AI
          </p>
        </div>

        {/* Focus Streak */}
        {!isLoadingStreak && streak && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Flame className="w-4 h-4" />
            <span>Primary Focus Streak: <span className="font-medium text-foreground">{streak.current_streak} days</span> | Longest streak: <span className="font-medium text-foreground">{streak.longest_streak} days</span></span>
          </div>
        )}

        <MonthlyInsightsComponent />
      </div>
    </div>
  );
};

export default MonthlyInsights;
