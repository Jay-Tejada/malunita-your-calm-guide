import { useState, useEffect } from "react";
import { useTasks } from "./useTasks";
import { useToast } from "./use-toast";
import {
  clusterTasks,
  saveClusterAnalysis,
  loadClusterAnalysis,
  shouldRefreshClusters,
  detectOverloadedClusters,
  detectClearedClusters,
  TaskCluster,
  ClusterAnalysis,
} from "@/ai/knowledgeClusters";

export const useKnowledgeClusters = () => {
  const { tasks } = useTasks();
  const { toast } = useToast();
  const [clusters, setClusters] = useState<TaskCluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<ClusterAnalysis | null>(null);

  // Load cached clusters on mount
  useEffect(() => {
    const cached = loadClusterAnalysis();
    if (cached) {
      setClusters(cached.clusters);
      setLastAnalysis(cached);
    }
  }, []);

  // Auto-refresh if needed
  useEffect(() => {
    if (tasks && tasks.length > 0 && shouldRefreshClusters() && !isLoading) {
      refreshClusters();
    }
  }, [tasks]);

  const refreshClusters = async () => {
    if (!tasks || tasks.length === 0) {
      setClusters([]);
      return;
    }

    setIsLoading(true);

    try {
      const analysis = await clusterTasks(tasks);
      setClusters(analysis.clusters);
      setLastAnalysis(analysis);
      saveClusterAnalysis(analysis);

      // Check for overloaded clusters
      const overloaded = detectOverloadedClusters(analysis.clusters);
      if (overloaded.length > 0) {
        toast({
          title: "Heavy Cluster Detected",
          description: `Your ${overloaded[0].name} cluster has ${overloaded[0].taskCount} tasks. Consider breaking it down!`,
        });
      }

      // Check for cleared clusters
      if (lastAnalysis) {
        const cleared = detectClearedClusters(lastAnalysis.clusters, analysis.clusters);
        if (cleared.length > 0) {
          toast({
            title: "Cluster Cleared! 🎉",
            description: `You've cleared your ${cleared[0].name} cluster! Great work!`,
          });
        }
      }

    } catch (error) {
      console.error("Error refreshing clusters:", error);
      toast({
        title: "Clustering Error",
        description: "Failed to analyze your tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getClusterById = (clusterId: string): TaskCluster | undefined => {
    return clusters.find(c => c.id === clusterId);
  };

  const getTaskCluster = (taskId: string): TaskCluster | undefined => {
    return clusters.find(c => c.tasks.includes(taskId));
  };

  return {
    clusters,
    isLoading,
    refreshClusters,
    getClusterById,
    getTaskCluster,
  };
};
