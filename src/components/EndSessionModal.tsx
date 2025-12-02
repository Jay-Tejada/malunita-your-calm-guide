import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

interface EndSessionModalProps {
  session: {
    id: string;
    title: string;
    started_at: string;
    target_duration_minutes: number;
    task_ids: string[];
  };
  tasksCompleted: number;
  onComplete: (reflection?: string) => void;
  onAbandon: () => void;
  onCancel: () => void;
}

const EndSessionModal = ({ 
  session, 
  tasksCompleted, 
  onComplete, 
  onAbandon, 
  onCancel 
}: EndSessionModalProps) => {
  const [reflection, setReflection] = useState('');
  const [mode, setMode] = useState<'choose' | 'reflect'>('choose');

  const elapsedMinutes = Math.round(
    (Date.now() - new Date(session.started_at).getTime()) / 60000
  );
  
  const isEarly = elapsedMinutes < session.target_duration_minutes * 0.5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onCancel} />
      
      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-xl max-w-sm w-full p-6">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-foreground/30 hover:text-foreground/50"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'choose' && (
          <div className="animate-fade-in">
            <h3 className="font-mono text-lg text-foreground/80 mb-2">
              End session?
            </h3>
            
            <p className="text-sm text-foreground/50 mb-4">
              {elapsedMinutes} min · {tasksCompleted} of {session.task_ids.length} tasks done
            </p>
            
            {isEarly && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 text-amber-500/70 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-600/70">
                  You're ending early. That's okay — some progress beats none.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={() => setMode('reflect')}
                className="w-full py-2.5 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-sm text-foreground/70 transition-colors"
              >
                <Check className="w-4 h-4 inline mr-2" />
                Complete session
              </button>
              
              <button
                onClick={onAbandon}
                className="w-full py-2.5 text-sm text-foreground/40 hover:text-foreground/60"
              >
                Abandon (won't count)
              </button>
            </div>
          </div>
        )}

        {mode === 'reflect' && (
          <div className="animate-fade-in">
            <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">
              Quick reflection (optional)
            </p>
            
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How did it go?"
              className="w-full bg-transparent border border-foreground/10 rounded-lg p-3 text-sm font-mono text-foreground/70 placeholder:text-foreground/30 resize-none focus:outline-none focus:border-foreground/20 mb-4"
              rows={3}
              autoFocus
            />
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => onComplete()}
                className="flex-1 py-2 text-sm text-foreground/40 hover:text-foreground/60"
              >
                Skip
              </button>
              <button
                onClick={() => onComplete(reflection)}
                className="flex-1 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg text-sm text-foreground/70"
              >
                Save & Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndSessionModal;