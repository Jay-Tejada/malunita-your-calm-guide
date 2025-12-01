import { X } from "lucide-react";
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

  const isHighConfidence = confidence > 0.9;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onApply();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono transition-all",
        "hover:scale-105 active:scale-95",
        isHighConfidence 
          ? "bg-foreground/10 text-foreground/70 hover:bg-foreground/15"
          : "bg-foreground/5 text-foreground/50 hover:bg-foreground/10"
      )}
    >
      <span>→ {getSuggestionLabel()}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="hover:text-foreground transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </button>
  );
};
