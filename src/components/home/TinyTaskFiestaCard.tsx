import { X, Sparkles } from "lucide-react";

interface TinyTaskFiestaCardProps {
  onDismiss: () => void;
  onStart?: () => void;
}

/**
 * TinyTaskFiestaCard - Appears after Start My Day flow is completed
 * Shows a prompt to start a quick task session
 */
export const TinyTaskFiestaCard = ({ onDismiss, onStart }: TinyTaskFiestaCardProps) => {
  return (
    <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 max-w-xs w-full animate-fade-in">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-amber-500/10">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-medium text-foreground mb-1">
            Tiny Task Fiesta
          </h3>
          <p className="text-xs text-muted-foreground/70 mb-3">
            Quick wins to build momentum. Knock out a few small tasks in 5 minutes.
          </p>
          <button
            onClick={onStart}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Let's go →
          </button>
        </div>
      </div>
    </div>
  );
};
