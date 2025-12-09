// src/hooks/useTaskCategorization.ts

import { supabase } from "@/integrations/supabase/client";

interface CategorizeResult {
  category?: string;
  estimatedMinutes?: number;
  isTinyTask?: boolean;
  suggestedSpace?: string;
}

export async function categorizeTask(taskId: string, title: string): Promise<CategorizeResult> {
  try {
    // Call the existing categorize-task edge function
    const { data, error } = await supabase.functions.invoke("categorize-task", {
      body: { taskId, title },
    });

    if (error) throw error;

    return {
      category: data?.category,
      estimatedMinutes: data?.estimatedMinutes,
      isTinyTask: data?.estimatedMinutes && data.estimatedMinutes <= 5,
      suggestedSpace: data?.space,
    };
  } catch (err) {
    console.error("Categorization failed:", err);
    return {};
  }
}

export async function checkTinyTaskCluster(userId: string): Promise<{
  canCreateFiesta: boolean;
  tasks: any[];
  totalMinutes: number;
}> {
  try {
    // Call the existing cluster-tasks function
    const { data, error } = await supabase.functions.invoke("cluster-tasks", {
      body: { userId, maxMinutes: 20 },
    });

    if (error) throw error;

    return {
      canCreateFiesta: data?.tasks?.length >= 3,
      tasks: data?.tasks || [],
      totalMinutes: data?.totalMinutes || 0,
    };
  } catch {
    return { canCreateFiesta: false, tasks: [], totalMinutes: 0 };
  }
}
