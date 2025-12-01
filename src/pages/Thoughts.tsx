import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Trash2 } from 'lucide-react';
import { useThoughts } from '@/hooks/useThoughts';
import { formatDistanceToNow } from 'date-fns';

const Thoughts = () => {
  const navigate = useNavigate();
  const { thoughts, isLoading, addThought, deleteThought, convertToTask } = useThoughts();
  const [input, setInput] = useState('');

  const handleCapture = () => {
    if (!input.trim()) return;
    addThought({ content: input.trim() });
    setInput('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-foreground/5">
        <button 
          onClick={() => navigate('/')} 
          className="text-foreground/30 hover:text-foreground/50 p-2 -ml-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-mono text-foreground/80">Thoughts</span>
        <div className="w-9" />
      </div>

      {/* Intro */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-sm text-muted-foreground/40 text-center">
          Not everything needs to be a task. Just think out loud.
        </p>
      </div>

      {/* Thoughts stream */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <p className="text-center text-muted-foreground/30 py-12">Loading...</p>
        ) : thoughts?.length === 0 ? (
          <p className="text-center text-muted-foreground/30 py-12">No thoughts yet</p>
        ) : (
          <div className="space-y-4">
            {thoughts?.map(thought => (
              <div 
                key={thought.id} 
                className="group py-3 border-b border-foreground/5"
              >
                <p className="font-mono text-sm text-foreground/70 whitespace-pre-wrap">
                  {thought.content}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground/30">
                    {formatDistanceToNow(new Date(thought.created_at), { addSuffix: true })}
                  </span>
                  
                  {/* Actions - visible on hover/tap */}
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => convertToTask(thought)}
                      className="text-[10px] text-foreground/40 hover:text-foreground/60 flex items-center gap-1"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Make task
                    </button>
                    <button
                      onClick={() => deleteThought(thought.id)}
                      className="text-foreground/30 hover:text-foreground/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input - fixed at bottom on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-foreground/5 px-4 py-3 pb-safe">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCapture();
            }
          }}
          placeholder="What's on your mind..."
          rows={2}
          className="w-full bg-transparent border border-foreground/10 rounded-lg py-2 px-3 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/20 resize-none"
        />
        <p className="text-[10px] text-muted-foreground/30 mt-1 text-right">
          Enter to save · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default Thoughts;
