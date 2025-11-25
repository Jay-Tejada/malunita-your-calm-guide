import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CaptureSession } from "@/hooks/useCaptureSessions";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Clock, Tag } from "lucide-react";

interface CaptureHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: CaptureSession[];
  onSessionClick?: (session: CaptureSession) => void;
}

export const CaptureHistoryModal = ({
  open,
  onOpenChange,
  sessions,
  onSessionClick,
}: CaptureHistoryModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Capture History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSessionClick?.(session)}
                className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-foreground flex-1">
                    {session.summary || "No summary"}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">
                    {session.task_ids.length} task{session.task_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {session.intent_tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {session.intent_tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No capture history yet. Start recording to build your capture inbox!
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
