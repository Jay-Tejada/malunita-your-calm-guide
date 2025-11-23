import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aggregateMonthlyData, generateMonthlyInsight, MonthlyInsight } from '@/ai/insightEngine';
import { useToast } from '@/hooks/use-toast';

export const useMonthlyInsights = (monthOffset: number = 0) => {
  const { toast } = useToast();
  const [generatedInsight, setGeneratedInsight] = useState<MonthlyInsight | null>(null);

  const { data: monthlyData, isLoading: isLoadingData } = useQuery({
    queryKey: ['monthly-data', monthOffset],
    queryFn: () => aggregateMonthlyData(monthOffset),
  });

  const generateInsightMutation = useMutation({
    mutationFn: generateMonthlyInsight,
    onSuccess: (insight) => {
      setGeneratedInsight(insight);
      toast({
        title: 'Insights generated',
        description: 'Your monthly summary is ready!',
      });
    },
    onError: (error: any) => {
      console.error('Failed to generate insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate monthly insights. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const generateInsights = () => {
    if (monthlyData) {
      generateInsightMutation.mutate(monthlyData);
    }
  };

  return {
    monthlyData,
    generatedInsight,
    isLoadingData,
    isGenerating: generateInsightMutation.isPending,
    generateInsights,
  };
};
