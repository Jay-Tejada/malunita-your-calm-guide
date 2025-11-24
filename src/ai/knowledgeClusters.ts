import { supabase } from "@/integrations/supabase/client";

export interface TaskCluster {
  id: string;
  name: string;
  color: string;
  tasks: string[]; // task IDs
  taskCount: number;
  lastUpdated: string;
}

export interface ClusterAnalysis {
  clusters: TaskCluster[];
  timestamp: string;
}

const CLUSTER_COLORS = [
  'hsl(340, 70%, 75%)', // pink
  'hsl(200, 85%, 70%)', // blue
  'hsl(120, 60%, 65%)', // green
  'hsl(40, 90%, 70%)', // orange
  'hsl(280, 70%, 75%)', // purple
  'hsl(160, 65%, 70%)', // teal
  'hsl(20, 80%, 70%)', // coral
  'hsl(260, 65%, 75%)', // lavender
];

export const clusterTasks = async (tasks: any[], primaryFocusTask?: any): Promise<ClusterAnalysis> => {
  // Filter active (incomplete) tasks
  const activeTasks = tasks.filter(task => !task.completed);

  if (activeTasks.length === 0) {
    return {
      clusters: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Prepare task data for AI
  const taskData = activeTasks.map(task => ({
    id: task.id,
    title: task.title,
    category: task.category,
    context: task.context,
    created_at: task.created_at,
    has_reminder: task.has_reminder,
  }));

  // Prepare primary focus task if provided
  const primaryFocusData = primaryFocusTask ? {
    id: primaryFocusTask.id,
    title: primaryFocusTask.title,
    category: primaryFocusTask.category,
    context: primaryFocusTask.context,
  } : undefined;

  try {
    const { data, error } = await supabase.functions.invoke('cluster-tasks', {
      body: { 
        tasks: taskData,
        primaryFocusTask: primaryFocusData,
      }
    });

    if (error) throw error;

    // Assign colors to clusters
    const clustersWithColors = data.clusters.map((cluster: any, index: number) => ({
      ...cluster,
      id: `cluster-${index}`,
      color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
      lastUpdated: new Date().toISOString(),
    }));

    return {
      clusters: clustersWithColors,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error clustering tasks:', error);
    throw error;
  }
};

export const saveClusterAnalysis = (analysis: ClusterAnalysis) => {
  localStorage.setItem('task-clusters', JSON.stringify(analysis));
};

export const loadClusterAnalysis = (): ClusterAnalysis | null => {
  const stored = localStorage.getItem('task-clusters');
  if (!stored) return null;

  try {
    const analysis = JSON.parse(stored) as ClusterAnalysis;
    
    // Check if analysis is from today
    const analysisDate = new Date(analysis.timestamp);
    const today = new Date();
    
    if (
      analysisDate.getDate() === today.getDate() &&
      analysisDate.getMonth() === today.getMonth() &&
      analysisDate.getFullYear() === today.getFullYear()
    ) {
      return analysis;
    }
    
    // Analysis is outdated
    return null;
  } catch {
    return null;
  }
};

export const shouldRefreshClusters = (): boolean => {
  const analysis = loadClusterAnalysis();
  return analysis === null;
};

export const detectOverloadedClusters = (clusters: TaskCluster[]): TaskCluster[] => {
  // A cluster is overloaded if it has 10+ tasks
  return clusters.filter(cluster => cluster.taskCount >= 10);
};

export const detectClearedClusters = (
  previousClusters: TaskCluster[],
  currentClusters: TaskCluster[]
): TaskCluster[] => {
  // Find clusters that had tasks before but are now empty or missing
  return previousClusters.filter(prevCluster => {
    const currentCluster = currentClusters.find(c => c.name === prevCluster.name);
    return prevCluster.taskCount > 0 && (!currentCluster || currentCluster.taskCount === 0);
  });
};
