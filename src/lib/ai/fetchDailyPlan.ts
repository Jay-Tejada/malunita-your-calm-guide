import { supabase } from "@/integrations/supabase/client";

export interface DailyPlan {
  top_priority: string | null;
  must_do: string[];
  should_do: string[];
  could_do: string[];
  quick_wins: string[];
  blocked: string[];
  warnings: string[];
  day_theme: string;
  reasoning: string;
}

export async function fetchDailyPlan(userId: string): Promise<DailyPlan | null> {
  try {
    const { data, error } = await supabase.functions.invoke('daily-prioritization', {
      body: { userId }
    });

    if (error) {
      console.error('Failed to fetch daily plan:', error);
      return null;
    }

    if (data?.error) {
      console.error('Daily plan returned error:', data.error);
      return null;
    }

    return data as DailyPlan;
  } catch (error) {
    console.error('Error calling daily-prioritization:', error);
    return null;
  }
}
