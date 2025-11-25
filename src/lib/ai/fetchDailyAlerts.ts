import { supabase } from "@/integrations/supabase/client";

interface DeadlineWatcherResponse {
  due_tomorrow: string[];
  due_soon: string[];
  overdue: string[];
  missing_preparation: string[];
  alert_message: string;
}

interface FollowUpEngineResponse {
  follow_ups: Array<{
    task: string;
    days_waiting: number;
    severity: string;
  }>;
  critical_count: number;
}

interface DailyAlerts {
  headline: string;
  deadlines: {
    due_tomorrow: string[];
    due_soon: string[];
    overdue: string[];
    missing_preparation: string[];
  };
  followups: Array<{
    task: string;
    days_waiting: number;
    severity: string;
  }>;
  risk_count: number;
}

export async function fetchDailyAlerts(): Promise<DailyAlerts | null> {
  try {
    // Call both edge functions in parallel
    const [deadlineResult, followUpResult] = await Promise.allSettled([
      supabase.functions.invoke<DeadlineWatcherResponse>('deadline-watcher'),
      supabase.functions.invoke<FollowUpEngineResponse>('follow-up-engine'),
    ]);

    // Extract deadline data
    const deadlineData = deadlineResult.status === 'fulfilled' && !deadlineResult.value.error
      ? deadlineResult.value.data
      : null;

    // Extract follow-up data
    const followUpData = followUpResult.status === 'fulfilled' && !followUpResult.value.error
      ? followUpResult.value.data
      : null;

    // If no data from either source, return null
    if (!deadlineData && !followUpData) {
      return null;
    }

    // Calculate risk count
    const overdueCount = deadlineData?.overdue?.length || 0;
    const dueTomorrowCount = deadlineData?.due_tomorrow?.length || 0;
    const missingPrepCount = deadlineData?.missing_preparation?.length || 0;
    const criticalFollowUps = followUpData?.critical_count || 0;
    
    const riskCount = overdueCount + dueTomorrowCount + missingPrepCount + criticalFollowUps;

    // If no risks detected, return null
    if (riskCount === 0) {
      return null;
    }

    // Generate headline based on highest priority issue
    let headline = "";
    if (overdueCount > 0) {
      headline = `${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} need attention`;
    } else if (missingPrepCount > 0) {
      headline = `${missingPrepCount} task${missingPrepCount > 1 ? 's' : ''} need preparation`;
    } else if (criticalFollowUps > 0) {
      headline = `${criticalFollowUps} critical follow-up${criticalFollowUps > 1 ? 's' : ''}`;
    } else if (dueTomorrowCount > 0) {
      headline = `${dueTomorrowCount} task${dueTomorrowCount > 1 ? 's' : ''} due tomorrow`;
    } else {
      headline = "Review upcoming deadlines";
    }

    return {
      headline,
      deadlines: {
        due_tomorrow: deadlineData?.due_tomorrow || [],
        due_soon: deadlineData?.due_soon || [],
        overdue: deadlineData?.overdue || [],
        missing_preparation: deadlineData?.missing_preparation || [],
      },
      followups: followUpData?.follow_ups || [],
      risk_count: riskCount,
    };
  } catch (error) {
    console.error('Error fetching daily alerts:', error);
    return null;
  }
}
