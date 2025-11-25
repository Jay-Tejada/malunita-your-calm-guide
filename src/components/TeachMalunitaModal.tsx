import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAILearning } from "@/hooks/useAILearning";
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TeachMalunitaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeachMalunitaModal({ open, onOpenChange }: TeachMalunitaModalProps) {
  const {
    corrections,
    trends,
    biasPatterns,
    confusionMatrix,
    totalCorrections,
    improvementLevel,
    isLoading,
  } = useAILearning();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Teach Malunita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Improvement Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Improvement Level</span>
              <span className="text-sm text-muted-foreground">
                {totalCorrections} corrections
              </span>
            </div>
            <Progress value={improvementLevel} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {improvementLevel < 100
                ? `${Math.ceil(50 - totalCorrections)} more corrections to reach max level`
                : "Maximum level reached! 🎉"}
            </p>
          </div>

          <Separator />

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {/* Last 10 Corrections */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Recent Corrections</h3>
                </div>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : corrections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No corrections yet. Start teaching Malunita by fixing AI outputs!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {corrections.map((correction) => (
                      <div
                        key={correction.id}
                        className="p-3 rounded-lg bg-muted/50 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{correction.task_title}</p>
                          <Badge variant="outline" className="text-xs">
                            {correction.correction_type || "general"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(correction.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Trends Learned */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Trends Malunita Has Learned</h3>
                </div>
                {trends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No trends detected yet. More corrections will help Malunita learn patterns!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {trends.map((trend) => (
                      <div
                        key={trend.id}
                        className="p-3 rounded-lg bg-muted/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {trend.total_corrections_analyzed} corrections analyzed
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(trend.analysis_date), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {trend.categorization_improvements && (
                          <p className="text-xs text-muted-foreground">
                            📊 {trend.categorization_improvements}
                          </p>
                        )}
                        {trend.suggestion_improvements && (
                          <p className="text-xs text-muted-foreground">
                            💡 {trend.suggestion_improvements}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Weak Areas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Areas to Improve</h3>
                </div>
                {confusionMatrix.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No confusion patterns detected. Malunita is learning well!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {confusionMatrix.slice(0, 5).map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-destructive/10 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Confusion {idx + 1}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            {entry.occurrence_count} times
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {entry.predicted_category && entry.actual_category && (
                            <p>
                              📂 Predicted: <strong>{entry.predicted_category}</strong> →
                              Actual: <strong>{entry.actual_category}</strong>
                            </p>
                          )}
                          {entry.predicted_priority && entry.actual_priority && (
                            <p>
                              🎯 Predicted: <strong>{entry.predicted_priority}</strong> →
                              Actual: <strong>{entry.actual_priority}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Your Bias Patterns */}
              {biasPatterns.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-medium">Your Preferences</h3>
                    <div className="space-y-2">
                      {biasPatterns.slice(0, 5).map((pattern) => (
                        <div
                          key={pattern.id}
                          className="p-3 rounded-lg bg-primary/5 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {pattern.pattern_type.replace(/_/g, " ")}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round((pattern.confidence || 0) * 100)}% confident
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Based on {pattern.sample_size || 0} samples
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
