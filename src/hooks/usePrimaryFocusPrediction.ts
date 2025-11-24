import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { priorityScorer } from '@/lib/priorityScorer';

interface PredictionState {
  predictedTaskId: string | null;
  predictedTaskTitle: string | null;
  predictionMade: boolean;
  predictionDate: string | null;
}

export const usePrimaryFocusPrediction = () => {
  const [prediction, setPrediction] = useState<PredictionState>({
    predictedTaskId: null,
    predictedTaskTitle: null,
    predictionMade: false,
    predictionDate: null,
  });

  useEffect(() => {
    const makePrediction = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if we've already made a prediction today
      const storedPrediction = localStorage.getItem('primary-focus-prediction');
      if (storedPrediction) {
        try {
          const parsed = JSON.parse(storedPrediction);
          if (parsed.predictionDate === today) {
            setPrediction(parsed);
            return;
          }
        } catch (e) {
          console.error('Error parsing stored prediction:', e);
        }
      }

      // Check if user has already selected their ONE thing today
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingFocus } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_focus', true)
        .eq('focus_date', today)
        .maybeSingle();

      if (existingFocus) {
        // User already selected, no need to predict
        return;
      }

      // Generate prediction
      try {
        const predicted = await generatePrediction(user.id);
        
        if (predicted) {
          const newPrediction: PredictionState = {
            predictedTaskId: predicted.taskId,
            predictedTaskTitle: predicted.taskTitle,
            predictionMade: true,
            predictionDate: today,
          };
          
          setPrediction(newPrediction);
          localStorage.setItem('primary-focus-prediction', JSON.stringify(newPrediction));
          console.log('Primary focus prediction made:', predicted.taskTitle);
        }
      } catch (error) {
        console.error('Error making prediction:', error);
      }
    };

    makePrediction();
  }, []);

  const clearPrediction = () => {
    localStorage.removeItem('primary-focus-prediction');
    setPrediction({
      predictedTaskId: null,
      predictedTaskTitle: null,
      predictionMade: false,
      predictionDate: null,
    });
  };

  const checkPrediction = (selectedTaskId: string, selectedTaskTitle: string): boolean => {
    if (!prediction.predictionMade || !prediction.predictedTaskId) {
      return false;
    }

    // Check if the selected task matches our prediction
    const isMatch = 
      selectedTaskId === prediction.predictedTaskId ||
      selectedTaskTitle.toLowerCase().includes(prediction.predictedTaskTitle?.toLowerCase() || '') ||
      prediction.predictedTaskTitle?.toLowerCase().includes(selectedTaskTitle.toLowerCase());

    return isMatch;
  };

  return {
    prediction,
    checkPrediction,
    clearPrediction,
  };
};

async function generatePrediction(userId: string): Promise<{ taskId: string; taskTitle: string } | null> {
  try {
    // 1. Fetch last 7 days of focus history
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const { data: focusHistory } = await supabase
      .from('daily_focus_history')
      .select('focus_task, cluster_label')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: false });

    // 2. Fetch user's focus preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('focus_preferences, insights')
      .eq('id', userId)
      .maybeSingle();

    const focusPreferences = profile?.focus_preferences || {};

    // 3. Fetch today's open tasks
    const { data: openTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!openTasks || openTasks.length === 0) {
      return null;
    }

    // 4. Fetch today's scheduled events (tasks with reminders)
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: scheduledTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .gte('reminder_time', `${today}T00:00:00`)
      .lte('reminder_time', `${today}T23:59:59`);

    // 5. Score tasks using priorityScorer
    const scoredTasks = priorityScorer(
      openTasks,
      {
        summary: '',
        topics: [],
        insights: [],
        decisions: [],
        ideas: [],
        followups: [],
        questions: [],
        emotional_tone: 'neutral',
      },
      {
        projects: [],
        categories: [],
        people_mentions: [],
        implied_deadlines: [],
        time_sensitivity: [],
      }
    );

    // 6. Apply habit patterns and focus preferences
    const taskScoresWithWeights = openTasks.map(task => {
      const baseScore = scoredTasks.find(s => s.task_id === task.id);
      let score = 0;

      // Priority scoring
      if (baseScore?.priority === 'MUST') score += 10;
      else if (baseScore?.priority === 'SHOULD') score += 5;
      else score += 1;

      // Scheduled today bonus
      if (scheduledTasks?.some(st => st.id === task.id)) {
        score += 8;
      }

      // Recent completion pattern bonus
      const recentFocusTasks = focusHistory?.slice(0, 3).map(h => h.focus_task) || [];
      const titleWords = task.title.toLowerCase().split(' ');
      const matchesRecent = recentFocusTasks.some(ft => 
        titleWords.some(word => word.length > 3 && ft.toLowerCase().includes(word))
      );
      if (matchesRecent) score += 6;

      // Focus preferences bonus
      if (task.category && focusPreferences[task.category]) {
        const weight = focusPreferences[task.category] as number;
        score += weight * 20; // Scale up the subtle weight
      }

      // Cluster label preference
      const commonClusters = focusHistory?.map(h => h.cluster_label).filter(Boolean) || [];
      const clusterFrequency = commonClusters.reduce((acc, cluster) => {
        acc[cluster] = (acc[cluster] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // If this task's category matches a common cluster, boost it
      if (task.category && clusterFrequency[task.category]) {
        score += clusterFrequency[task.category] * 2;
      }

      // Effort consideration (prefer medium effort for ONE thing)
      if (baseScore?.effort === 'medium' || baseScore?.effort === 'small') {
        score += 3;
      } else if (baseScore?.effort === 'tiny') {
        score -= 2; // ONE thing should be substantial
      }

      return {
        taskId: task.id,
        taskTitle: task.title,
        score,
      };
    });

    // Sort by score and pick the highest
    taskScoresWithWeights.sort((a, b) => b.score - a.score);
    
    const topPrediction = taskScoresWithWeights[0];
    if (topPrediction && topPrediction.score > 5) {
      return {
        taskId: topPrediction.taskId,
        taskTitle: topPrediction.taskTitle,
      };
    }

    return null;
  } catch (error) {
    console.error('Error generating prediction:', error);
    return null;
  }
}
