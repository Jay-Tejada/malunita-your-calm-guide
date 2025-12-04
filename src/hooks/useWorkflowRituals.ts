import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useTasks } from './useTasks';
import { useToast } from './use-toast';
import { agendaRouter } from '@/lib/agendaRouter';
import { priorityScorer } from '@/lib/priorityScorer';
import { contextMapper } from '@/lib/contextMapper';

interface RitualState {
  morningShown: boolean;
  middayShown: boolean;
  eveningShown: boolean;
  weeklyShown: boolean;
  lastCheckDate: string;
}

const RITUAL_STORAGE_KEY = 'malunita_ritual_state';

export function useWorkflowRituals() {
  const { profile } = useProfile();
  const { tasks } = useTasks();
  const { toast } = useToast();
  const [ritualState, setRitualState] = useState<RitualState>(() => {
    const stored = localStorage.getItem(RITUAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      morningShown: false,
      middayShown: false,
      eveningShown: false,
      weeklyShown: false,
      lastCheckDate: new Date().toDateString(),
    };
  });

  const saveRitualState = (newState: RitualState) => {
    localStorage.setItem(RITUAL_STORAGE_KEY, JSON.stringify(newState));
    setRitualState(newState);
  };

  const resetDailyRituals = () => {
    const today = new Date().toDateString();
    if (ritualState.lastCheckDate !== today) {
      saveRitualState({
        morningShown: false,
        middayShown: false,
        eveningShown: false,
        weeklyShown: ritualState.weeklyShown,
        lastCheckDate: today,
      });
    }
  };

  const triggerMorningRitual = async (skipCheck = false) => {
    if (!tasks || (!skipCheck && ritualState.morningShown)) return;

    const incompleteTasks = tasks.filter(t => !t.completed);

    try {
      // Get recent idea dumps or tasks for context
      let contextText = `Morning check-in for ${new Date().toLocaleDateString()}. `;
      
      if (incompleteTasks.length > 0) {
        const recentTaskTitles = incompleteTasks
          .slice(0, 10)
          .map(t => t.title)
          .join('. ');
        contextText += recentTaskTitles;
      } else {
        contextText += "What's on your mind today?";
      }

      // Call the intelligent Daily Command Center
      const { data: commandData, error: commandError } = await supabase.functions.invoke('daily-command-center', {
        body: { text: contextText }
      });

      if (commandError) {
        console.error('Command center error:', commandError);
        // Fallback to simple message
        const fallbackMessage = '🌅 Good morning! Ready to capture your day?';
        showMorningMessage(fallbackMessage);
        return;
      }

      const summary = commandData?.summary;
      if (!summary) {
        throw new Error('No summary received');
      }

      // Format structured summary with exact template
      let message = `🧭 **Daily Command Center**\nHere's your clarity for today.\n\n`;

      // 🔥 Priority Tasks
      message += `**🔥 Priority Tasks**\nWhat moves the needle the most.\n`;
      if (summary.priorityTasks && summary.priorityTasks.length > 0) {
        message += `${summary.priorityTasks.map((t: string) => `• ${t}`).join('\n')}\n\n`;
      } else {
        message += `• No items today\n\n`;
      }

      // 📅 Today's Schedule
      message += `**📅 Today's Schedule**\nTime-sensitive items.\n`;
      if (summary.todaysSchedule && summary.todaysSchedule.length > 0) {
        message += `${summary.todaysSchedule.map((t: string) => `• ${t}`).join('\n')}\n\n`;
      } else {
        message += `• No items today\n\n`;
      }

      // 🪶 Quick Wins
      message += `**🪶 Quick Wins**\nSimple clears to build momentum.\n`;
      if (summary.quickWins && summary.quickWins.length > 0) {
        message += `${summary.quickWins.map((t: string) => `• ${t}`).join('\n')}\n\n`;
      } else {
        message += `• No items today\n\n`;
      }

      // 🎉 Tiny Task Fiesta
      if (summary.tinyTaskCount > 0) {
        message += `**🎉 Tiny Task Fiesta**\nYou have ${summary.tinyTaskCount} tiny tasks queued.\nA perfect batch for a short sweep.\n\n`;
      }

      // 🧩 Context Notes
      message += `**🧩 Context Notes**\nDetails worth remembering, not doing.\n`;
      if (summary.contextNotes && summary.contextNotes.length > 0) {
        message += `${summary.contextNotes.map((n: string) => `• ${n}`).join('\n')}\n\n`;
      } else {
        message += `• No items today\n\n`;
      }

      // 💡 Executive Insight
      message += `**💡 Executive Insight**\n${summary.executiveInsight || 'Here is what actually matters today.'}`;

      showMorningMessage(message);

    } catch (error) {
      console.error('Morning ritual error:', error);
      const fallbackMessage = '🌅 Good morning! Ready to start your day?';
      showMorningMessage(fallbackMessage);
    }
  };

  const showMorningMessage = async (message: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const ritualPrefs = profile?.ritual_preferences || {};
      const actionLabel = ritualPrefs?.morning_ritual?.action_button || 'Start Planning';
      
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: '🌅 Daily Command Center',
            body: message.substring(0, 300),
            icon: '/icon-192.png',
            data: { type: 'morning-ritual', timestamp: Date.now() },
            actions: [
              {
                action: 'start-planning',
                title: `📋 ${actionLabel}`,
                icon: '/icon-192.png'
              },
              {
                action: 'dismiss',
                title: 'Later',
                icon: '/icon-192.png'
              }
            ],
            userId: user.id,
          }
        });
      } catch (error) {
        console.error('Failed to send morning ritual push notification:', error);
      }

      // TODO: conversation_history deprecated in Phase 2C consolidation
      // await supabase.from('conversation_history').insert({...});
    }

    if (document.visibilityState === 'visible') {
      toast({
        title: "Daily Command Center",
        description: message,
        duration: 15000,
      });
    }

    saveRitualState({ ...ritualState, morningShown: true });
  };

  const triggerMiddayCheckIn = async () => {
    if (!tasks || ritualState.middayShown) return;

    const completedToday = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      const today = new Date();
      return completedDate.toDateString() === today.toDateString();
    });

    const incompleteTasks = tasks.filter(t => !t.completed);
    const todayTasks = incompleteTasks.filter(t => {
      if (t.focus_date) {
        const focusDate = new Date(t.focus_date);
        return focusDate.toDateString() === new Date().toDateString();
      }
      return false;
    });

    let message = `📘 Midday check-in:\n`;
    
    if (completedToday.length > 0) {
      message += `✓ ${completedToday.length} task${completedToday.length > 1 ? 's' : ''} completed\n`;
    } else {
      message += `No tasks completed yet\n`;
    }

    if (todayTasks.length > 0) {
      message += `\n${todayTasks.length} important task${todayTasks.length > 1 ? 's' : ''} remaining for today`;
    }

    // Send push notification with action buttons
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const ritualPrefs = profile?.ritual_preferences || {};
      const actionLabel = ritualPrefs.midday_checkin?.action_button || 'View Tasks';
      
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: '📘 Midday Status',
            body: message,
            icon: '/icon-192.png',
            data: { type: 'midday-checkin', timestamp: Date.now() },
            actions: [
              {
                action: 'view-tasks',
                title: `✓ ${actionLabel}`,
                icon: '/icon-192.png'
              },
              {
                action: 'dismiss',
                title: 'Later',
                icon: '/icon-192.png'
              }
            ],
            userId: user.id,
          }
        });
      } catch (error) {
        console.error('Failed to send midday check-in push notification:', error);
      }
    }

    // Show toast only if app is active
    if (document.visibilityState === 'visible') {
      toast({
        title: "Midday Status",
        description: message,
        duration: 7000,
      });
    }

    saveRitualState({ ...ritualState, middayShown: true });
  };

  const triggerEveningShutdown = async () => {
    if (!tasks || ritualState.eveningShown) return;

    const completedToday = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      const today = new Date();
      return completedDate.toDateString() === today.toDateString();
    });

    const incompleteTodayTasks = tasks.filter(t => {
      if (t.completed) return false;
      if (t.focus_date) {
        const focusDate = new Date(t.focus_date);
        return focusDate.toDateString() === new Date().toDateString();
      }
      return false;
    });

    let message = `🌙 Evening wrap-up:\n`;

    if (completedToday.length > 0) {
      message += `✓ ${completedToday.length} task${completedToday.length > 1 ? 's' : ''} completed today\n`;
    }

    if (incompleteTodayTasks.length > 0) {
      message += `\n${incompleteTodayTasks.length} task${incompleteTodayTasks.length > 1 ? 's' : ''} to roll over to tomorrow`;
      
      // Auto-suggest rollover
      const rolloverIds = incompleteTodayTasks.slice(0, 5).map(t => t.id);
      if (rolloverIds.length > 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];
        
        for (const taskId of rolloverIds) {
          await supabase
            .from('tasks')
            .update({ focus_date: tomorrowDate })
            .eq('id', taskId);
        }
      }
    }

    message += `\n\nRest well. Tomorrow is a fresh start.`;

    // Send push notification with action buttons
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const ritualPrefs = profile?.ritual_preferences || {};
      const actionLabel = ritualPrefs.evening_shutdown?.action_button || 'Review Day';
      
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: '🌙 Day Complete',
            body: message.substring(0, 300),
            icon: '/icon-192.png',
            data: { type: 'evening-shutdown', timestamp: Date.now() },
            actions: [
              {
                action: 'review-day',
                title: `📝 ${actionLabel}`,
                icon: '/icon-192.png'
              },
              {
                action: 'dismiss',
                title: 'Done',
                icon: '/icon-192.png'
              }
            ],
            userId: user.id,
          }
        });
      } catch (error) {
        console.error('Failed to send evening shutdown push notification:', error);
      }

      // TODO: conversation_history deprecated in Phase 2C consolidation
      // await supabase.from('conversation_history').insert({...});
    }

    // Show toast only if app is active
    if (document.visibilityState === 'visible') {
      toast({
        title: "Day Complete",
        description: message,
        duration: 8000,
      });
    }

    saveRitualState({ ...ritualState, eveningShown: true });
  };

  const triggerWeeklyReset = async () => {
    if (!tasks || ritualState.weeklyShown) return;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const completedThisWeek = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      const completedDate = new Date(t.completed_at);
      return completedDate >= oneWeekAgo;
    });

    const stuckTasks = tasks.filter(t => {
      if (t.completed) return false;
      const createdDate = new Date(t.created_at);
      const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 7;
    });

    let message = `🗓️ Weekly Reset:\n\n`;
    
    if (completedThisWeek.length > 0) {
      message += `✓ ${completedThisWeek.length} tasks completed this week\n`;
      
      // Find biggest wins (high priority completed tasks)
      const bigWins = completedThisWeek.filter(t => 
        t.title.length > 20 || t.context?.includes('important')
      ).slice(0, 3);
      
      if (bigWins.length > 0) {
        message += `\n🏆 Biggest wins:\n${bigWins.map(t => `• ${t.title}`).join('\n')}\n`;
      }
    }

    if (stuckTasks.length > 0) {
      message += `\n⚠️ ${stuckTasks.length} task${stuckTasks.length > 1 ? 's' : ''} stuck for over a week\n`;
    }

    message += `\nNext week: Focus on what truly matters.`;

    // Send push notification with action buttons
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const ritualPrefs = profile?.ritual_preferences || {};
      const actionLabel = ritualPrefs.weekly_reset?.action_button || 'View Insights';
      
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: '🗓️ Weekly Review',
            body: message.substring(0, 300),
            icon: '/icon-192.png',
            data: { type: 'weekly-reset', timestamp: Date.now() },
            actions: [
              {
                action: 'view-insights',
                title: `📊 ${actionLabel}`,
                icon: '/icon-192.png'
              },
              {
                action: 'dismiss',
                title: 'Later',
                icon: '/icon-192.png'
              }
            ],
            userId: user.id,
          }
        });
      } catch (error) {
        console.error('Failed to send weekly reset push notification:', error);
      }

      // TODO: conversation_history deprecated in Phase 2C consolidation
      // await supabase.from('conversation_history').insert({...});
    }

    // Show toast only if app is active
    if (document.visibilityState === 'visible') {
      toast({
        title: "Weekly Review",
        description: message,
        duration: 12000,
      });
    }

    // Mark weekly as shown for the current week
    const sunday = new Date();
    sunday.setDate(sunday.getDate() - sunday.getDay());
    saveRitualState({ 
      ...ritualState, 
      weeklyShown: true,
      lastCheckDate: sunday.toDateString()
    });

    // Clean up old completed tasks (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await supabase
      .from('tasks')
      .delete()
      .eq('completed', true)
      .lt('completed_at', thirtyDaysAgo.toISOString());
  };

  const checkRitualTriggers = () => {
    if (!profile || !tasks) return;

    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    resetDailyRituals();

    // Get ritual preferences with defaults
    const ritualPrefs = profile.ritual_preferences || {
      morning_ritual: { enabled: true, start_hour: 6, end_hour: 10, action_button: "Start Planning" },
      midday_checkin: { enabled: true, start_hour: 12, end_hour: 15, action_button: "View Tasks" },
      evening_shutdown: { enabled: true, start_hour: 18, end_hour: 22, action_button: "Review Day" },
      weekly_reset: { enabled: true, day: 0, hour: 19, action_button: "View Insights" }
    };

    // Morning Ritual disabled - using DailyPriorityPrompt instead

    // Midday Check-in
    const middayPref = ritualPrefs.midday_checkin;
    if (middayPref.enabled && hour >= middayPref.start_hour && hour < middayPref.end_hour && !ritualState.middayShown) {
      triggerMiddayCheckIn();
    }

    // Evening Shutdown
    const eveningPref = ritualPrefs.evening_shutdown;
    if (eveningPref.enabled && hour >= eveningPref.start_hour && hour < eveningPref.end_hour && !ritualState.eveningShown) {
      triggerEveningShutdown();
    }

    // Weekly Reset
    const weeklyPref = ritualPrefs.weekly_reset;
    if (weeklyPref.enabled && dayOfWeek === weeklyPref.day && hour >= weeklyPref.hour && !ritualState.weeklyShown) {
      triggerWeeklyReset();
    }
  };

  useEffect(() => {
    // Check immediately on mount
    const checkInitial = () => {
      if (profile && tasks && tasks.length > 0) {
        checkRitualTriggers();
      }
    };
    
    checkInitial();

    // Check every 15 minutes
    const interval = setInterval(() => {
      if (profile && tasks && tasks.length > 0) {
        checkRitualTriggers();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [profile?.id, tasks?.length]); // Only re-run when user or task count changes

  return {
    ritualState,
    triggerMorningRitual,
    triggerMiddayCheckIn,
    triggerEveningShutdown,
    triggerWeeklyReset,
  };
}
