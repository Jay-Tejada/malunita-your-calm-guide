import { CaptureSession } from "@/hooks/useCaptureSessions";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LastCapturePreviewProps {
  session: CaptureSession;
  onClick: () => void;
}

export const LastCapturePreview = ({ session, onClick }: LastCapturePreviewProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full max-w-md mx-auto flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-accent/30 transition-all text-left"
    >
      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          {session.summary || "Recent capture"}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {session.task_ids.length} task{session.task_ids.length !== 1 ? 's' : ''}
          </span>
          {session.intent_tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs h-5">
              {tag}
            </Badge>
          ))}
          {session.intent_tags.length > 2 && (
            <span className="text-xs text-muted-foreground">+{session.intent_tags.length - 2}</span>
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
      </span>
    </button>
  );
};
