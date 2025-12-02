import { Zap, Target, ClipboardList, AlertTriangle, MessageSquare, Play } from 'lucide-react';
import { FlowSession } from '@/utils/taskCategorizer';

interface FlowSessionCardProps {
  session: FlowSession;
  onStart: () => void;
}

const FlowSessionCard = ({ session, onStart }: FlowSessionCardProps) => {
  const icons: Record<string, JSX.Element> = {
    'zap': <Zap className="w-4 h-4" />,
    'target': <Target className="w-4 h-4" />,
    'clipboard': <ClipboardList className="w-4 h-4" />,
    'alert-triangle': <AlertTriangle className="w-4 h-4" />,
    'message-square': <MessageSquare className="w-4 h-4" />,
  };
  
  const colors: Record<string, string> = {
    'tiny_task_fiesta': 'text-amber-500',
    'focus_block': 'text-blue-500',
    'admin_hour': 'text-slate-500',
    'avoidance_buster': 'text-red-400',
    'communication_batch': 'text-green-500',
  };

  return (
    <div className="p-4 bg-foreground/[0.02] rounded-lg border border-foreground/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={colors[session.type]}>
          {icons[session.icon]}
        </div>
        <span className="font-mono text-sm text-foreground/70">{session.label}</span>
      </div>
      
      {/* Tasks preview */}
      <div className="space-y-1 mb-3">
        {session.tasks.slice(0, 4).map(task => (
          <p key={task.id} className="text-xs text-foreground/50 truncate">
            • {task.title}
          </p>
        ))}
        {session.tasks.length > 4 && (
          <p className="text-xs text-foreground/30">
            +{session.tasks.length - 4} more
          </p>
        )}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/40">
          ~{session.estimatedMinutes} min
        </span>
        <button
          onClick={onStart}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 rounded-md text-xs text-foreground/60 transition-colors"
        >
          <Play className="w-3 h-3" />
          Start Session
        </button>
      </div>
    </div>
  );
};

export default FlowSessionCard;
