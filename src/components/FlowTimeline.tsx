import { useMemo } from 'react';
import { Play, Check, Clock, Zap, Target, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { FlowSession as GeneratedFlowSession, formatSessionDuration } from '@/utils/taskCategorizer';

interface FlowSession {
  id: string;
  title: string;
  session_type: string;
  status: 'scheduled' | 'active' | 'completed' | 'abandoned';
  started_at?: string;
  ended_at?: string;
  target_duration_minutes: number;
  tasks_completed?: number;
  task_ids: string[];
}

interface FlowTimelineProps {
  sessions: FlowSession[];
  suggestedSession?: GeneratedFlowSession | null;
  onStartSession: (id: string) => void;
  onViewSession: (id: string) => void;
  onCreateSuggested?: () => void;
}

const FlowTimeline = ({ sessions, suggestedSession, onStartSession, onViewSession, onCreateSuggested }: FlowTimelineProps) => {
  const icons: Record<string, JSX.Element> = {
    'tiny_task_fiesta': <Zap className="w-3.5 h-3.5" />,
    'focus_block': <Target className="w-3.5 h-3.5" />,
    'admin_hour': <ClipboardList className="w-3.5 h-3.5" />,
    'avoidance_buster': <Clock className="w-3.5 h-3.5" />,
    'communication_batch': <Clock className="w-3.5 h-3.5" />,
    'project_pulse': <Clock className="w-3.5 h-3.5" />,
  };

  const statusColors: Record<string, string> = {
    'scheduled': 'border-foreground/20 bg-transparent',
    'active': 'border-amber-500/50 bg-amber-500/10',
    'completed': 'border-green-500/30 bg-green-500/5',
    'abandoned': 'border-foreground/10 bg-foreground/5 opacity-50',
  };

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      // Active first, then scheduled, then completed
      const order = { active: 0, scheduled: 1, completed: 2, abandoned: 3 };
      return order[a.status] - order[b.status];
    });
  }, [sessions]);

  // Format the suggested session duration for display
  const formattedDuration = suggestedSession 
    ? formatSessionDuration(suggestedSession.estimatedMinutes)
    : '';

  if (sessions.length === 0) {
    return (
      <div className="px-4 py-6">
        {suggestedSession ? (
          <div className="text-center">
            <p className="text-sm text-foreground/50 mb-3">
              I see a group of tasks that could work as a {formattedDuration} block.
            </p>
            <button
              onClick={onCreateSuggested}
              className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-sm text-foreground/60 transition-colors"
            >
              Create "{suggestedSession.label}"
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-foreground/40 mb-1">
              Your day is wide open.
            </p>
            <p className="text-xs text-foreground/30">
              Flow Sessions will appear here when created.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-foreground/30 mb-3">
        Today's Sessions
      </p>
      
      <div className="space-y-2">
        {sortedSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => session.status === 'scheduled' 
              ? onStartSession(session.id) 
              : onViewSession(session.id)
            }
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-foreground/[0.02] ${statusColors[session.status]}`}
          >
            {/* Left: Status indicator */}
            <div className={`flex-shrink-0 ${
              session.status === 'active' ? 'text-amber-500' : 
              session.status === 'completed' ? 'text-green-500/70' : 
              'text-foreground/40'
            }`}>
              {session.status === 'active' && (
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
              {session.status === 'completed' && (
                <Check className="w-4 h-4" />
              )}
              {session.status === 'scheduled' && (
                <div className="w-2 h-2 rounded-full border border-foreground/30" />
              )}
            </div>
            
            {/* Middle: Session info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-foreground/40">
                  {icons[session.session_type]}
                </span>
                <span className="text-sm font-mono text-foreground/70">
                  {session.title}
                </span>
              </div>
              
              <p className="text-xs text-foreground/40 mt-0.5">
                {session.task_ids.length} tasks · {session.target_duration_minutes}m
                {session.status === 'completed' && session.tasks_completed && (
                  <span> · {session.tasks_completed} done</span>
                )}
              </p>
            </div>
            
            {/* Right: Time or action */}
            <div className="flex-shrink-0 text-right">
              {session.status === 'scheduled' && (
                <span className="text-xs text-foreground/40 flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  Start
                </span>
              )}
              {session.status === 'active' && session.started_at && (
                <span className="text-xs text-amber-500/70 font-mono">
                  {format(new Date(session.started_at), 'h:mm a')}
                </span>
              )}
              {session.status === 'completed' && session.ended_at && (
                <span className="text-xs text-foreground/30 font-mono">
                  {format(new Date(session.ended_at), 'h:mm a')}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FlowTimeline;