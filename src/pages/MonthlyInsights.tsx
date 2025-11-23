import { MonthlyInsights as MonthlyInsightsComponent } from '@/features/insights/MonthlyInsights';

const MonthlyInsights = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
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
