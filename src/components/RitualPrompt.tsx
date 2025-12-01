import { Sun, Moon } from 'lucide-react';

interface RitualPromptProps {
  type: 'morning' | 'evening';
  onTap: () => void;
  onDismiss: () => void;
}

const RitualPrompt = ({ type, onTap, onDismiss }: RitualPromptProps) => {
  const isMorning = type === 'morning';
  
  return (
    <div 
      onClick={onTap}
      className="flex items-center justify-center gap-2 py-2 px-4 mx-auto rounded-full border border-foreground/10 bg-foreground/[0.02] cursor-pointer hover:bg-foreground/[0.04] transition-colors"
    >
      {isMorning ? (
        <Sun className="w-3.5 h-3.5 text-foreground/40" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-foreground/40" />
      )}
      <span className="text-xs text-foreground/50">
        {isMorning ? 'Start your day' : 'Wrap up your day'}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="text-foreground/20 hover:text-foreground/40 ml-1"
      >
        ×
      </button>
    </div>
  );
};

export default RitualPrompt;
