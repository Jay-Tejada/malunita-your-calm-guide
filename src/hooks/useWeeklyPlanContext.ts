import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, addWeeks, format, subWeeks } from 'date-fns';

export interface PrioritySuggestion {
  text: string;
  source: 'project' | 'rollover' | 'reflection' | 'pattern';
  confidence: 'high' | 'medium' | 'low';
}

export interface CalendarConstraint {
  type: 'busy' | 'conflict' | 'overload';
  message: string;
  day?: string;
}

export interface WeeklyPlanContext {
  suggestedPriorities: PrioritySuggestion[];
  calendarConstraints: CalendarConstraint[];
  activeProjects: string[];
  rolloverTasks: Array<{ id: string; title: string; age: number }>;
  lastWeekReflection: { wentWell: string | null; feltOff: string | null } | null;
}

export const useWeeklyPlanContext = () => {
  return useQuery({
    queryKey: ['weekly-plan-context'],
    queryFn: async (): Promise<WeeklyPlanContext> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      const lastWeekStart = subWeeks(thisWeekStart, 1);

      // Fetch data in parallel
      const [
        projectsResult,
        rolloverTasksResult,
        reflectionResult,
        dailySessionsResult,
      ] = await Promise.all([
        // Active projects with recent activity
        supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('archived', false)
          .order('created_at', { ascending: false })
          .limit(10),

        // Tasks that have rolled over (created >7 days ago, still incomplete)
        supabase
          .from('tasks')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .eq('completed', false)
          .lt('created_at', lastWeekStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(10),

        // Last week's reflection
        supabase
          .from('weekly_reflections')
          .select('went_well, felt_off, themes_extracted')
          .eq('user_id', user.id)
          .eq('week_start', format(lastWeekStart, 'yyyy-MM-dd'))
          .maybeSingle(),

        // Recent daily sessions for pattern detection
        supabase
          .from('daily_sessions')
          .select('top_focus, priority_two, priority_three')
          .eq('user_id', user.id)
          .gte('date', format(subWeeks(new Date(), 2), 'yyyy-MM-dd'))
          .order('date', { ascending: false })
          .limit(14),
      ]);

      // Build suggested priorities
      const suggestedPriorities: PrioritySuggestion[] = [];

      // From recent daily sessions (recurring focus areas)
      const focusFrequency: Record<string, number> = {};
      dailySessionsResult.data?.forEach((session) => {
        [session.top_focus, session.priority_two, session.priority_three].forEach((focus) => {
          if (focus) {
            const key = focus.toLowerCase().trim();
            focusFrequency[key] = (focusFrequency[key] || 0) + 1;
          }
        });
      });

      // Top recurring focus items
      const recurringFocus = Object.entries(focusFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

      recurringFocus.forEach(([text]) => {
        suggestedPriorities.push({
          text: text.charAt(0).toUpperCase() + text.slice(1),
          source: 'pattern',
          confidence: 'high',
        });
      });

      // From active projects
      projectsResult.data?.slice(0, 2).forEach((project) => {
        if (!suggestedPriorities.some(p => p.text.toLowerCase().includes(project.name.toLowerCase()))) {
          suggestedPriorities.push({
            text: `Progress on ${project.name}`,
            source: 'project',
            confidence: 'medium',
          });
        }
      });

      // From rollover tasks (high-age items need attention)
      const oldestRollover = rolloverTasksResult.data?.[0];
      if (oldestRollover) {
        const age = Math.floor(
          (Date.now() - new Date(oldestRollover.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (age > 14) {
          suggestedPriorities.push({
            text: `Resolve: ${oldestRollover.title}`,
            source: 'rollover',
            confidence: 'high',
          });
        }
      }

      // Calendar constraints (simplified - based on rollover count)
      const calendarConstraints: CalendarConstraint[] = [];
      const rolloverCount = rolloverTasksResult.data?.length || 0;

      if (rolloverCount > 5) {
        calendarConstraints.push({
          type: 'overload',
          message: `${rolloverCount} tasks have been pending for over a week. Consider simplifying scope.`,
        });
      }

      // Rollover tasks with age
      const rolloverTasks = (rolloverTasksResult.data || []).map((task) => ({
        id: task.id,
        title: task.title,
        age: Math.floor(
          (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));

      return {
        suggestedPriorities: suggestedPriorities.slice(0, 5),
        calendarConstraints,
        activeProjects: projectsResult.data?.map((p) => p.name) || [],
        rolloverTasks,
        lastWeekReflection: reflectionResult.data
          ? { wentWell: reflectionResult.data.went_well, feltOff: reflectionResult.data.felt_off }
          : null,
      };
    },
  });
};
