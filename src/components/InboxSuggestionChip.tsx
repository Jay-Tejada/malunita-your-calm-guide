import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxSuggestionChipProps {
  suggestion: 'today' | 'someday' | 'work' | 'home' | 'gym';
  confidence: number;
  onApply: () => void;
  onDismiss: () => void;
}

export const InboxSuggestionChip = ({ 
  suggestion, 
  confidence, 
  onApply, 
  onDismiss 
}: InboxSuggestionChipProps) => {
  const getSuggestionLabel = () => {
    return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
  };

  return (
    <div 
      className="inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-xs text-foreground/50 font-mono">
        → {getSuggestionLabel()}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onApply();
        }}
        className="text-green-500/50 hover:text-green-500 transition-colors"
        title="Apply suggestion"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="text-foreground/30 hover:text-foreground/50 transition-colors"
        title="Dismiss suggestion"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
