import { useState, useEffect } from "react";
import { useTasks } from "./useTasks";
import { supabase } from "@/integrations/supabase/client";
import { TaskStoryline } from "@/types/storylines";
import { clusterTasks, TaskCluster } from "@/ai/knowledgeClusters";
import { priorityScorer } from "@/lib/priorityScorer";
import { contextMapper } from "@/lib/contextMapper";

type UseTaskStorylinesResult = {
  storylines: TaskStoryline[];
  loading: boolean;
  error?: string | null;
};

const getMoodFromProgress = (progressPercent: number, taskCount: number, daysSinceActivity: number): TaskStoryline['mood'] => {
  if (progressPercent > 75) return 'momentum';
  if (progressPercent > 50 && daysSinceActivity < 2) return 'calm';
  if (taskCount > 8 && progressPercent < 30) return 'stressed';
  if (daysSinceActivity > 7) return 'stuck';
  return 'playful';
};

const getEnergyTag = (taskCount: number): TaskStoryline['energyTag'] => {
  if (taskCount <= 3) return 'light';
  if (taskCount <= 7) return 'medium';
  return 'heavy';
};

const getTimeHorizon = (tasks: any[]): TaskStoryline['timeHorizon'] => {
  const today = new Date().toISOString().split('T')[0];
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const todayTasks = tasks.filter(t => t.focus_date === today);
  const weekTasks = tasks.filter(t => t.focus_date && t.focus_date <= weekFromNow);
  
  if (todayTasks.length > 0) return 'today';
  if (weekTasks.length > 0) return 'this_week';
  if (tasks.some(t => t.reminder_time)) return 'soon';
  return 'someday';
};

