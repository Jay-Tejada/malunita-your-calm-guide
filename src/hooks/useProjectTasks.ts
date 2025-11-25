import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProjectTasks = () => {
  return useQuery({
    queryKey: ["project-tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all tasks that are used as plans (have other tasks referencing them)
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false)
        .not("plan_id", "is", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Group by plan_id and get unique plans
      const planIds = [...new Set(data?.map(t => t.plan_id).filter(Boolean))];
      
      // Fetch the actual plan tasks
      if (planIds.length === 0) return [];
      
      const { data: plans, error: plansError } = await supabase
        .from("tasks")
        .select("*")
        .in("id", planIds)
        .order("updated_at", { ascending: false });

      if (plansError) throw plansError;

      return plans || [];
    },
  });
};
