// DEPRECATED: daily-prioritization deleted in Phase 3C
// TODO: Replace with suggest-focus or local prioritization logic
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
  // DEPRECATED: daily-prioritization deleted in Phase 3C
  // TODO: Replace with suggest-focus or local prioritization
  console.log('fetchDailyPlan: daily-prioritization removed, returning null');
  return null;
  
  // Original implementation:
  // try {
  //   const { data, error } = await supabase.functions.invoke('daily-prioritization', {
  //     body: { userId }
  //   });
  //   if (error) { return null; }
  //   return data as DailyPlan;
  // } catch (error) {
  //   return null;
  // }
}
