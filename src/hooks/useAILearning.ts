import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AICorrection {
  id: string;
  task_title: string;
  ai_guess: any;
  corrected_output: any;
  created_at: string;
  correction_type: string | null;
}

export interface LearningTrend {
  id: string;
  analysis_date: string;
  common_patterns: any;
  top_misunderstood_phrasings: any;
  total_corrections_analyzed: number;
  categorization_improvements: string | null;
  suggestion_improvements: string | null;
}

export interface UserBiasPattern {
  id: string;
  pattern_type: string;
  pattern_key: string;
  pattern_data: any;
  confidence: number | null;
  sample_size: number | null;
}

export interface ConfusionMatrixEntry {
  predicted_category: string | null;
  actual_category: string | null;
  predicted_priority: string | null;
  actual_priority: string | null;
  occurrence_count: number;
}

export function useAILearning() {
  const { data: corrections, isLoading: correctionsLoading } = useQuery({
    queryKey: ["ai-corrections"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ai_corrections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as AICorrection[];
    },
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["learning-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_trends")
        .select("*")
        .order("analysis_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as LearningTrend[];
    },
  });

  const { data: biasPatterns, isLoading: biasLoading } = useQuery({
    queryKey: ["user-bias-patterns"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_bias_patterns")
        .select("*")
        .eq("user_id", user.id)
        .order("confidence", { ascending: false });

      if (error) throw error;
      return data as UserBiasPattern[];
    },
  });

  const { data: confusionMatrix, isLoading: confusionLoading } = useQuery({
    queryKey: ["confusion-matrix"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("model_confusion_matrix")
        .select("*")
        .order("occurrence_count", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ConfusionMatrixEntry[];
    },
  });

  const totalCorrections = corrections?.length || 0;
  const improvementLevel = Math.min(100, (totalCorrections / 50) * 100); // Max out at 50 corrections = 100%

  return {
    corrections: corrections || [],
    trends: trends || [],
    biasPatterns: biasPatterns || [],
    confusionMatrix: confusionMatrix || [],
    totalCorrections,
    improvementLevel,
    isLoading: correctionsLoading || trendsLoading || biasLoading || confusionLoading,
  };
}
