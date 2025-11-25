import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Archive, Clock, HelpCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";

interface TaskGroup {
  group_title: string;
  reason: string;
  task_ids: string[];
}

interface QuickWin {
  task_id: string;
  reason: string;
}

interface ArchiveSuggestion {
  task_id: string;
  reason: string;
}

interface Question {
  task_id: string;
  question: string;
}

interface InboxCleanupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: {
    grouped_tasks: TaskGroup[];
    quick_wins: QuickWin[];
    archive_suggestions: ArchiveSuggestion[];
    questions: Question[];
  } | null;
  onCompleteGroup: (taskIds: string[]) => void;
  onSnoozeGroup: (taskIds: string[]) => void;
  onArchiveGroup: (taskIds: string[]) => void;
  onLogCleanup: (completed: number, archived: number, snoozed: number) => void;
}

export const InboxCleanupModal = ({
  open,
  onOpenChange,
  analysis,
  onCompleteGroup,
  onSnoozeGroup,
  onArchiveGroup,
  onLogCleanup,
}: InboxCleanupModalProps) => {
  const { tasks } = useTasks();
  const [selectedQuickWins, setSelectedQuickWins] = useState<Set<string>>(new Set());
  const [completedCount, setCompletedCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [snoozedCount, setSnoozedCount] = useState(0);

  if (!analysis) return null;

  const getTaskTitle = (taskId: string) => {
    return tasks?.find(t => t.id === taskId)?.title || taskId;
  };

  const handleCompleteQuickWins = async () => {
    const taskIds = Array.from(selectedQuickWins);
    await onCompleteGroup(taskIds);
    setCompletedCount(prev => prev + taskIds.length);
    setSelectedQuickWins(new Set());
  };

  const handleGroupAction = async (
    taskIds: string[],
    action: 'complete' | 'snooze' | 'archive'
  ) => {
    if (action === 'complete') {
      await onCompleteGroup(taskIds);
      setCompletedCount(prev => prev + taskIds.length);
    } else if (action === 'snooze') {
      await onSnoozeGroup(taskIds);
      setSnoozedCount(prev => prev + taskIds.length);
    } else if (action === 'archive') {
      await onArchiveGroup(taskIds);
      setArchivedCount(prev => prev + taskIds.length);
    }
  };

  const handleClose = () => {
    onLogCleanup(completedCount, archivedCount, snoozedCount);
    onOpenChange(false);
    setCompletedCount(0);
    setArchivedCount(0);
    setSnoozedCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Inbox Cleanup Assistant
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Quick Wins */}
            {analysis.quick_wins.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <h3 className="font-medium">Quick Wins ({"<"}5 min)</h3>
                  <Badge variant="secondary">{analysis.quick_wins.length}</Badge>
                </div>
                <div className="space-y-2 p-4 bg-accent/30 rounded-lg">
                  {analysis.quick_wins.map((qw) => (
                    <div key={qw.task_id} className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedQuickWins.has(qw.task_id)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedQuickWins);
                          if (checked) {
                            newSet.add(qw.task_id);
                          } else {
                            newSet.delete(qw.task_id);
                          }
                          setSelectedQuickWins(newSet);
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getTaskTitle(qw.task_id)}</p>
                        <p className="text-xs text-muted-foreground">{qw.reason}</p>
                      </div>
                    </div>
                  ))}
                  {selectedQuickWins.size > 0 && (
                    <Button
                      onClick={handleCompleteQuickWins}
                      size="sm"
                      className="w-full mt-2"
                    >
                      Complete {selectedQuickWins.size} Quick Win{selectedQuickWins.size > 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Grouped Tasks */}
            {analysis.grouped_tasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Grouped Tasks</h3>
                {analysis.grouped_tasks.map((group, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">{group.group_title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{group.reason}</p>
                    </div>
                    <div className="space-y-1">
                      {group.task_ids.map((id) => (
                        <p key={id} className="text-sm pl-2 border-l-2 border-border">
                          {getTaskTitle(id)}
                        </p>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGroupAction(group.task_ids, 'complete')}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGroupAction(group.task_ids, 'snooze')}
                        className="flex-1"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Snooze
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGroupAction(group.task_ids, 'archive')}
                        className="flex-1"
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Archive Suggestions */}
            {analysis.archive_suggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Archive Suggestions</h3>
                  <Badge variant="secondary">{analysis.archive_suggestions.length}</Badge>
                </div>
                <div className="space-y-2">
                  {analysis.archive_suggestions.map((suggestion) => (
                    <div
                      key={suggestion.task_id}
                      className="p-3 bg-muted/50 rounded-lg space-y-2"
                    >
                      <p className="text-sm font-medium">{getTaskTitle(suggestion.task_id)}</p>
                      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGroupAction([suggestion.task_id], 'archive')}
                      >
                        Archive This
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions */}
            {analysis.questions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Questions for You</h3>
                </div>
                <div className="space-y-2">
                  {analysis.questions.map((q) => (
                    <div key={q.task_id} className="p-3 bg-primary/5 rounded-lg">
                      <p className="text-sm font-medium mb-1">{getTaskTitle(q.task_id)}</p>
                      <p className="text-sm text-muted-foreground">{q.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