const getDaysSinceActivity = (tasks: any[]): number => {
  if (tasks.length === 0) return 999;
  
  const latestActivity = tasks.reduce((latest, task) => {
    const taskDate = new Date(task.updated_at || task.created_at);
    return taskDate > latest ? taskDate : latest;
  }, new Date(0));
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - latestActivity.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatLastActivity = (days: number): string => {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
};

const generateSuggestedNextStep = (cluster: TaskCluster, tasks: any[], mood: TaskStoryline['mood']): string => {
  const incompleteTasks = tasks.filter(t => !t.completed);
  if (incompleteTasks.length === 0) return "All done! Take a breather.";
  
  const firstTask = incompleteTasks[0];
  
  if (mood === 'stuck') {
    return `Time to break through: start with "${firstTask.title.substring(0, 40)}..."`;
  }
  if (mood === 'stressed') {
    return `Focus on one thing: "${firstTask.title.substring(0, 40)}..."`;
  }
  if (mood === 'momentum') {
    return `Keep the flow going: "${firstTask.title.substring(0, 40)}..."`;
  }
  
  return `Next up: "${firstTask.title.substring(0, 40)}..."`;
};

const generateFrictionNote = (progressPercent: number, daysSinceActivity: number, taskCount: number): string | undefined => {
  if (daysSinceActivity > 14 && progressPercent < 20) {
    return "This arc has been quiet for a while. Time to revisit?";
  }
  if (taskCount > 10 && progressPercent < 30) {
    return "This arc is heavy and progress is slow. Consider breaking it down.";
  }
  if (progressPercent === 0 && taskCount > 5) {
    return "No progress yet. Start with the easiest task to build momentum.";
  }
  return undefined;
};

const buildStorylinesFromClusters = (clusters: TaskCluster[], allTasks: any[]): TaskStoryline[] => {
  return clusters.map((cluster) => {
    const clusterTasks = allTasks.filter(t => cluster.tasks.includes(t.id));
    const completedTasks = clusterTasks.filter(t => t.completed);
    const incompleteTasks = clusterTasks.filter(t => !t.completed);
    
    const progressPercent = clusterTasks.length > 0 
      ? Math.round((completedTasks.length / clusterTasks.length) * 100)
      : 0;
    
    const daysSinceActivity = getDaysSinceActivity(clusterTasks);
    const mood = getMoodFromProgress(progressPercent, clusterTasks.length, daysSinceActivity);
    const energyTag = getEnergyTag(clusterTasks.length);
    const timeHorizon = getTimeHorizon(incompleteTasks);
    
    const keyTasks = incompleteTasks.slice(0, 3).map(t => ({
      id: t.id,
      title: t.title,
      is_focus: t.is_focus || false,
      is_tiny: t.context?.includes('tiny') || false,
    }));
    
    const suggestedNextStep = generateSuggestedNextStep(cluster, clusterTasks, mood);
    const frictionNote = generateFrictionNote(progressPercent, daysSinceActivity, clusterTasks.length);
    
    // Infer theme from cluster name or category
    const theme = cluster.name.toLowerCase().includes('work') ? 'work' :
                  cluster.name.toLowerCase().includes('health') ? 'health' :
                  cluster.name.toLowerCase().includes('admin') ? 'admin' :
                  cluster.name.toLowerCase().includes('home') ? 'personal' :
                  'general';
    
    return {
      id: cluster.id,
      title: cluster.name,
      theme,
      mood,
      progressPercent,
      taskCount: clusterTasks.length,
      completedCount: completedTasks.length,
      lastActivity: formatLastActivity(daysSinceActivity),
      keyTasks,
      suggestedNextStep,
      frictionNote,
      energyTag,
      timeHorizon,
      allTaskIds: cluster.tasks, // Store all task IDs for filtering
    } as TaskStoryline & { allTaskIds: string[] };
  });
};

// Simple fallback clustering by category
const fallbackClustering = (tasks: any[]): TaskStoryline[] => {
  const categories = new Map<string, any[]>();
  
  tasks.forEach(task => {
    const cat = task.category || 'inbox';
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)!.push(task);
  });
  
  const storylines: TaskStoryline[] = [];
  let index = 0;
  
  categories.forEach((catTasks, catName) => {
    const completedTasks = catTasks.filter(t => t.completed);
    const incompleteTasks = catTasks.filter(t => !t.completed);
    
    const progressPercent = catTasks.length > 0
      ? Math.round((completedTasks.length / catTasks.length) * 100)
      : 0;
    
    const daysSinceActivity = getDaysSinceActivity(catTasks);
    const mood = getMoodFromProgress(progressPercent, catTasks.length, daysSinceActivity);
    
    storylines.push({
      id: `fallback-${index++}`,
      title: catName.charAt(0).toUpperCase() + catName.slice(1),
      theme: catName,
      mood,
      progressPercent,
      taskCount: catTasks.length,
      completedCount: completedTasks.length,
      lastActivity: formatLastActivity(daysSinceActivity),
      keyTasks: incompleteTasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        is_focus: t.is_focus || false,
        is_tiny: false,
      })),
      suggestedNextStep: incompleteTasks.length > 0 ? `Start with "${incompleteTasks[0].title}"` : "All done!",
      energyTag: getEnergyTag(catTasks.length),
      timeHorizon: getTimeHorizon(incompleteTasks),
      allTaskIds: catTasks.map(t => t.id),
    });
  });
  
  return storylines.filter(s => s.taskCount > 0);
};

export const useTaskStorylines = (): UseTaskStorylinesResult => {
  const { tasks } = useTasks();
  const [storylines, setStorylines] = useState<TaskStoryline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const generateStorylines = async () => {
      if (!tasks || tasks.length === 0) {
        setStorylines([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Find today's primary focus task
        const today = new Date().toISOString().split('T')[0];
        const primaryFocusTask = tasks.find(t => t.is_focus && t.focus_date === today);
        
        // Try AI clustering first
        try {
          const clusterAnalysis = await clusterTasks(tasks, primaryFocusTask);
          
          if (clusterAnalysis.clusters.length > 0) {
            const generatedStorylines = buildStorylinesFromClusters(clusterAnalysis.clusters, tasks);
            setStorylines(generatedStorylines);
            setLoading(false);
            return;
          }
        } catch (clusterError) {
          console.warn('AI clustering failed, using fallback:', clusterError);
        }
        
        // Fallback to simple category-based grouping
        const fallbackStorylines = fallbackClustering(tasks);
        setStorylines(fallbackStorylines);
        
      } catch (err) {
        console.error('Error generating storylines:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate storylines');
        // Even on error, try fallback
        const fallbackStorylines = fallbackClustering(tasks);
        setStorylines(fallbackStorylines);
      } finally {
        setLoading(false);
      }
    };
    
    generateStorylines();
  }, [tasks]);
  
  return { storylines, loading, error };
};
