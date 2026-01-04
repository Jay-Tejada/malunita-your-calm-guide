import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, subWeeks, format } from 'date-fns';

export interface WeeklyRemindData {
  priorities: string[];
  projectsTouched: string[];
  rolledOverTasks: string[];
  calendarHighlights: string[];
}

export const useWeeklyRemindData = () => {
  return useQuery({
    queryKey: ['weekly-remind-data'],
    queryFn: async (): Promise<WeeklyRemindData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
      const lastWeekEnd = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      const lastWeekStartStr = lastWeekStart.toISOString();
      const lastWeekEndStr = lastWeekEnd.toISOString();

      // Fetch data in parallel
      const [
        dailySessionsResult,
        projectsResult,
        rolledTasksResult,
      ] = await Promise.all([
        // Last week's daily sessions for priorities (top_focus)
        supabase
          .from('daily_sessions')
          .select('top_focus, priority_two, priority_three')
          .eq('user_id', user.id)
          .gte('date', format(lastWeekStart, 'yyyy-MM-dd'))
          .lt('date', format(lastWeekEnd, 'yyyy-MM-dd')),
        
        // Projects with activity last week (tasks completed)
        supabase
          .from('tasks')
          .select('project_id, projects!tasks_project_id_fkey(name)')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('completed_at', lastWeekStartStr)
          .lt('completed_at', lastWeekEndStr)
          .not('project_id', 'is', null),
        
        // Tasks created before last week that are still incomplete (rolled over)
        supabase
          .from('tasks')
          .select('title')
          .eq('user_id', user.id)
          .eq('completed', false)
          .lt('created_at', lastWeekStartStr)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      // Extract priorities from daily sessions
      const priorities: string[] = [];
      dailySessionsResult.data?.forEach((session) => {
        if (session.top_focus) priorities.push(session.top_focus);
        if (session.priority_two) priorities.push(session.priority_two);
        if (session.priority_three) priorities.push(session.priority_three);
      });
      const uniquePriorities = [...new Set(priorities)].slice(0, 5);

      // Extract unique project names
      const projectNames = new Set<string>();
      projectsResult.data?.forEach((task: any) => {
        if (task.projects?.name) {
          projectNames.add(task.projects.name);
        }
      });

      // Rolled over tasks
      const rolledOverTasks = rolledTasksResult.data?.map((t) => t.title) || [];

      // Calendar highlights - simplified (could be expanded with calendar integration)
      const calendarHighlights: string[] = [];
      // For now, we'll extract from daily sessions if they had focus set
      const sessionsWithFocus = dailySessionsResult.data?.filter(s => s.top_focus)?.length || 0;
      if (sessionsWithFocus > 0) {
        calendarHighlights.push(`${sessionsWithFocus} days with focus priorities set`);
      }

      return {
        priorities: uniquePriorities,
        projectsTouched: Array.from(projectNames),
        rolledOverTasks,
        calendarHighlights,
      };
    },
  });
};
