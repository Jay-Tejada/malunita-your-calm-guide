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

  const triggerMorningRitual = async () => {
    if (!tasks || ritualState.morningShown) return;

    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) return;

    // Prepare analysis data
    const ideaAnalysis = {
      summary: 'Morning planning session',
      topics: [],
      insights: [],
      decisions: [],
      ideas: [],
      followups: [],
      questions: [],
      emotional_tone: 'focused' as const,
    };

    const context = contextMapper(incompleteTasks, ideaAnalysis);
    const priorities = priorityScorer(incompleteTasks, ideaAnalysis, context);
    const routing = agendaRouter(incompleteTasks, context, priorities);

    const mustTasks = priorities.filter(p => p.priority === 'MUST').slice(0, 3);
    const bigTasks = priorities.filter(p => p.big_task);
    const fiestaReady = priorities.filter(p => p.fiesta_ready);

    let message = `🌅 Good morning! `;

    if (routing.today.length > 0) {
      message += `You have ${routing.today.length} tasks for today. `;
    }

    if (mustTasks.length > 0) {
      const mustTaskTitles = mustTasks
        .map(mt => incompleteTasks.find(t => t.id === mt.task_id)?.title)
        .filter(Boolean)
        .slice(0, 3);
      message += `\n\nPriority tasks:\n${mustTaskTitles.map(t => `• ${t}`).join('\n')}`;
    }

    if (bigTasks.length > 0) {
      const bigTask = incompleteTasks.find(t => t.id === bigTasks[0].task_id);
      if (bigTask) {
        message += `\n\n📦 Big focus: ${bigTask.title}`;
      }
    }

    if (fiestaReady.length >= 3) {
      message += `\n\n🎉 ${fiestaReady.length} tiny tasks ready for a Fiesta session`;
    }

    // Send push notification with action buttons
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: '🌅 Daily Command Center',
            body: message.substring(0, 300), // Truncate for push notification
            icon: '/icon-192.png',
            data: { type: 'morning-ritual', timestamp: Date.now() },
            actions: [
              {
                action: 'start-planning',
                title: '📋 Start Planning',
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

      // Log to conversation history
      await supabase.from('conversation_history').insert({
        user_id: user.id,
        session_id: `morning-${Date.now()}`,
        role: 'assistant',
        content: message,
      });
    }

    // Show toast only if app is active
    if (document.visibilityState === 'visible') {
      toast({
        title: "Daily Command Center",
        description: message,
        duration: 10000,
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
                title: '✓ View Tasks',
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
                title: '📝 Review Day',
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

      // Log to conversation history
      await supabase.from('conversation_history').insert({
        user_id: user.id,
        session_id: `evening-${Date.now()}`,
        role: 'assistant',
        content: message,
      });
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
                title: '📊 View Insights',
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

      // Log to conversation history
      await supabase.from('conversation_history').insert({
        user_id: user.id,
        session_id: `weekly-${Date.now()}`,
        role: 'assistant',
        content: message,
      });
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

    // Morning Ritual: 6am - 10am
    if (hour >= 6 && hour < 10 && !ritualState.morningShown) {
      triggerMorningRitual();
    }

    // Midday Check-in: 12pm - 3pm
    if (hour >= 12 && hour < 15 && !ritualState.middayShown) {
      triggerMiddayCheckIn();
    }

    // Evening Shutdown: 6pm - 10pm
    if (hour >= 18 && hour < 22 && !ritualState.eveningShown) {
      triggerEveningShutdown();
    }

    // Weekly Reset: Sunday morning
    if (dayOfWeek === 0 && hour >= 8 && hour < 12 && !ritualState.weeklyShown) {
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
