import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FlowSession as FlowSessionType } from '@/utils/taskCategorizer';

export interface FlowSessionRecord {
  id: string;
  user_id: string;
  created_at: string;
  status: 'scheduled' | 'active' | 'completed' | 'abandoned';
  session_type: string;
  title: string;
  description?: string;
  target_duration_minutes: number;
  started_at?: string;
  ended_at?: string;
  task_ids: string[];
  reflection?: string;
  tasks_completed: number;
}

export const useFlowSessions = () => {
  const [sessions, setSessions] = useState<FlowSessionRecord[]>([]);
  const [activeSession, setActiveSession] = useState<FlowSessionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch today's sessions
  const fetchTodaysSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('flow_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      setSessions(data as FlowSessionRecord[]);
      setActiveSession((data as FlowSessionRecord[]).find(s => s.status === 'active') || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodaysSessions();
  }, []);

  // Create session from generated cluster
  const createSession = async (session: FlowSessionType): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('flow_sessions')
      .insert({
        user_id: user.id,
        session_type: session.type,
        title: session.label,
        description: session.description,
        target_duration_minutes: session.estimatedMinutes,
        task_ids: session.tasks.map(t => t.id),
        status: 'scheduled',
      })
      .select()
      .single();

    if (data) {
      setSessions(prev => [data as FlowSessionRecord, ...prev]);
      return data.id;
    }
    return null;
  };

  // Start a session
  const startSession = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('flow_sessions')
      .update({ 
        status: 'active', 
        started_at: new Date().toISOString() 
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (data) {
      setActiveSession(data as FlowSessionRecord);
      setSessions(prev => prev.map(s => s.id === sessionId ? data as FlowSessionRecord : s));
    }
  };

  // Complete a session
  const completeSession = async (sessionId: string, reflection?: string, tasksCompleted?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Update session
    const { data, error } = await supabase
      .from('flow_sessions')
      .update({ 
        status: 'completed', 
        ended_at: new Date().toISOString(),
        reflection,
        tasks_completed: tasksCompleted || 0,
      })
      .eq('id', sessionId)
      .select()
      .single();

    // If there's a reflection, add to journal
    if (data && reflection) {
      const session = data as FlowSessionRecord;
      const duration = session.started_at 
        ? Math.round((new Date(session.ended_at!).getTime() - new Date(session.started_at).getTime()) / 60000)
        : session.target_duration_minutes;

      await supabase.from('journal_entries').insert({
        user_id: user.id,
        title: `${session.title} — ${new Date().toLocaleDateString()}`,
        content: `**Session completed**\n\n${tasksCompleted} tasks in ${duration} minutes.\n\n**Reflection:**\n${reflection}`,
      });
    }

    if (data) {
      setActiveSession(null);
      setSessions(prev => prev.map(s => s.id === sessionId ? data as FlowSessionRecord : s));
    }
    
    return data;
  };

  // Abandon a session
  const abandonSession = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('flow_sessions')
      .update({ 
        status: 'abandoned', 
        ended_at: new Date().toISOString() 
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (data) {
      setActiveSession(null);
      setSessions(prev => prev.map(s => s.id === sessionId ? data as FlowSessionRecord : s));
    }
  };

  return {
    sessions,
    activeSession,
    loading,
    createSession,
    startSession,
    completeSession,
    abandonSession,
    refetch: fetchTodaysSessions,
  };
};
