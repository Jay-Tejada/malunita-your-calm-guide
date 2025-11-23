import { MonthlyInsights as MonthlyInsightsComponent } from '@/features/insights/MonthlyInsights';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { hapticLight } from '@/utils/haptics';

const MonthlyInsights = () => {
  const navigate = useNavigate();

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
        <MonthlyInsightsComponent />
      </div>
    </div>
  );
};

export default MonthlyInsights;
